import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fileURLToPath } from "url";
import fs from "fs";
import { initializeApp } from "firebase/app";
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
    } catch (e) {
      console.error("Failed to update filesProcessed during server-side tool run:", e);
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
      console.error("Tracking Error:", err);
      res.status(500).json({ error: "Failed to track visitor event" });
    }
  });

  // Endpoint to report processed files from client-side or server-side tools
  app.post("/api/analytics/increment-files-processed", async (req, res) => {
    try {
      const count = parseInt(req.body.count) || 1;
      
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
    } catch (err) {
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

  // --- Vite / Static Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
