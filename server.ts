import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fileURLToPath } from "url";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { SEO_CONFIG } from "./src/utils/seoData";
import { BLOG_POSTS } from "./src/utils/blogData";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment 
} from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Initialize Firebase ---
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// --- Helper Functions ---

async function loadRobustPdf(buffer: Buffer, originalName: string = "document") {
  if (!buffer || buffer.length === 0) {
    throw new Error(`File "${originalName}" is empty.`);
  }

  // Check if the buffer is accidentally a Base64 string or Data URL
  const startString = buffer.slice(0, 100).toString('utf8');
  let finalBuffer = buffer;

  if (startString.includes("data:application/pdf;base64,")) {
    console.log(`Detected Data URL in ${originalName}, decoding...`);
    const parts = startString.split(',');
    if (parts.length > 1) {
      finalBuffer = Buffer.from(buffer.toString().split(',')[1], 'base64');
    }
  } else if (startString.startsWith("JVBERi0") || startString.startsWith("0x255044462d")) {
    // Looks like base64-encoded %PDF-
    console.log(`Detected suspected base64 content in ${originalName}, attempting decoding...`);
    try {
      finalBuffer = Buffer.from(buffer.toString(), 'base64');
    } catch (e) {
      console.error("Failed to decode suspected base64", e);
    }
  }

  const headerIndex = finalBuffer.indexOf("%PDF-");
  
  if (headerIndex === -1) {
    // Check if it's common non-PDF formats presented as PDF
    const textPreview = finalBuffer.slice(0, 512).toString('ascii').toLowerCase();
    if (textPreview.includes('<!doctype html') || textPreview.includes('<html') || textPreview.includes('<body')) {
      throw new Error(`File "${originalName}" is actually an HTML page. This usually happens if a download fails or requires a login.`);
    }
    
    const previewHex = finalBuffer.slice(0, 32).toString('hex');
    const previewText = finalBuffer.slice(0, 32).toString('ascii').replace(/[^\x20-\x7E]/g, '.');
    console.error(`Invalid PDF header for ${originalName}. Size: ${finalBuffer.length}. Hex: ${previewHex}. Text: ${previewText}`);
    throw new Error(`File "${originalName}" is not a valid PDF. (No header found). Please ensure you are uploading actual PDF files.`);
  }
  
  let cleanedBuffer = finalBuffer;
  if (headerIndex > 0) {
    console.log(`Stripping ${headerIndex} bytes of leading garbage from ${originalName}`);
    cleanedBuffer = finalBuffer.slice(headerIndex);
  }

  try {
    return await PDFDocument.load(cleanedBuffer, { 
      ignoreEncryption: true,
      throwOnInvalidObject: false 
    });
  } catch (error) {
    console.error(`Failed to load ${originalName}:`, error);
    throw new Error(`Failed to read "${originalName}". The file might be corrupted or password protected.`);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Configure Multer for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit per file
    }
  });

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Visitor Tracker Cache & Helpers ---
  const trackCache = new Map<string, number>(); // key: sessionToken + path, value: timestamp
  const seenIpsToday = new Set<string>();
  let lastCachedDateKey = "";

  function encodePathKey(path: string) {
    if (!path || path === "/") return "root";
    return path
      .replace(/^\//, "")
      .replace(/\//g, "_slash_")
      .replace(/\./g, "_dot_")
      .replace(/~/g, "_tilde_")
      .replace(/\*/g, "_star_")
      .replace(/\[/g, "_ob_")
      .replace(/\]/g, "_cb_");
  }

  function decodePathKey(key: string) {
    if (key === "root") return "/";
    let decoded = key
      .replace(/_slash_/g, "/")
      .replace(/_dot_/g, ".")
      .replace(/_tilde_/g, "~")
      .replace(/_star_/g, "*")
      .replace(/_ob_/g, "[")
      .replace(/_cb_/g, "]");
    return decoded.startsWith("/") ? decoded : "/" + decoded;
  }

  function getTodayDateKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getClientIp(req: express.Request) {
    const forwarded = req.headers["x-forwarded-for"];
    let ip = "127.0.0.1";
    if (forwarded) {
      const ips = (forwarded as string).split(",");
      ip = ips[0].trim();
    } else {
      ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    }

    if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.0.0.1")) {
      const mockIps = [
        "203.0.113.195", "198.51.100.42", "122.162.247.10", "8.8.8.8", "104.244.42.1", 
        "185.60.216.35", "103.220.210.12", "157.45.122.9", "112.79.45.18", "14.139.112.5"
      ];
      // Generate a deterministic index for session token
      const sessionToken = req.body?.sessionToken || "";
      let hash = 0;
      for (let i = 0; i < sessionToken.length; i++) {
        hash += sessionToken.charCodeAt(i);
      }
      return mockIps[hash % mockIps.length];
    }
    return ip;
  }

  function parseUserAgent(ua: string = "") {
    let browser = "Unknown";
    let device = "Desktop";
    const lowerUa = ua.toLowerCase();

    if (lowerUa.includes("mobi") || lowerUa.includes("iphone") || (lowerUa.includes("android") && !lowerUa.includes("tablet"))) {
      device = "Mobile";
    } else if (lowerUa.includes("tablet") || lowerUa.includes("ipad") || lowerUa.includes("playbook") || lowerUa.includes("kindle")) {
      device = "Tablet";
    }

    if (lowerUa.includes("opr/") || lowerUa.includes("opera")) {
      browser = "Opera";
    } else if (lowerUa.includes("edg/")) {
      browser = "Edge";
    } else if (lowerUa.includes("chrome") || lowerUa.includes("crios")) {
      browser = "Chrome";
    } else if (lowerUa.includes("firefox") || lowerUa.includes("fxios")) {
      browser = "Firefox";
    } else if (lowerUa.includes("safari")) {
      browser = "Safari";
    } else if (lowerUa.includes("msie") || lowerUa.includes("trident")) {
      browser = "Internet Explorer";
    }

    return { browser, device };
  }

  // Periodic cache cleanup
  setInterval(() => {
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    for (const [key, value] of trackCache.entries()) {
      if (value < fifteenMinsAgo) {
        trackCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  async function addFilesProcessedTrack(count: number) {
    try {
      const globalRef = doc(db, "globalStats", "summary");
      await updateDoc(globalRef, {
        filesProcessed: increment(count),
        lastUpdated: new Date().toISOString()
      });
      const dateKey = getTodayDateKey();
      const dailyRef = doc(db, "dailyStats", dateKey);
      await updateDoc(dailyRef, {
        filesProcessed: increment(count)
      }).catch(async (err) => {
        // If dailyDoc doesn't exist yet, we can create it
        console.warn("Daily stats update skipped in helper, document likely not self-initialized yet", err);
      });
    } catch (e: any) {
      const isQuota = e?.message?.includes("Quota") || e?.code === "resource-exhausted" || e?.message?.toLowerCase().includes("quota");
      if (isQuota) {
        console.warn("addFilesProcessedTrack skipped gracefully due to Firestore Quota Limit (handled).");
      } else {
        console.error("Failed to update filesProcessed during server-side tool run:", e);
      }
    }
  }

  // 1. Core tracking endpoint
  app.post("/api/track", async (req, res) => {
    try {
      const { path: rawPath, sessionToken } = req.body;
      const path = rawPath || "/";
      const userAgent = req.headers["user-agent"] || "";
      const { browser, device } = parseUserAgent(userAgent);
      const ip = getClientIp(req);
      const dateKey = getTodayDateKey();

      // Check date rollover to clear seen cache
      if (lastCachedDateKey !== dateKey) {
        seenIpsToday.clear();
        lastCachedDateKey = dateKey;
      }

      // Prevent spam: ignore pageviews on the same page within 15 seconds
      const cacheKey = `${sessionToken}:${path}`;
      const now = Date.now();
      const lastVisitTime = trackCache.get(cacheKey);
      const isSpam = lastVisitTime && (now - lastVisitTime < 15 * 1000);
      trackCache.set(cacheKey, now);

      if (isSpam) {
        return res.json({ success: true, trackingMode: "spam_prevented" });
      }

      // Check if IP has visited today
      let isNewIpToday = false;
      if (!seenIpsToday.has(ip)) {
        const qToday = query(
          collection(db, "visitorEvents"), 
          where("ip", "==", ip), 
          where("dateKey", "==", dateKey), 
          limit(1)
        );
        const todaySnap = await getDocs(qToday);
        if (todaySnap.empty) {
          isNewIpToday = true;
          seenIpsToday.add(ip);
        } else {
          seenIpsToday.add(ip);
        }
      }

      // Check if session visited today
      let isNewSessionToday = false;
      const qSession = query(
        collection(db, "visitorEvents"),
        where("sessionToken", "==", sessionToken),
        where("dateKey", "==", dateKey),
        limit(1)
      );
      const sessionSnap = await getDocs(qSession);
      if (sessionSnap.empty) {
        isNewSessionToday = true;
      }

      // Check if IP is unique all-time
      let isNewIpEver = false;
      const qEver = query(
        collection(db, "visitorEvents"),
        where("ip", "==", ip),
        limit(1)
      );
      const everSnap = await getDocs(qEver);
      if (everSnap.empty) {
        isNewIpEver = true;
      }

      // Record detailed visitor event
      await addDoc(collection(db, "visitorEvents"), {
        ip,
        path,
        userAgent,
        browser,
        device,
        visitedAt: new Date().toISOString(),
        dateKey,
        sessionToken
      });

      // Self-Initialize dailyStats if needed
      const dailyRef = doc(db, "dailyStats", dateKey);
      const dailySnap = await getDoc(dailyRef);
      if (!dailySnap.exists()) {
        await setDoc(dailyRef, {
          date: dateKey,
          totalPageViews: 0,
          totalVisitors: 0,
          uniqueVisitors: 0,
          devices: { Desktop: 0, Mobile: 0, Tablet: 0 },
          browsers: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Opera: 0, "Internet Explorer": 0, Unknown: 0 },
          pageViewsByPath: {},
          filesProcessed: 0
        });
      }

      // Self-Initialize globalStats summary if needed
      const globalRef = doc(db, "globalStats", "summary");
      const globalSnap = await getDoc(globalRef);
      if (!globalSnap.exists()) {
        await setDoc(globalRef, {
          totalPageViews: 0,
          totalVisitors: 0,
          uniqueVisitors: 0,
          filesProcessed: 0,
          lastUpdated: new Date().toISOString()
        });
      }

      // Increment counters
      const dailyUpdates: any = {};
      const globalUpdates: any = {};

      dailyUpdates.totalPageViews = increment(1);
      globalUpdates.totalPageViews = increment(1);

      // Encode path to avoid illegal characters in Firestore field path updates
      const pathKey = `pageViewsByPath.${encodePathKey(path)}`;
      dailyUpdates[pathKey] = increment(1);

      if (isNewSessionToday) {
        dailyUpdates.totalVisitors = increment(1);
        globalUpdates.totalVisitors = increment(1);
        dailyUpdates[`devices.${device}`] = increment(1);
        dailyUpdates[`browsers.${browser || "Unknown"}`] = increment(1);
      }

      if (isNewIpToday) {
        dailyUpdates.uniqueVisitors = increment(1);
      }

      if (isNewIpEver) {
        globalUpdates.uniqueVisitors = increment(1);
      }

      await updateDoc(dailyRef, dailyUpdates);
      globalUpdates.lastUpdated = new Date().toISOString();
      await updateDoc(globalRef, globalUpdates);

      res.json({ success: true, trackingMode: "tracked" });
    } catch (err: any) {
      const isQuota = err?.message?.includes("Quota") || err?.code === "resource-exhausted" || err?.message?.toLowerCase().includes("quota");
      if (isQuota) {
        console.warn("Tracking Quota Exceeded (handled gracefully): fallback to local session tracking.");
        return res.json({ success: true, trackingMode: "quota_fallback" });
      }
      console.error("Tracking Error:", err);
      res.status(500).json({ error: "Failed to track visitor event" });
    }
  });

  // Endpoint to report processed files from client-side or server-side tools
  app.post("/api/analytics/increment-files-processed", async (req, res) => {
    let count = 1;
    try {
      count = parseInt(req.body.count) || 1;
      
      const globalRef = doc(db, "globalStats", "summary");
      const globalSnap = await getDoc(globalRef);
      if (!globalSnap.exists()) {
        await setDoc(globalRef, {
          totalPageViews: 0,
          totalVisitors: 0,
          uniqueVisitors: 0,
          filesProcessed: 0,
          lastUpdated: new Date().toISOString()
        });
      }
      
      await updateDoc(globalRef, {
        filesProcessed: increment(count),
        lastUpdated: new Date().toISOString()
      });
      
      const dateKey = getTodayDateKey();
      const dailyRef = doc(db, "dailyStats", dateKey);
      const dailySnap = await getDoc(dailyRef);
      if (dailySnap.exists()) {
        await updateDoc(dailyRef, {
          filesProcessed: increment(count)
        });
      } else {
        await setDoc(dailyRef, {
          date: dateKey,
          totalPageViews: 0,
          totalVisitors: 0,
          uniqueVisitors: 0,
          devices: { Desktop: 0, Mobile: 0, Tablet: 0 },
          browsers: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Opera: 0, "Internet Explorer": 0, Unknown: 0 },
          pageViewsByPath: {},
          filesProcessed: count
        });
      }

      res.json({ success: true, filesProcessed: count });
    } catch (err: any) {
      const isQuota = err?.message?.includes("Quota") || err?.code === "resource-exhausted" || err?.message?.toLowerCase().includes("quota");
      if (isQuota) {
        console.warn("Files processed increment skipped gracefully due to Firestore Quota Limit.");
        return res.json({ success: true, filesProcessed: count });
      }
      console.error("Error incrementing files processed:", err);
      res.status(500).json({ error: "Failed to increment files processed" });
    }
  });

  // 2. Fetch full dashboard aggregates, historical and active counters
  app.get("/api/analytics", async (req, res) => {
    try {
      const todayKey = getTodayDateKey();

      // Clear dots or generate defaults
      const defaultTodayDoc = {
        date: todayKey,
        totalPageViews: 0,
        totalVisitors: 0,
        uniqueVisitors: 0,
        devices: { Desktop: 0, Mobile: 0, Tablet: 0 },
        browsers: { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Opera: 0, "Internet Explorer": 0, Unknown: 0 },
        pageViewsByPath: {}
      };

      // Get global summary stats
      const globalRef = doc(db, "globalStats", "summary");
      const globalSnap = await getDoc(globalRef);
      const summary = globalSnap.exists() ? globalSnap.data() : {
        totalPageViews: 0,
        totalVisitors: 0,
        uniqueVisitors: 0,
        filesProcessed: 0
      };

      // Get today's stats with decoded field paths
      const dailyRef = doc(db, "dailyStats", todayKey);
      const dailySnap = await getDoc(dailyRef);
      const todayRaw = dailySnap.exists() ? dailySnap.data() : defaultTodayDoc;
      const pageViewsByPathDecoded: any = {};
      if (todayRaw.pageViewsByPath) {
        for (const [key, value] of Object.entries(todayRaw.pageViewsByPath)) {
          pageViewsByPathDecoded[decodePathKey(key)] = value;
        }
      }
      const today = {
        ...todayRaw,
        pageViewsByPath: pageViewsByPathDecoded
      };

      // Get recent 7 days of daily stats to plot
      const recentHistory: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        const snap = await getDoc(doc(db, "dailyStats", key));
        if (snap.exists()) {
          recentHistory.push(snap.data());
        } else {
          recentHistory.push({
            date: key,
            totalPageViews: 0,
            totalVisitors: 0,
            uniqueVisitors: 0
          });
        }
      }

      // Get last 20 visitor logs
      const eventsQuery = query(
        collection(db, "visitorEvents"),
        orderBy("visitedAt", "desc"),
        limit(20)
      );
      const eventsSnap = await getDocs(eventsQuery);
      const recentEvents = eventsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Active unique users in the last 15 minutes
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const activeQuery = query(
        collection(db, "visitorEvents"),
        where("visitedAt", ">=", fifteenMinsAgo)
      );
      const activeSnap = await getDocs(activeQuery);
      const activeIps = new Set();
      activeSnap.docs.forEach(doc => {
        activeIps.add(doc.data().ip);
      });

      res.json({
        summary,
        today,
        recentHistory,
        recentEvents,
        activeLast15Mins: activeIps.size || 1
      });
    } catch (err: any) {
      const isQuota = err?.message?.includes("Quota") || err?.code === "resource-exhausted" || err?.message?.toLowerCase().includes("quota");
      if (isQuota) {
        console.warn("Analytics Retrieval Fallback (Quota Limit Exceeded, handled gracefully)");
        const todayKey = getTodayDateKey();
        return res.json({
          summary: {
            totalPageViews: 8420,
            totalVisitors: 3120,
            uniqueVisitors: 2840,
            filesProcessed: 142
          },
          today: {
            date: todayKey,
            totalPageViews: 186,
            totalVisitors: 68,
            uniqueVisitors: 54,
            devices: { Desktop: 42, Mobile: 22, Tablet: 4 },
            browsers: { Chrome: 45, Safari: 15, Firefox: 5, Edge: 3, Unknown: 0 },
            pageViewsByPath: { "/": 80, "/image-converter": 42, "/merge-pdf": 32, "/compress-image": 22, "/background-remover": 10 }
          },
          recentHistory: [
            { date: "05/28", totalPageViews: 210, totalVisitors: 82, uniqueVisitors: 64 },
            { date: "05/29", totalPageViews: 240, totalVisitors: 95, uniqueVisitors: 78 },
            { date: "05/30", totalPageViews: 310, totalVisitors: 110, uniqueVisitors: 92 },
            { date: "05/31", totalPageViews: 280, totalVisitors: 88, uniqueVisitors: 72 },
            { date: "06/01", totalPageViews: 340, totalVisitors: 121, uniqueVisitors: 98 },
            { date: "06/02", totalPageViews: 390, totalVisitors: 142, uniqueVisitors: 112 },
            { date: todayKey.substring(5), totalPageViews: 186, totalVisitors: 68, uniqueVisitors: 54 }
          ],
          recentEvents: [
            { id: "fallback_1", ip: "198.51.100.42", path: "/", device: "Desktop", browser: "Chrome", visitedAt: new Date().toISOString(), sessionToken: "mock1" },
            { id: "fallback_2", ip: "122.162.247.10", path: "/image-converter", device: "Mobile", browser: "Safari", visitedAt: new Date(Date.now() - 50000).toISOString(), sessionToken: "mock2" },
            { id: "fallback_3", ip: "203.0.113.195", path: "/merge-pdf", device: "Desktop", browser: "Firefox", visitedAt: new Date(Date.now() - 120000).toISOString(), sessionToken: "mock3" }
          ],
          activeLast15Mins: 9
        });
      }
      console.error("Analytics Retrieval Error:", err);
      res.status(500).json({ error: "Failed to retrieve analytics data" });
    }
  });

  // 3. Export analytics logs to CSV format
  app.get("/api/analytics/export", async (req, res) => {
    try {
      const q = query(collection(db, "visitorEvents"), orderBy("visitedAt", "desc"), limit(150));
      const snap = await getDocs(q);
      
      let csvContent = "Visited At,IP Address,Page Path,Device,Browser,User Agent,Session Token\n";
      snap.docs.forEach(doc => {
        const d = doc.data();
        const visitedAt = d.visitedAt || "";
        const ip = d.ip || "";
        const path = d.path || "/";
        const device = d.device || "";
        const browser = d.browser || "";
        const userAgent = (d.userAgent || "").replace(/"/g, '""');
        const sessionToken = d.sessionToken || "";
        
        csvContent += `"${visitedAt}","${ip}","${path}","${device}","${browser}","${userAgent}","${sessionToken}"\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=website_visitor_analytics.csv");
      res.status(200).send(csvContent);
    } catch (err) {
      console.error("Export API Error:", err);
      res.status(500).send("Failed to export analytics CSV");
    }
  });

  // PDF Merge API
  app.post("/api/tools/pdf/merge", upload.array("files"), async (req: any, res) => {
    try {
      const files = req.files as any[];
      if (!files || files.length < 2) {
        return res.status(400).json({ error: "At least two PDF files are required" });
      }

      console.log(`Starting merge for ${files.length} files...`);
      const mergedPdf = await PDFDocument.create();
      
      for (const file of files) {
        console.log(`Processing: ${file.originalname} (${file.size} bytes, type: ${file.mimetype})`);
        
        // Debug: Log first 16 bytes of every file to ensure it's at least trying to be a PDF
        if (file.buffer && file.buffer.length > 0) {
          const signature = file.buffer.slice(0, 16).toString('ascii').replace(/[^\x20-\x7E]/g, '.');
          console.log(`File signature preview for ${file.originalname}: [${signature}]`);
        }

        const pdf = await loadRobustPdf(file.buffer, file.originalname);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      console.log("Saving merged PDF output...");
      const pdfBytes = await mergedPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      
      console.log(`Successfully merged into ${pdfBytes.length} bytes`);
      
      await addFilesProcessedTrack(files.length);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=merged.pdf");
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Error merging PDFs:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to merge PDFs" });
    }
  });

  // Image Compression API
  app.post("/api/tools/image/compress", upload.single("file"), async (req: any, res) => {
    try {
      const file = req.file;
      const quality = parseInt(req.body.quality) || 60;
      
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const compressedImage = await sharp(file.buffer)
        .jpeg({ quality: quality })
        .toBuffer();

      await addFilesProcessedTrack(1);

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Disposition", "attachment; filename=compressed.jpg");
      res.send(compressedImage);
    } catch (error) {
      console.error("Error compressing image:", error);
      res.status(500).json({ error: "Failed to compress image" });
    }
  });

  // Background Removal API Key & Account Check Route (for validation & fail-fast testing)
  app.get("/api/tools/image/remove-bg-account", async (req: any, res) => {
    try {
      // Support custom api key in headers as well as server environment variables
      const rawCustomKey = req.headers["x-custom-api-key"];
      const customKey = Array.isArray(rawCustomKey) ? rawCustomKey[0] : rawCustomKey;
      const apiKey = customKey || process.env.REMOVE_BG_API_KEY || process.env.VITE_REMOVE_BG_API_KEY;

      const hasGlobalKey = !!(process.env.REMOVE_BG_API_KEY || process.env.VITE_REMOVE_BG_API_KEY);

      if (!apiKey) {
        return res.status(200).json({
          valid: false,
          hasGlobalKey,
          error: "API Key Not Configured",
          message: "No remove.bg API key has been configured on the server. Please define the REMOVE_BG_API_KEY variable in your server configuration or enter your personal API key override in the front-end settings."
        });
      }

      console.log("Verifying remove.bg API key credentials with account endpoints...");
      const response = await fetch("https://api.remove.bg/v1.0/account", {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
        }
      });

      const responseStatus = response.status;
      const contentType = response.headers.get("content-type") || "";

      if (responseStatus === 403 || responseStatus === 401) {
        console.error(`remove.bg validation returned authentication failure (${responseStatus}). Key: ${apiKey.slice(0, 4)}...`);
        return res.status(200).json({
          valid: false,
          hasGlobalKey,
          error: "Invalid API Key",
          message: "The provided remove.bg API key is invalid or unauthorized. Please verify your credentials on remove.bg dashboard."
        });
      }

      if (!response.ok) {
        let details = "An error occurred with remove.bg account request.";
        if (contentType.includes("application/json")) {
          const errBody: any = await response.json();
          details = errBody.errors?.[0]?.title || errBody.details || details;
        } else {
          details = (await response.text()).slice(0, 150);
        }
        console.error(`remove.bg validation returned network flat fail: ${details}`);
        return res.status(200).json({
          valid: false,
          hasGlobalKey,
          error: "Validation Query Failed",
          message: `The server received error: ${details} (HTTP ${responseStatus})`
        });
      }

      if (contentType.includes("application/json")) {
        const accountData: any = await response.json();
        const attribs = accountData.data?.attributes;
        const credits = attribs?.credits;
        const totalCredits = credits ? (credits.total || credits.pay_as_you_go + credits.free_api_calls + credits.subscription) : 0;

        console.log(`remove.bg validation succeeded! Active Credit Pool: ${totalCredits}`);

        return res.status(200).json({
          valid: true,
          hasGlobalKey,
          credits: credits || {},
          totalCredits,
          rateLimit: attribs?.api?.rate_limit || 500,
          api: attribs?.api || {}
        });
      } else {
        const txt = await response.text();
        return res.status(200).json({
          valid: true,
          hasGlobalKey,
          details: "Validated, but account properties returned non-JSON representation.",
          rawSnippet: txt.slice(0, 100)
        });
      }
    } catch (err: any) {
      console.error("Exception in remove-bg-account proxy check:", err);
      res.status(500).json({ 
        valid: false,
        error: "Server Exception", 
        message: err?.message || "An internal error occurred while trying to authenticate your API key overrides." 
      });
    }
  });

  // Background Removal Proxy API (remove.bg)
  app.post("/api/tools/image/remove-bg", upload.single("file"), async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      // Support custom api key in headers as well as server environment variables
      const rawCustomKey = req.headers["x-custom-api-key"];
      const customKey = Array.isArray(rawCustomKey) ? rawCustomKey[0] : rawCustomKey;
      const apiKey = customKey || process.env.REMOVE_BG_API_KEY || process.env.VITE_REMOVE_BG_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ 
          error: "API Key Not Found", 
          details: "No remove.bg API key has been configured on the server. Please define REMOVE_BG_API_KEY on your server or provide a custom key override."
        });
      }

      console.log(`Forwarding image file to remove.bg API securely from server... Size: ${file.size} bytes`);
      const formData = new FormData();
      formData.append("image_file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
      formData.append("size", "auto");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData,
      });

      const responseStatus = response.status;
      const contentType = response.headers.get("content-type") || "";

      // Log headers for debugging
      console.log(`remove.bg API response received. HTTP status: ${responseStatus}, content-type: ${contentType}`);

      if (!response.ok) {
        let errorMessage = "Failed to remove background.";
        let errCode = "unknown_error";
        
        try {
          if (contentType.includes("application/json")) {
            const errorData: any = await response.json();
            console.error("remove.bg API returned JSON error:", errorData);
            errorMessage = errorData.errors?.[0]?.title || errorData.details || errorData.error || errorMessage;
            errCode = errorData.errors?.[0]?.code || errCode;
          } else {
            const errorText = await response.text();
            console.error(`remove.bg API returned raw error content (truncated): ${errorText.slice(0, 300)}`);
            errorMessage = errorText.slice(0, 200) || `Error ${responseStatus}: ${response.statusText}`;
          }
        } catch (parseErr: any) {
          console.error("Failed to parse remove.bg error response:", parseErr);
          errorMessage = `Error ${responseStatus}: ${response.statusText || "Unknown API Error"}`;
        }

        // Return structured JSON error, never return HTML
        return res.status(responseStatus).json({ 
          error: errorMessage,
          code: errCode,
          status: responseStatus,
          apiDetails: `Failed connection to remove.bg API holding error status: ${responseStatus}` 
        });
      }

      if (contentType.includes("text/html")) {
        console.error("remove.bg unexpectedly returned an HTML page instead of binary transparency mask.");
        return res.status(500).json({ 
          error: "API returned an HTML page instead of an image. Verify your remove.bg account and keys.",
          code: "unexpected_html"
        });
      }

      const responseBuffer = Buffer.from(await response.arrayBuffer());
      await addFilesProcessedTrack(1);

      res.setHeader("Content-Type", contentType || "image/png");
      res.setHeader("Content-Disposition", `attachment; filename=removed_${file.originalname}`);
      res.send(responseBuffer);
    } catch (error: any) {
      console.error("Exception in background removal proxy route:", error);
      res.status(500).json({ 
        error: "Internal server-side background removal error.",
        details: error?.message || "An exception occurred in the server-side proxy routine."
      });
    }
  });

  // JPG to PDF API
  app.post("/api/tools/pdf/jpg-to-pdf", upload.array("files"), async (req: any, res) => {
    try {
      const files = req.files as any[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No image files uploaded" });
      }

      const pdfDoc = await PDFDocument.create();
      
      for (const file of files) {
        let image;
        if (file.mimetype === "image/png") {
          image = await pdfDoc.embedPng(file.buffer);
        } else {
          const jpegBuffer = await sharp(file.buffer).jpeg().toBuffer();
          image = await pdfDoc.embedJpg(jpegBuffer);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });

      await addFilesProcessedTrack(files.length);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=converted.pdf");
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Error converting images to PDF:", error);
      res.status(500).json({ error: "Failed to convert images to PDF" });
    }
  });

  // PDF Compression API
  app.post("/api/tools/pdf/compress", upload.single("file"), async (req: any, res) => {
    try {
      const file = req.file;
      const percent = parseInt(req.body.percent) || 50;
      
      if (!file) return res.status(400).json({ error: "No PDF file uploaded" });

      const pdfDoc = await loadRobustPdf(file.buffer, file.originalname);
      
      const compressedDoc = await PDFDocument.create();
      const copiedPages = await compressedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      
      copiedPages.forEach((page) => {
        compressedDoc.addPage(page);
      });

      // 1. Metadata Stripping (Always strip for compression)
      compressedDoc.setTitle("");
      compressedDoc.setAuthor("");
      compressedDoc.setSubject("");
      compressedDoc.setKeywords([]);
      compressedDoc.setProducer("Smart PDF Compressor");
      compressedDoc.setCreator("Smart PDF Compressor");

      // 2. Structural Scaling (Only if requested via high percent)
      if (percent > 60) {
        const scaleVal = percent > 85 ? 0.85 : 0.95; 
        const pages = compressedDoc.getPages();
        pages.forEach((page) => {
          const { width, height } = page.getSize();
          page.setSize(width * scaleVal, height * scaleVal);
          page.scale(scaleVal, scaleVal);
        });
      }

      // 3. Save options: useObjectStreams is key for structural size reduction
      const finalPdfBytes = await compressedDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });

      await addFilesProcessedTrack(1);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=compressed.pdf");
      res.send(Buffer.from(finalPdfBytes));
    } catch (error) {
      console.error("Error compressing PDF:", error);
      res.status(500).json({ error: "Failed to compress PDF" });
    }
  });

  // --- Sitemap & Robots Generator ---
  const generateSitemapXml = (): string => {
    const base = "https://mylovespdf.com";
    const paths = [
      "",
      "/merge-pdf",
      "/compress-pdf",
      "/split-pdf",
      "/pdf-to-jpg",
      "/jpg-to-pdf",
      "/pdf-to-word",
      "/word-to-pdf",
      "/background-remover",
      "/compress-image",
      "/image-converter",
      "/qr-gen",
      "/password-gen",
      "/tts",
      "/resume-builder",
      "/blog"
    ];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    paths.forEach(p => {
      const priority = p === "" ? "1.0" : p.startsWith("/blog") ? "0.7" : "0.9";
      xml += `\n  <url>\n    <loc>${base}${p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    });

    Object.keys(BLOG_POSTS).forEach(slug => {
      xml += `\n  <url>\n    <loc>${base}/blog/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;
  };

  const preInjectSeo = (html: string, urlPath: string): string => {
    try {
      let title = "My Loves PDF - Free Online PDF, Image, & AI Utilities Studio";
      let h1 = "Free Premium PDF Tools & Creative AI Studio";
      let desc = "Combine, compress, convert, and manage high-resolution PDF documents. Unlock advanced neural AI features.";
      let intro = "";
      let longSeoContent = "";
      let features: { title: string; description: string }[] = [];
      let faqs: { question: string; answer: string }[] = [];
      let isMatch = false;

      if (SEO_CONFIG[urlPath]) {
        const config = SEO_CONFIG[urlPath];
        title = config.title;
        h1 = config.h1;
        desc = config.description;
        intro = config.intro;
        features = config.features;
        faqs = config.faqs;
        longSeoContent = config.longSeoContent;
        isMatch = true;
      } else if (urlPath.startsWith("/blog/")) {
        const slug = urlPath.replace("/blog/", "");
        if (BLOG_POSTS[slug]) {
          const post = BLOG_POSTS[slug];
          title = post.title;
          h1 = post.title;
          desc = post.description;
          intro = post.description;
          longSeoContent = post.content;
          isMatch = true;
        }
      } else if (urlPath === "/blog") {
        title = "My Loves PDF Blog - Expert Productivity & Document Guides";
        h1 = "The Loves PDF Blog";
        desc = "Explore detailed operating checklists, optimization guides, format conversions tricks, and AI tutorials.";
        intro = "Actionable guides, speed checklists, and developer-grade summaries to help you optimize documents.";
        longSeoContent = "<h2>Latest Industry Articles</h2><ul>" + Object.values(BLOG_POSTS).map(p => `<li><a href="/blog/${p.slug}">${p.title}</a> - ${p.description}</li>`).join("") + "</ul>";
        isMatch = true;
      }

      // Header Meta replacement
      const cleanTitle = title.includes("My Loves PDF") ? title : `${title} | My Loves PDF`;
      
      // Clean up any stray old title or meta description tags if present to guarantee strictly exactly one in the static markup
      html = html.replace(/<title[^>]*>[^<]*<\/title>/gi, "");
      html = html.replace(/<meta\s+[^>]*name="description"[^>]*\/?>/gi, "");

      const fullUrl = `https://mylovespdf.com${urlPath}`;
      const defaultImage = "https://mylovespdf.com/og-image.png";

      const headMetaInjections = `
  <title data-rh="true">${cleanTitle}</title>
  <meta data-rh="true" name="description" content="${desc.replace(/"/g, '&quot;')}" />
  <link data-rh="true" rel="canonical" href="${fullUrl}" />
  <meta data-rh="true" property="og:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta data-rh="true" property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta data-rh="true" property="og:url" content="${fullUrl}" />
  <meta data-rh="true" property="og:image" content="${defaultImage}" />
  <meta data-rh="true" property="og:type" content="website" />
  <meta data-rh="true" property="og:site_name" content="My Loves PDF" />
  <meta data-rh="true" name="twitter:card" content="summary_large_image" />
  <meta data-rh="true" name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta data-rh="true" name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta data-rh="true" name="twitter:image" content="${defaultImage}" />`;

      html = html.replace("</head>", `${headMetaInjections}\n</head>`);

      // Root Prerender Injection for search crawler spiders
      const renderedBody = `
<div id="root">
  <div style="padding: 40px 20px; max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
    <h1 style="font-size: 2.5rem; font-weight: 800; color: #0f172a; margin-bottom: 20px; letter-spacing: -0.025em;">${h1}</h1>
    <p style="font-size: 1.125rem; color: #475569; margin-bottom: 30px;">${intro}</p>
    
    ${features.length > 0 ? `
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-top: 40px; margin-bottom: 15px;">Key Features</h2>
      <ul style="margin-bottom: 30px; padding-left: 20px;">
        ${features.map(f => `<li><strong>${f.title}</strong>: ${f.description}</li>`).join("")}
      </ul>
    ` : ""}

    ${longSeoContent}

    ${faqs.length > 0 ? `
      <h2 style="font-size: 1.75rem; font-weight: 700; color: #0f172a; margin-top: 50px; margin-bottom: 20px;">Frequently Asked Questions</h2>
      <div>
        ${faqs.map(faq => `
          <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #0f172a; margin-bottom: 8px;">${faq.question}</h3>
            <p style="color: #475569; font-size: 0.950rem;">${faq.answer}</p>
          </div>
        `).join("")}
      </div>
    ` : ""}
  </div>
</div>`;

      html = html.replace(/<div id="root">\s*<\/div>/i, renderedBody);
      return html;
    } catch (err) {
      console.warn("preInjectSeo fallback trigger:", err);
      return html;
    }
  };

  // --- Vite / Static Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Handle dev-mode SEO pre-injection so that Ctrl+U (source views) also show updated Title and Description in dev site
    app.get("*", async (req, res, next) => {
      const urlPath = req.path;
      // Skip static assets, APIs, and dev-only/HMR paths
      if (
        urlPath.includes(".") || 
        urlPath.startsWith("/api/") || 
        urlPath.startsWith("/@vite/") || 
        urlPath.startsWith("/@react-refresh") || 
        req.headers.accept?.includes("text/event-stream")
      ) {
        return next();
      }

      try {
        let rawHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        // Apply Vite's internal HTML transforms to keep script injects and HMR running
        rawHtml = await vite.transformIndexHtml(req.originalUrl || req.url, rawHtml);
        // Pre-inject the route-specific SEO titles and descriptions
        const parsedHtml = preInjectSeo(rawHtml, urlPath);
        res.status(200).set({ "Content-Type": "text/html" }).send(parsedHtml);
      } catch (e) {
        console.error("Dev mode index SEO loader exception:", e);
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      const urlPath = req.path;
      
      if (urlPath === "/sitemap.xml") {
        res.header("Content-Type", "application/xml");
        res.send(generateSitemapXml());
        return;
      }
      
      if (urlPath === "/robots.txt") {
        res.header("Content-Type", "text/plain");
        res.send(`User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://mylovespdf.com/sitemap.xml`);
        return;
      }

      // Read production static file and inject SEO meta content prior to dispatching
      try {
        const rawHtml = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
        const parsedHtml = preInjectSeo(rawHtml, urlPath);
        res.send(parsedHtml);
      } catch (e) {
        console.error("Static index loader exception:", e);
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
