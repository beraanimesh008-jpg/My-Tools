import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, PDFName, PDFRawStream, PDFNumber } from 'pdf-lib';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export type CompressionStep = 1 | 2 | 3 | 4;

export interface CompressionConfig {
  label: string;
  badge: string;
  desc: string;
  approxReduction: number; // percentage
  qualityWarning?: string;
  dpi: number;
}

export const COMPRESSION_STEPS: Record<CompressionStep, CompressionConfig> = {
  1: {
    label: "Low Compression",
    badge: "Best Quality",
    desc: "Minor file size reduction while preserving maximum original image resolution.",
    approxReduction: 15,
    dpi: 300
  },
  2: {
    label: "Medium Compression",
    badge: "Recommended",
    desc: "Optimizes images to standard print-ready resolution with no observable quality loss.",
    approxReduction: 40,
    dpi: 220
  },
  3: {
    label: "High Compression",
    badge: "Maximum Reduction",
    desc: "Highly optimized size with clear, legible text layers and web-ready image scaling.",
    approxReduction: 65,
    dpi: 150
  },
  4: {
    label: "AI Smart Compression",
    badge: "AI Optimization",
    desc: "Intelligent, context-aware downscaling mapping to shrink files up to 85% without sacrificing readability.",
    approxReduction: 82,
    qualityWarning: "Significant asset optimization. Perfect for web storage. Converts images to smart DPI sizes while keeping text selectable.",
    dpi: 90
  }
};

// Canvas-based image byte-compressor
export const compressImageBytes = async (
  bytes: Uint8Array, 
  quality: number, 
  maxDim: number
): Promise<{ bytes: Uint8Array; width: number; height: number }> => {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ bytes, width: img.width, height: img.height });
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          canvas.toBlob((resultBlob) => {
            if (resultBlob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.result instanceof ArrayBuffer) {
                  resolve({
                    bytes: new Uint8Array(reader.result),
                    width,
                    height
                  });
                } else {
                  resolve({ bytes, width: img.width, height: img.height });
                }
              };
              reader.onerror = () => resolve({ bytes, width: img.width, height: img.height });
              reader.readAsArrayBuffer(resultBlob);
            } else {
              resolve({ bytes, width: img.width, height: img.height });
            }
          }, 'image/jpeg', quality);
        } catch (innerErr) {
          console.error("Inner image processing failed:", innerErr);
          resolve({ bytes, width: img.width, height: img.height });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ bytes, width: 0, height: 0 });
      };
      img.src = url;
    } catch (outerErr) {
      console.error("Outer image load failed:", outerErr);
      resolve({ bytes, width: 0, height: 0 });
    }
  });
};

// Verify PDF structure per page operator lists to prevent blank downloads
export const validatePdfBytes = async (
  bytes: Uint8Array, 
  originalInfo: { pageCount: number; opCircleCounts: number[] },
  password?: string
): Promise<boolean> => {
  try {
    if (!bytes || bytes.length === 0) {
      console.error("Validation failed: Output file has zero size.");
      return false;
    }
    
    // Copy bytes to prevent shared-array buffer leaks
    const dataCopy = bytes.slice(0);
    const loadingTask = pdfjs.getDocument({ 
      data: dataCopy,
      password: password || undefined
    });
    
    let pdf;
    try {
      pdf = await loadingTask.promise;
    } catch (loadErr) {
      console.error("Failed to parse output PDF:", loadErr);
      return false;
    }
    
    if (!pdf || pdf.numPages === 0) {
      console.error("Validation failed: Document has no pages.");
      return false;
    }

    if (pdf.numPages !== originalInfo.pageCount) {
      console.error(`Validation failed: Page count mismatch (Compressed: ${pdf.numPages}, Original: ${originalInfo.pageCount})`);
      return false;
    }

    // Check each page operator count to detect blank whitesheets
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const opList = await page.getOperatorList();
        
        const originalOpCount = originalInfo.opCircleCounts[i - 1];
        const compressedOpCount = opList.fnArray.length;
        
        console.log(`Page ${i} Validation: Original ops = ${originalOpCount}, Compressed ops = ${compressedOpCount}`);
        
        if (originalOpCount > 0 && compressedOpCount === 0) {
          console.error(`Validation failed: Page ${i} is blank. Original ops: ${originalOpCount}, Compressed ops: 0`);
          return false;
        }
      } catch (pageErr) {
        console.error(`Validation failed: Page ${i} is corrupted or threw a parsing error:`, pageErr);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("PDF validation routine failed:", err);
    return false;
  }
};

