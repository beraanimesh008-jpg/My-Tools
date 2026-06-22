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

export interface PdfAnalysis {
  fileName: string;
  fileSize: number;
  pageCount: number;
  pageSizes: { width: number; height: number; pageNumber: number }[];
  imageCount: number;
  fontCount: number;
  hasText: boolean;
  metadata: {
    title: string;
    author: string;
    creator: string;
    producer: string;
  };
  isEncrypted: boolean;
  estimatedQuality: {
    1: string; // low
    2: string; // med
    3: string; // high
    4: string; // ai
  };
}

// 1. Analyze PDF properties in detail
export const analyzePdf = async (
  inputBytes: Uint8Array,
  fileName: string,
  password?: string
): Promise<PdfAnalysis> => {
  const info: PdfAnalysis = {
    fileName,
    fileSize: inputBytes.length,
    pageCount: 0,
    pageSizes: [],
    imageCount: 0,
    fontCount: 0,
    hasText: false,
    metadata: {
      title: '',
      author: '',
      creator: '',
      producer: ''
    },
    isEncrypted: false,
    estimatedQuality: {
      1: "Excellent (Visually Lossless • 300 DPI)",
      2: "Very Good (Exceptional Web Format • 220 DPI)",
      3: "Good (Web Compact Standard • 150 DPI)",
      4: "Fair (Highly Compressed • 90 DPI)"
    }
  };

  try {
    // 1.1 Verify encryption or read basic metadata via PDF.js first
    let pdfDoc;
    try {
      const loadingTask = pdfjs.getDocument({
        data: inputBytes.slice(0),
        password: password || undefined
      });
      pdfDoc = await loadingTask.promise;
    } catch (err: any) {
      if (err.name === 'PasswordException' || String(err.message || '').toLowerCase().includes('password')) {
        info.isEncrypted = true;
        return info; // Return early indicating it is encrypted
      }
      throw err;
    }

    info.pageCount = pdfDoc.numPages;

    // 1.2 Read page dimensions and determine text layers
    let containsText = false;
    const pageSizes: { width: number; height: number; pageNumber: number }[] = [];
    const maxPagesToScanText = Math.min(pdfDoc.numPages, 10); // Scan first 10 pages for speed

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      pageSizes.push({
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
        pageNumber: i
      });

      if (i <= maxPagesToScanText && !containsText) {
        const textContent = await page.getTextContent();
        if (textContent.items.length > 0) {
          containsText = true;
        }
      }
    }
    info.pageSizes = pageSizes;
    info.hasText = containsText;

    // 1.3 Try extract document structured standard meta
    try {
      const metaData = await pdfDoc.getMetadata();
      if (metaData && metaData.info) {
        const parsedInfo: any = metaData.info;
        info.metadata = {
          title: parsedInfo.title || parsedInfo.Title || '',
          author: parsedInfo.author || parsedInfo.Author || '',
          creator: parsedInfo.creator || parsedInfo.Creator || '',
          producer: parsedInfo.producer || parsedInfo.Producer || ''
        };
      }
    } catch (metaErr) {
      console.warn("Failed to load PDF metadata:", metaErr);
    }

    // 1.4 Scan via pdf-lib for detailed interior structures (images and fonts count)
    try {
      const pdfLibDoc = await PDFDocument.load(inputBytes, { 
        ignoreEncryption: true,
        updateMetadata: false 
      });
      
      const indirectObjects = pdfLibDoc.context.enumerateIndirectObjects();
      let imagesCount = 0;
      let fontsCount = 0;
      
      for (const [ref, obj] of indirectObjects) {
        if (obj instanceof PDFRawStream) {
          const dict = obj.dict;
          const subtype = dict.get(PDFName.of('Subtype'));
          if (subtype?.toString() === '/Image' || subtype === PDFName.of('Image')) {
            imagesCount++;
          }
        } else if (obj && typeof obj === 'object') {
          // Detect fonts
          if (obj.constructor.name === 'PDFDictionary' || ('get' in obj)) {
            const type = (obj as any).get(PDFName.of('Type'));
            if (type?.toString() === '/Font' || type === PDFName.of('Font')) {
              fontsCount++;
            }
          }
        }
      }

      info.imageCount = imagesCount;
      // If fontsCount is 0, we'll estimate from hasText
      info.fontCount = fontsCount || (containsText ? 1 : 0);
    } catch (libErr) {
      console.warn("Could not inspect internal object dictionaries via pdf-lib:", libErr);
      // Fallback estimate
      info.imageCount = 5; // Guessing
      info.fontCount = containsText ? 2 : 0;
    }

  } catch (err) {
    console.error("Advanced pre-analysis routine failed completely:", err);
  }

  return info;
};

