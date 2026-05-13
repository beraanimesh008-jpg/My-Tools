import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Configure Multer for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

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

      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const pdf = await PDFDocument.load(file.buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=merged.pdf");
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error("Error merging PDFs:", error);
      res.status(500).json({ error: "Failed to merge PDFs" });
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
          // Assume JPG for others, but let's be safe and convert to jpeg first with sharp if needed
          // Actually pdf-lib embedJpg handles it, but let's use sharp to ensure it's a valid jpeg
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

      // Load original document
      const pdfDoc = await PDFDocument.load(file.buffer);
      
      // Smart strategy: Create a fresh document and copy pages
      // This effectively "distills" the PDF, removing incremental save garbage, 
      // orphan objects, and unreferenced resources.
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