// Optimized pipeline for password-protected/encrypted PDFs.
// Since pdf-lib cannot modify encrypted PDF documents without corrupting them on save,
// we use PDF.js to decrypt and render the pages to high-resolution compressed canvases of the correct proportions,
// and compile a clean, unencrypted, optimized PDF from scratch.
export const compressEncryptedPdfViaRendering = async (
  inputBytes: Uint8Array,
  password: string,
  options: {
    compressionLevel: CompressionStep;
    onProgress: (pct: number, status: string) => void;
  }
): Promise<{ finalPdfBytes: Uint8Array; successfulLevel: CompressionStep }> => {
  const { compressionLevel, onProgress } = options;
  onProgress(15, "Opening password-protected document securely...");
  
  const loadingTask = pdfjs.getDocument({
    data: inputBytes.slice(0),
    password: password
  });
  
  const pdfStatus = await loadingTask.promise;
  const numPages = pdfStatus.numPages;

  onProgress(25, `Decrypted document. Optimizing ${numPages} page layouts...`);

  const compressedDoc = await PDFDocument.create();

  // Custom DPI and image qualities mapped to step configurations
  let scale = 1.5;
  let quality = 0.7;

  if (compressionLevel === 1) {
    scale = 2.0; quality = 0.85;
  } else if (compressionLevel === 2) {
    scale = 1.5; quality = 0.70;
  } else if (compressionLevel === 3) {
    scale = 1.25; quality = 0.55;
  } else if (compressionLevel === 4) {
    scale = 0.95; quality = 0.40;
  }

  for (let i = 1; i <= numPages; i++) {
    onProgress(
      Math.min(92, 25 + Math.round((i / numPages) * 65)),
      `Rasterizing optimized layout of page ${i} of ${numPages}...`
    );

    const page = await pdfStatus.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(`Failed to initialize 2D canvas context on Page ${i}`);
    }

    // Render decrypted page into canvas
    await page.render({ canvasContext: context, viewport }).promise;

    // Output JPEG blob at preset quality
    const imgBlob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => {
        if (b) {
          resolve(b);
        } else {
          canvas.toBlob((pngB) => resolve(pngB!), "image/png");
        }
      }, "image/jpeg", quality);
    });

    const imgArrayBuffer = await imgBlob.arrayBuffer();
    const imgBytes = new Uint8Array(imgArrayBuffer);

    // Embed and render to matching scale coordinates (72 Adobe points/inch)
    const embeddedImage = await compressedDoc.embedJpg(imgBytes);
    const baseWidth = viewport.width / scale;
    const baseHeight = viewport.height / scale;
    
    const newPage = compressedDoc.addPage([baseWidth, baseHeight]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: baseWidth,
      height: baseHeight,
    });
  }

  onProgress(95, "Compiling clean, unencrypted, optimized PDF stream...");
  
  const finalPdfBytes = await compressedDoc.save({
    useObjectStreams: compressionLevel >= 2,
    addDefaultPage: false,
  });

  return {
    finalPdfBytes,
    successfulLevel: compressionLevel
  };
};

interface CompressionOptions {
  compressionLevel: CompressionStep;
  keepOriginalQuality?: boolean;
  optimizeImages?: boolean;
  removeMetadata?: boolean;
  onProgress: (pct: number, status: string) => void;
  originalPagesInfo: { pageCount: number; opCircleCounts: number[] };
  password?: string;
}