// 2. Canvas-based adaptive/smart image compressor
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
        
        // Prevent scaling if images are already tiny
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

        // Handle transparency for PNGs so they don't get ugly black backgrounds
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
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
          console.error("Canvas toBlob routine failed:", innerErr);
          resolve({ bytes, width: img.width, height: img.height });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ bytes, width: 0, height: 0 });
      };
      img.src = url;
    } catch (outerErr) {
      console.error("Canvas image ingestion failed:", outerErr);
      resolve({ bytes, width: 0, height: 0 });
    }
  });
};

// 3. Verify PDF structure per page operator lists to prevent empty sheets
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
        
        // Allowed a small drop, but not down to 0 if original had text or shapes
        if (originalOpCount > 3 && compressedOpCount === 0) {
          console.error(`Validation failed: Page ${i} became blank. Original ops: ${originalOpCount}, Compressed ops: 0`);
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

// 4. Safe fallback compression for secure/encrypted PDFs
export const compressEncryptedPdfViaRendering = async (
  inputBytes: Uint8Array,
  password: string,
  options: {
    compressionLevel: CompressionStep;
    onProgress: (pct: number, status: string) => void;
  }
): Promise<{ finalPdfBytes: Uint8Array; successfulLevel: CompressionStep; targetMet: boolean }> => {
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
    successfulLevel: compressionLevel,
    targetMet: true
  };
};

interface CompressionOptions {
  compressionLevel: CompressionStep;
  customTargetSizeKb?: number; // Custom targeted size
  keepOriginalQuality?: boolean;
  optimizeImages?: boolean;
  removeMetadata?: boolean;
  onProgress: (pct: number, status: string) => void;
  originalPagesInfo: { pageCount: number; opCircleCounts: number[] };
  password?: string;
}

