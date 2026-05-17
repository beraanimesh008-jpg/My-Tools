import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