// Full sequential multi-level smart compression pipeline
export const runCompressionWorkflow = async (
  inputBytes: Uint8Array,
  options: CompressionOptions
): Promise<{ finalPdfBytes: Uint8Array; successfulLevel: CompressionStep }> => {
  const {
    compressionLevel,
    keepOriginalQuality = false,
    optimizeImages = true,
    removeMetadata = true,
    onProgress,
    originalPagesInfo,
    password
  } = options;

  // For encrypted files, redirect to rendering pipeline to avoid pdf-lib save corruption
  if (password) {
    return compressEncryptedPdfViaRendering(inputBytes, password, {
      compressionLevel,
      onProgress
    });
  }

  let finalPdfBytes: Uint8Array | null = null;
  let validationPassed = false;
  let currentLevel = compressionLevel;
  let triedLevels = 0;

  // Run compression, fallback to lower levels on failures
  while (!validationPassed && triedLevels < 4) {
    triedLevels++;
    const baseProgress = 15 + triedLevels * 15;
    const modeInfo = COMPRESSION_STEPS[currentLevel];
    onProgress(Math.min(90, baseProgress), `Applying profile: ${modeInfo.label}...`);
    
    try {
      const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
      
      if (removeMetadata) {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setCreator('Smart Engine');
        pdfDoc.setProducer('Smart PDF Compressor');
      }

      if (optimizeImages) {
        onProgress(Math.min(90, baseProgress + 3), `Analyzing embedded images (Profile: ${modeInfo.label})...`);
        const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
        const imageStreams: { ref: any, obj: any }[] = [];
        
        for (const [ref, obj] of indirectObjects) {
          if (obj instanceof PDFRawStream) {
            const dict = obj.dict;
            const subtype = dict.get(PDFName.of('Subtype'));
            if (subtype?.toString() === '/Image' || subtype === PDFName.of('Image')) {
              imageStreams.push({ ref, obj });
            }
          }
        }

        if (imageStreams.length > 0) {
          let idx = 0;
          for (const item of imageStreams) {
            idx++;
            onProgress(
              Math.min(90, baseProgress + Math.round((idx / imageStreams.length) * 15)),
              `Optimizing image stream ${idx} of ${imageStreams.length}...`
            );
            
            try {
              const originalBytes = item.obj.getContents();
              
              let quality = 0.7;
              let maxDim = 1200;
              if (currentLevel === 1) {
                quality = 0.85; maxDim = 1800;
              } else if (currentLevel === 2) {
                quality = 0.65; maxDim = 1200;
              } else if (currentLevel === 3) {
                quality = 0.45; maxDim = 800;
              } else if (currentLevel === 4) {
                quality = 0.25; maxDim = 500;
              }
              
              const result = await compressImageBytes(originalBytes, quality, maxDim);
              if (result && result.bytes.length < originalBytes.length) {
                (item.obj as any).contents = result.bytes;
                item.obj.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
                item.obj.dict.set(PDFName.of('Width'), PDFNumber.of(result.width));
                item.obj.dict.set(PDFName.of('Height'), PDFNumber.of(result.height));
                item.obj.dict.delete(PDFName.of('DecodeParms'));
                
                const curColorSpace = item.obj.dict.get(PDFName.of('ColorSpace'));
                if (!curColorSpace) {
                  item.obj.dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
                }
              }
            } catch (imgErr) {
              console.error("Image compression optimization skipped:", imgErr);
            }
          }
        }
      }

      const useObjectStreamsVal = !keepOriginalQuality && currentLevel >= 2;
      const savedBytes = await pdfDoc.save({
        useObjectStreams: useObjectStreamsVal,
        addDefaultPage: false
      });

      // Verify integrity
      const isValid = await validatePdfBytes(savedBytes, originalPagesInfo, password);
      if (isValid) {
        finalPdfBytes = savedBytes;
        validationPassed = true;
        break;
      } else {
        console.warn(`Validation failed at level ${currentLevel}. Attempting lower preset.`);
        if (currentLevel > 1) {
          currentLevel = (currentLevel - 1) as CompressionStep;
        } else {
          break;
        }
      }
    } catch (err) {
      console.error(`Compression execution failed at level ${currentLevel}:`, err);
      if (currentLevel > 1) {
        currentLevel = (currentLevel - 1) as CompressionStep;
      } else {
        break;
      }
    }
  }

  if (!validationPassed || !finalPdfBytes) {
    throw new Error('Compression failed. Original PDF content could not be preserved.');
  }

  return {
    finalPdfBytes,
    successfulLevel: currentLevel
  };
};