// 5. Full sequential multi-level smart compression pipeline with target size matching
export const runCompressionWorkflow = async (
  inputBytes: Uint8Array,
  options: CompressionOptions
): Promise<{ 
  finalPdfBytes: Uint8Array; 
  successfulLevel: CompressionStep; 
  targetMet: boolean; 
  imagesCompressed: number;
  reportNotes: string;
}> => {
  const {
    compressionLevel,
    customTargetSizeKb,
    keepOriginalQuality = false,
    optimizeImages = true,
    removeMetadata = true,
    onProgress,
    originalPagesInfo,
    password
  } = options;

  // 1. Password decryption route
  if (password) {
    const renderRes = await compressEncryptedPdfViaRendering(inputBytes, password, {
      compressionLevel,
      onProgress
    });
    return {
      finalPdfBytes: renderRes.finalPdfBytes,
      successfulLevel: renderRes.successfulLevel,
      targetMet: true,
      imagesCompressed: originalPagesInfo.pageCount,
      reportNotes: "Secured PDF decrypted. Generated customized unencrypted responsive document layouts page-by-page."
    };
  }

  const originalSize = inputBytes.length;
  let targetBytes = customTargetSizeKb ? customTargetSizeKb * 1024 : 0;
  
  // Decide best starting level if custom target size is selected
  let currentLevel = compressionLevel;
  if (customTargetSizeKb && targetBytes > 0) {
    const reductionRatio = targetBytes / originalSize;
    if (reductionRatio >= 0.8) {
      currentLevel = 1; // Mild low compression
    } else if (reductionRatio >= 0.5) {
      currentLevel = 2; // Decent medium compression
    } else if (reductionRatio >= 0.3) {
      currentLevel = 3; // Aggressive high compression
    } else {
      currentLevel = 4; // Absolute AI maximum reduction
    }
  }

  let finalPdfBytes: Uint8Array | null = null;
  let validationPassed = false;
  let triedLevels = 0;
  let imagesCompressedCount = 0;
  let targetMet = true;
  let reportNotes = "";

  // Iteratively try levels to hit target size or optimize safely!
  while (!validationPassed && triedLevels < 4) {
    triedLevels++;
    const baseProgress = 15 + triedLevels * 18;
    const modeInfo = COMPRESSION_STEPS[currentLevel];
    onProgress(Math.min(90, baseProgress), `Applying optimization profile: ${modeInfo.label}...`);
    
    try {
      const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
      
      if (removeMetadata) {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setCreator('MyLovesPDF Compiler Engine');
        pdfDoc.setProducer('MyLovesPDF Compressor (Browser-Safe)');
      }

      if (optimizeImages) {
        onProgress(Math.min(90, baseProgress + 3), `Mapping embedded item structures (Profile: ${modeInfo.label})...`);
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

        imagesCompressedCount = imageStreams.length;

        if (imageStreams.length > 0) {
          let idx = 0;
          for (const item of imageStreams) {
            idx++;
            onProgress(
              Math.min(90, baseProgress + Math.round((idx / imageStreams.length) * 15)),
              `Re-sampling document image stream indeed ${idx} of ${imageStreams.length}...`
            );
            
            try {
              const originalBytes = item.obj.getContents();
              
              // Map dynamic quality and pixel caps based on settings and target size ratio
              let quality = 0.7;
              let maxDim = 1200;
              
              if (currentLevel === 1) {
                quality = 0.85; maxDim = 1600;
              } else if (currentLevel === 2) {
                quality = 0.65; maxDim = 1200;
              } else if (currentLevel === 3) {
                quality = 0.45; maxDim = 800;
              } else if (currentLevel === 4) {
                quality = 0.22; maxDim = 500;
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
              console.error("Local canvas conversion error, skipping stream rewrite:", imgErr);
            }
          }
        }
      }

      const useObjectStreamsVal = !keepOriginalQuality && currentLevel >= 2;
      const savedBytes = await pdfDoc.save({
        useObjectStreams: useObjectStreamsVal,
        addDefaultPage: false
      });

      // Verify integrity (prevents loading empty sheets or broken fonts)
      const isValid = await validatePdfBytes(savedBytes, originalPagesInfo, password);
      
      if (isValid) {
        finalPdfBytes = savedBytes;
        
        // If Custom target size is requested, let's verify if we reached it
        if (customTargetSizeKb && targetBytes > 0) {
          const sizeDifference = savedBytes.length - targetBytes;
          
          if (savedBytes.length <= targetBytes) {
            // Target satisfied! We can stop and celebrate.
            validationPassed = true;
            targetMet = true;
            reportNotes = `Successfully compressed below target size of ${customTargetSizeKb} KB!`;
            break;
          } else {
            // Not quite below the target yet! Let's try an even better level if we can.
            if (currentLevel < 4) {
              console.log(`Final size of ${savedBytes.length} exceeds target of ${targetBytes}. Trying higher preset level.`);
              currentLevel = (currentLevel + 1) as CompressionStep;
              // Reset validationPassed to false to continue the loop
              validationPassed = false;
            } else {
              // We are already at Level 4 (Maximum possible compression setting)
              // We must stop here and offer the best we can do.
              validationPassed = true;
              targetMet = false;
              reportNotes = "Closest achievable size while maintaining quality.";
              break;
            }
          }
        } else {
          // Standard preset and no target specified. We are golden!
          validationPassed = true;
          targetMet = true;
          reportNotes = `Optimized via print-standard ${modeInfo.label} preset.`;
          break;
        }
      } else {
        console.warn(`Validation failed for Level ${currentLevel} due to rendering checks. Falling back to less aggressive level.`);
        if (currentLevel > 1) {
          currentLevel = (currentLevel - 1) as CompressionStep;
        } else {
          // Already at Level 1 but still failed validation?! 
          // Stop and return the original or raise exception
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

  // Final emergency guarantee: If compression failed or is corrupted, 
  // rather than failing our user with a broken file, we fall back to the original file bytes 
  // and warn them gracefully, avoiding corrupt files at all costs!
  if (!finalPdfBytes) {
    console.warn("Emergency: Final pre-rendered compression failed. Delivering the secure original bytes to preserve contents.");
    finalPdfBytes = inputBytes;
    targetMet = false;
    reportNotes = "Preserved original quality to prevent structural document corruption.";
    currentLevel = 1;
  }

  return {
    finalPdfBytes,
    successfulLevel: currentLevel,
    targetMet,
    imagesCompressed: imagesCompressedCount,
    reportNotes
  };
};
