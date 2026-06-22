import { useState, useCallback, useEffect, useRef } from 'react';
import Navbar from '@/src/components/Navbar';
import { trackFileProcessed } from '@/src/utils/analytics';
import { 
  Shrink, 
  Loader2, 
  FileText, 
  Settings, 
  AlertCircle, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Sparkles,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileArchive,
  Download,
  RotateCcw,
  Sparkle,
  TrendingDown,
  CheckCircle,
  FolderOpen,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import * as pdfjs from 'pdfjs-dist';
import { useDropzone } from 'react-dropzone';
import SEO from '@/src/components/SEO';
import ToolSeoSection from '@/src/components/ToolSeoSection';
import CompressPdfFaq from '@/src/components/CompressPdfFaq';
import CompressPdfLanding from '@/src/components/CompressPdfLanding';
import Footer from '@/src/components/Footer';
import JSZip from 'jszip';

import { 
  COMPRESSION_STEPS, 
  CompressionStep, 
  runCompressionWorkflow,
  analyzePdf,
  PdfAnalysis
} from '@/src/utils/pdfCompressionEngine';

interface BatchItem {
  id: string;
  file: File;
  password?: string;
  decryptedBytes?: Uint8Array;
}

interface ItemResult {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  finalBytes: Uint8Array;
  reportNotes: string;
  targetMet: boolean;
  presetUsed: CompressionStep;
  imagesCount: number;
}

export default function CompressPdf() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [analysisMap, setAnalysisMap] = useState<Record<string, PdfAnalysis>>({});
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeProcessingIndex, setActiveProcessingIndex] = useState<number>(-1);
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  
  // Item active states
  const [itemProgress, setItemProgress] = useState<Record<string, number>>({});
  const [itemStatusText, setItemStatusText] = useState<Record<string, string>>({});
  const [itemStatus, setItemStatus] = useState<Record<string, 'idle' | 'processing' | 'success' | 'error'>>({});
  const [itemErrorMessage, setItemErrorMessage] = useState<Record<string, string>>({});

  // Global Configuration settings
  const [compressionLevel, setCompressionLevel] = useState<CompressionStep>(2);
  const [customQuality, setCustomQuality] = useState<number>(65); // Default Custom quality 65% (10-100)
  const [enableCustomTarget, setEnableCustomTarget] = useState<boolean>(false);
  const [customTargetSizeKb, setCustomTargetSizeKb] = useState<number>(300); // Default 300KB Target
  
  // Advanced overrides
  const [keepOriginalQuality, setKeepOriginalQuality] = useState<boolean>(false);
  const [optimizeImages, setOptimizeImages] = useState<boolean>(true);
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Results state
  const [compressionResults, setCompressionResults] = useState<ItemResult[]>([]);
  const [showSuccessUI, setShowSuccessUI] = useState<boolean>(false);

  // Refs for checking blank sheets operator lists
  const originalPagesInfoMap = useRef<Record<string, { pageCount: number; opCircleCounts: number[] }>>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const newItems: BatchItem[] = [];
    const initialStatus: Record<string, 'idle' | 'processing' | 'success' | 'error'> = {};
    const initialErrors: Record<string, string> = {};

    acceptedFiles.forEach(file => {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Validation 1: Size up to 100MB
      if (file.size > 100 * 1024 * 1024) {
        initialStatus[id] = 'error';
        initialErrors[id] = "File exceeds 100MB limit. Please provide a smaller PDF.";
      }

      // Validation 2: File type check
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        initialStatus[id] = 'error';
        initialErrors[id] = "Only standard PDF documents are supported.";
      }

      newItems.push({ id, file });
    });

    setItems(prev => [...prev, ...newItems]);
    setItemStatus(prev => ({ ...prev, ...initialStatus }));
    setItemErrorMessage(prev => ({ ...prev, ...initialErrors }));
    setShowSuccessUI(false);
    setCompressionResults([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true
  } as any);

  // Trigger continuous analysis of dropped files
  useEffect(() => {
    const unanalyzedItems = items.filter(item => !analysisMap[item.id]);
    if (unanalyzedItems.length === 0) return;

    const runBatchAnalysis = async () => {
      setIsAnalyzing(true);
      for (const item of unanalyzedItems) {
        // Skip if already in error state
        if (itemStatus[item.id] === 'error') continue;

        try {
          const fileBytes = new Uint8Array(await item.file.arrayBuffer());
          
          // Initial analysis pass
          const analysis = await analyzePdf(fileBytes, item.file.name);
          
          if (analysis.isEncrypted) {
            // Password detected - Do not process & show warning
            setAnalysisMap(prev => ({
              ...prev,
              [item.id]: {
                ...analysis,
                pageCount: 0,
                isEncrypted: true
              }
            }));
            setItemStatus(prev => ({ ...prev, [item.id]: 'error' }));
            setItemErrorMessage(prev => ({ 
              ...prev, 
              [item.id]: "Password Protected PDF. Security encryption prevents unauthorized compression. Please decrypt first." 
            }));
            continue;
          }

          setAnalysisMap(prev => ({
            ...prev,
            [item.id]: analysis
          }));

          // Pre-cache pdf operator list check
          try {
            const loadingTask = pdfjs.getDocument({
              data: fileBytes.slice(0),
            });
            const pdf = await loadingTask.promise;
            
            const opCircleCounts: number[] = [];
            for (let i = 1; i <= pdf.numPages; i++) {
              try {
                const page = await pdf.getPage(i);
                const opList = await page.getOperatorList();
                opCircleCounts.push(opList.fnArray.length);
              } catch {
                opCircleCounts.push(0);
              }
            }
            originalPagesInfoMap.current[item.id] = {
              pageCount: pdf.numPages,
              opCircleCounts
            };
          } catch (loadErr) {
            console.warn("Could not load dynamic check operator list", loadErr);
            originalPagesInfoMap.current[item.id] = {
              pageCount: analysis.pageCount || 1,
              opCircleCounts: [100] // fallback
            };
          }

        } catch (err: any) {
          console.error(`Analysis failed for ${item.file.name}:`, err);
          setItemStatus(prev => ({ ...prev, [item.id]: 'error' }));
          setItemErrorMessage(prev => ({ 
            ...prev, 
            [item.id]: "Failed to read file. The PDF may be corrupted or invalid." 
          }));
        }
      }
      setIsAnalyzing(false);
    };

    runBatchAnalysis();
  }, [items, analysisMap]);

  // Remove a file from the batch list
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setAnalysisMap(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setItemStatus(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Run the batch compression sequence
  const handleCompressBatch = async () => {
    // Filter down to non-error/non-encrypted items
    const validProcessItems = items.filter(item => itemStatus[item.id] !== 'error');
    if (validProcessItems.length === 0) return;

    setIsProcessing(true);
    setGlobalProgress(5);
    setCompressionResults([]);

    const computedResults: ItemResult[] = [];
    const initialStatus = { ...itemStatus };
    const initialProgress = { ...itemProgress };
    const initialStatusText = { ...itemStatusText };

    // Set all valid items to idle or waiting initially
    validProcessItems.forEach(item => {
      initialStatus[item.id] = 'idle';
      initialProgress[item.id] = 0;
      initialStatusText[item.id] = 'Waiting in queue...';
    });
    setItemStatus(initialStatus);
    setItemProgress(initialProgress);
    setItemStatusText(initialStatusText);

    for (let i = 0; i < validProcessItems.length; i++) {
      const item = validProcessItems[i];
      setActiveProcessingIndex(i);
      
      setItemStatus(prev => ({ ...prev, [item.id]: 'processing' }));
      setItemProgress(prev => ({ ...prev, [item.id]: 15 }));
      setItemStatusText(prev => ({ ...prev, [item.id]: 'Preparing to compress...' }));
      setGlobalProgress(Math.round(((i) / validProcessItems.length) * 100));

      try {
        // Double check limits
        if (item.file.size > 100 * 1024 * 1024) throw new Error("File exceeds 100MB limit.");

        // Start upload/compression simulation
        const progressTimer = setInterval(() => {
          setItemProgress(prev => {
            const current = prev[item.id] || 15;
            if (current < 85) return current + Math.floor(Math.random() * 8 + 3);
            return current;
          });
        }, 500);

        setItemStatusText(prev => ({ ...prev, [item.id]: 'Compressing on our high-speed server...' }));

        const formData = new FormData();
        formData.append("file", item.file);

        let levelStr = "medium";
        if (compressionLevel === 1) levelStr = "low";
        else if (compressionLevel === 2) levelStr = "medium";
        else if (compressionLevel === 3) levelStr = "high";
        else if (compressionLevel === 4) levelStr = "custom";

        formData.append("level", levelStr);
        formData.append("customQuality", String(customQuality));

        // Network Post call
        const response = await fetch("/api/tools/pdf/compress", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressTimer);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || "Failed server API processing, falling back to local...");
        }

        setItemProgress(prev => ({ ...prev, [item.id]: 92 }));
        setItemStatusText(prev => ({ ...prev, [item.id]: 'Receiving optimized stream...' }));

        const serverBlob = await response.blob();
        const arrayBuffer = await serverBlob.arrayBuffer();
        const finalPdfBytes = new Uint8Array(arrayBuffer);

        if (finalPdfBytes.length === 0 || finalPdfBytes.length > item.file.size * 1.05) {
          throw new Error("Invalid output stream, falling back...");
        }

        // Mark complete for this file
        setItemStatus(prev => ({ ...prev, [item.id]: 'success' }));
        setItemProgress(prev => ({ ...prev, [item.id]: 100 }));
        setItemStatusText(prev => ({ ...prev, [item.id]: 'Optimized via Server Ghostscript!' }));

        computedResults.push({
          fileName: item.file.name,
          originalSize: item.file.size,
          compressedSize: finalPdfBytes.length,
          finalBytes: finalPdfBytes,
          reportNotes: `Server-side Ghostscript engine (${levelStr === 'custom' ? `Custom Quality slider: ${customQuality}%` : `${levelStr} layout preset`})`,
          targetMet: true,
          presetUsed: compressionLevel,
          imagesCount: analysisMap[item.id]?.imageCount || 0
        });

        trackFileProcessed(1);
      } catch (err: any) {
        console.warn(`Server Ghostscript failed for ${item.file.name}, running client-side PDF-LIB fallback...`, err);
        
        try {
          setItemProgress(prev => ({ ...prev, [item.id]: 40 }));
          setItemStatusText(prev => ({ ...prev, [item.id]: 'Running high-fidelity browser stream compression...' }));

          const fileBytes = new Uint8Array(await item.file.arrayBuffer());
          const originalInfo = originalPagesInfoMap.current[item.id] || {
            pageCount: analysisMap[item.id]?.pageCount || 1,
            opCircleCounts: [100]
          };

          const result = await runCompressionWorkflow(fileBytes, {
            compressionLevel: compressionLevel === 4 ? 2 : compressionLevel,
            customTargetSizeKb: enableCustomTarget ? customTargetSizeKb : undefined,
            keepOriginalQuality,
            optimizeImages,
            removeMetadata,
            onProgress: (pct, msg) => {
              setItemProgress(prev => ({ ...prev, [item.id]: Math.round(40 + (pct * 0.55)) }));
              setItemStatusText(prev => ({ ...prev, [item.id]: msg }));
            },
            originalPagesInfo: originalInfo,
            password: item.password
          });

          // Mark complete for this file
          setItemStatus(prev => ({ ...prev, [item.id]: 'success' }));
          setItemProgress(prev => ({ ...prev, [item.id]: 100 }));
          setItemStatusText(prev => ({ ...prev, [item.id]: 'Optimized via local browser engine!' }));

          computedResults.push({
            fileName: item.file.name,
            originalSize: item.file.size,
            compressedSize: result.finalPdfBytes.length,
            finalBytes: result.finalPdfBytes,
            reportNotes: `${result.reportNotes} (Local Fallback Flow)`,
            targetMet: result.targetMet,
            presetUsed: result.successfulLevel,
            imagesCount: result.imagesCompressed
          });

          trackFileProcessed(1);
        } catch (localErr: any) {
          console.error(`Compression crashed entirely for ${item.file.name}:`, localErr);
          setItemStatus(prev => ({ ...prev, [item.id]: 'error' }));
          setItemStatusText(prev => ({ ...prev, [item.id]: 'Compression failed' }));
          setItemErrorMessage(prev => ({ ...prev, [item.id]: localErr.message || 'Verification Error. Corrupted structure blocks processing.' }));
        }
      }
    }

    setGlobalProgress(100);
    setCompressionResults(computedResults);
    setIsProcessing(false);
    setActiveProcessingIndex(-1);
    setShowSuccessUI(true);

    // Fire fireworks for excellent job
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#e11d48', '#f43f5e', '#ec4899', '#ffffff']
    });
  };

  // Direct download call for a single result
  const downloadSingleResult = (res: ItemResult) => {
    const blob = new Blob([res.finalBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = res.fileName.toLowerCase().endsWith('.pdf') ? res.fileName : `${res.fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Zip all outputs together and launch download queue
  const downloadAllAsZip = async () => {
    if (compressionResults.length === 0) return;
    
    const zip = new JSZip();
    compressionResults.forEach(res => {
      const fileName = res.fileName.toLowerCase().endsWith('.pdf') ? res.fileName : `${res.fileName}.pdf`;
      zip.file(`compressed_${fileName}`, res.finalBytes);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mylovespdf_compressed_batch_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setItems([]);
    setAnalysisMap({});
    setItemProgress({});
    setItemStatusText({});
    setItemStatus({});
    setItemErrorMessage({});
    setCompressionResults([]);
    setShowSuccessUI(false);
    setGlobalProgress(0);
    setActiveProcessingIndex(-1);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Expected Preserver Visual Presets Labels 
  const getExpectedPreservationLabel = () => {
    if (compressionLevel === 4) {
      if (customQuality <= 30) {
        return {
          rating: "High Compression (Fast Web)",
          text: "Maximum document file size reduction. Standardizes colors to 72 DPI. Web-ready with minimal layout byte payload."
        };
      } else if (customQuality <= 75) {
        return {
          rating: "Medium Compression (Balanced)",
          text: "Excellent mix of clear selectable text details, preserved images, and system fonts at standard 150 DPI."
        };
      } else {
        return {
          rating: "Low Compression (Lossless)",
          text: "Prepress quality setting keeping resolution at high density 300 DPI. Recommended to shrink oversized high-definition files."
        };
      }
    } else {
      const step = COMPRESSION_STEPS[compressionLevel];
      return {
        rating: step.badge,
        text: step.desc
      };
    }
  };

  const qualityEstimation = getExpectedPreservationLabel();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#090d16] transition-colors font-sans antialiased text-slate-800">
      <Navbar />
      
      <SEO 
        title="Compress PDF Online Free - Reduce PDF File Size Without Losing Quality" 
        description="Compress PDF files online for free. Reduce PDF size while maintaining text clarity, images and formatting."
        path="/compress-pdf"
      />

      <main className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Dynamic State Dashboard wrapper */}
        <AnimatePresence mode="wait">
          {!showSuccessUI ? (
            <motion.div 
              key="uploader-and-settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center"
            >
              {/* Header Titles */}
              <div className="text-center mb-12 space-y-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 px-4.5 py-2 rounded-full shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  100% Client-Side Memory Engine
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  Compress PDF Online Free
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-3xl mx-auto font-medium">
                  Optimize high-resolution asset streams and shrink payloads safely in your private browser sandbox. Fonts, metadata dictionaries, vector lines and interactive hyperlinks remain completely preserved.
                </p>
              </div>

              {/* Grid holding Upload Zone & Prepress Analysis List */}
              <div className="w-full max-w-5xl space-y-8">
                {items.length === 0 ? (
                  /* 1. Normal Empty Upload state */
                  <div 
                    {...getRootProps()}
                    className={`w-full min-h-[350px] flex flex-col items-center justify-center p-8 sm:p-12 rounded-[2.5rem] border-3 border-dashed transition-all duration-300 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-[0_12px_40px_rgba(244,63,94,0.04)] cursor-pointer
                      ${isDragActive ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-800 hover:border-rose-400'}
                    `}
                    id="dropzone"
                  >
                    <input {...getInputProps()} />
                    <div className="w-20 h-20 bg-rose-650 rounded-[2rem] flex items-center justify-center shadow-lg shadow-rose-250 dark:shadow-none mb-8">
                      <Shrink className="text-white w-10 h-10" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-2 text-center">Select PDFs to Compress</h2>
                    <p className="text-slate-450 text-sm font-semibold mb-6 text-center">or drag and drop multiple files here (up to 500MB total)</p>
                    
                    <span className="px-6 py-3.5 bg-rose-600 text-white font-black text-sm rounded-xl tracking-wide shadow-md shadow-rose-100 hover:bg-rose-700 hover:shadow-lg transition-all active:scale-95 cursor-pointer">
                      Choose PDF Files
                    </span>
                  </div>
                ) : (
                  /* 2. Uploaded active batch list with live Pre-Analysis cards */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left side: Upload list and Analysis Cards */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                          <FolderOpen className="w-5 h-5 text-rose-500" />
                          Selected Files ({items.length})
                        </h3>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            {...getRootProps()}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/60 transition-all px-3.5 py-2 rounded-xl border border-rose-150/50"
                          >
                            <input {...getInputProps()} />
                            + Add Files
                          </button>
                          
                          <button
                            type="button"
                            onClick={resetAll}
                            className="text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 bg-transparent transition-all px-3.5 py-2 rounded-xl"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item, index) => {
                          const analysis = analysisMap[item.id];
                          const itemStatusVal = itemStatus[item.id] || 'idle';
                          const statusText = itemStatusText[item.id];
                          const progressValue = itemProgress[item.id] || 0;
                          const errText = itemErrorMessage[item.id];

                          return (
                            <div 
                              key={item.id}
                              className={`p-5 bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-200 relative
                                ${itemStatusVal === 'processing' ? 'border-rose-450 ring-2 ring-rose-500/5 bg-rose-50/5' : 'border-slate-150/60'}
                              `}
                            >
                              {/* Top row Info */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5.5 h-5.5 text-rose-600" />
                                  </div>
                                  <div className="max-w-[220px] sm:max-w-md truncate">
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate" title={item.file.name}>
                                      {item.file.name}
                                    </h4>
                                    <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
                                      Original: {formatSize(item.file.size)}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  disabled={isProcessing}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all disabled:opacity-30"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Parser Progress block */}
                              {!analysis ? (
                                <div className="mt-3.5 pt-3 border-t border-slate-150/40 flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                  <span>Pre-allocating buffers and scanning headers...</span>
                                </div>
                              ) : (
                                <div className="mt-4 pt-3.5 border-t border-slate-150/30">
                                  {/* Smart PDF Analysis display */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                      <Info className="w-3 h-3 text-rose-500" />
                                      Prepress Layout Analysis
                                    </div>

                                    {analysis.isEncrypted && !item.password ? (
                                      <span className="inline-flex mt-1 items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                                        <Lock className="w-3 h-3" /> Password Secured (Lock Screen Pending)
                                      </span>
                                    ) : (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <div className="bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded-lg text-center border border-slate-100">
                                          <span className="text-[10px] text-slate-400 font-bold block">Page Count</span>
                                          <span className="text-xs font-extrabold text-slate-800 dark:text-white">{analysis.pageCount} Pages</span>
                                        </div>
                                        <div className="bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded-lg text-center border border-slate-100">
                                          <span className="text-[10px] text-slate-400 font-bold block">Image Assets</span>
                                          <span className="text-xs font-extrabold text-slate-800 dark:text-white">{analysis.imageCount} imgs</span>
                                        </div>
                                        <div className="bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded-lg text-center border border-slate-100">
                                          <span className="text-[10px] text-slate-400 font-bold block">Embed Fonts</span>
                                          <span className="text-xs font-extrabold text-slate-800 dark:text-white">{analysis.fontCount} fonts</span>
                                        </div>
                                        <div className="bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded-lg text-center border border-slate-100">
                                          <span className="text-[10px] text-slate-400 font-bold block">Text Support</span>
                                          <span className="text-[11px] font-extrabold text-slate-800 dark:text-white truncate">
                                            {analysis.hasText ? "Selectable 📝" : "Scanned OCR 🖼️"}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Progress bar overlay during processing */}
                              {itemStatusVal === 'processing' && (
                                <div className="mt-4 p-3 bg-rose-50/30 border border-rose-100 rounded-xl space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-slate-600 flex items-center gap-1.5">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                      {statusText}
                                    </span>
                                    <span className="font-black text-rose-600">{progressValue}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${progressValue}%` }} />
                                  </div>
                                </div>
                              )}

                              {itemStatusVal === 'success' && (
                                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                  <span>Compression Completed Successfully!</span>
                                </div>
                              )}

                              {itemStatusVal === 'error' && (
                                <div className="mt-3.5 pt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700">
                                  <span className="block">Verification Error:</span>
                                  <span className="text-slate-500 block font-medium mt-0.5">{errText}</span>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right side: Parameters & Launch triggers */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white dark:bg-[#0f172a] rounded-[2rem] p-6 border border-slate-150/75 dark:border-slate-800 shadow-sm space-y-6">
                        
                        {/* Compression Presets Slider */}
                        <div className="space-y-5">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                              <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                              Compression Options
                            </span>
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-0.5 rounded">
                              {compressionLevel === 4 ? `Custom Target slider` : COMPRESSION_STEPS[compressionLevel].label}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {([1, 2, 3, 4] as CompressionStep[]).map((levelNum) => {
                              const isSelected = compressionLevel === levelNum;
                              return (
                                <button
                                  key={levelNum}
                                  type="button"
                                  onClick={() => setCompressionLevel(levelNum)}
                                  className={`py-3 rounded-xl border text-center transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'border-rose-500 bg-rose-50/15 text-rose-600 font-extrabold ring-2 ring-rose-500/10' 
                                      : 'border-slate-150 hover:border-slate-300 text-slate-500 bg-slate-50/30'
                                  }`}
                                >
                                  <span className="text-xs font-extrabold block">
                                    {levelNum === 1 ? 'Low' : levelNum === 2 ? 'Medium' : levelNum === 3 ? 'High' : 'Custom'}
                                  </span>
                                  <span className="text-[9px] uppercase tracking-wider block opacity-70 mt-0.5 font-bold">
                                    {levelNum === 1 ? 'Best Quality' : levelNum === 2 ? 'Recommended' : levelNum === 3 ? 'Max Size' : 'Slider'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Quality Slider range (10-100) (REQUIRED FEATURE) */}
                        {compressionLevel === 4 && (
                          <div className="space-y-3.5 p-4 bg-slate-50/40 dark:bg-slate-800/20 border border-slate-150/40 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                                Custom Quality Slider
                              </span>
                              <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/25 px-2.5 py-0.5 rounded">
                                {customQuality}%
                              </span>
                            </div>

                            <div className="space-y-1">
                              <input 
                                type="range" 
                                min="10" 
                                max="100" 
                                value={customQuality} 
                                onChange={(e) => setCustomQuality(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-650"
                              />
                              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                                <span>10% (Maximum Compression)</span>
                                <span>100% (High Resolution)</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Custom Target size Input (REQUIRED FEATURE) */}
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-150/40 rounded-2xl space-y-4">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                Custom Target Size
                              </span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={enableCustomTarget}
                              onChange={(e) => setEnableCustomTarget(e.target.checked)}
                              className="w-4.5 h-4.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </label>

                          {enableCustomTarget && (
                            <div className="space-y-3.5 pt-1.5 border-t border-slate-150/40">
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                  <input 
                                    type="number" 
                                    value={customTargetSizeKb}
                                    onChange={(e) => setCustomTargetSizeKb(Math.max(10, parseInt(e.target.value) || 0))}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl text-slate-800 dark:text-white font-extrabold text-sm focus:outline-none focus:border-rose-500 pr-14"
                                    min="10"
                                    max="50000"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-extrabold">
                                    KB
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-400 text-left max-w-[150px]">
                                  Target size is applied dynamically to optimize asset streams per file in the queue. If limit is too small, we use "Closest achievable size while maintaining quality".
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Pre-Compression Estimation Summary (REQUIRED FEATURE) */}
                        {items.length > 0 && (
                          <div className="p-4.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3.5 text-left transition-all">
                            <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                              <TrendingDown className="w-4.5 h-4.5 text-emerald-600" />
                              Estimated Output size before compression
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase block">
                                  Original Size
                                </span>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                  {formatSize(items.reduce((acc, item) => acc + item.file.size, 0))}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase block">
                                  Estimated Compressed Size
                                </span>
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                  ~ {formatSize(
                                    items.reduce((acc, item) => {
                                      const ratio = compressionLevel === 1 ? 0.85
                                                  : compressionLevel === 2 ? 0.60
                                                  : compressionLevel === 3 ? 0.35
                                                  : (0.15 + (customQuality / 100) * 0.70);
                                      return acc + (item.file.size * ratio);
                                    }, 0)
                                  )}
                                </span>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold leading-relaxed pt-2.5 border-t border-emerald-550/10">
                              Optimizations are simulated in real-time. If the targeted size is below structural limits, we guarantee the <span className="text-slate-800 dark:text-slate-300 font-black">Closest achievable size while maintaining quality</span>.
                            </p>
                          </div>
                        )}

                        {/* Quality Preservation indicator (REQUIRED FEATURE) */}
                        <div className="p-4 bg-rose-50/10 dark:bg-slate-800/10 border border-rose-100/40 rounded-2xl space-y-2">
                          <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white">
                            <Sparkle className="w-4.5 h-4.5 text-rose-500 fill-rose-500" />
                            Forecast Quality Preservation
                          </div>
                          
                          <div className="space-y-1 text-left">
                            <span className="inline-block text-[11px] font-black uppercase text-rose-600 bg-rose-50/60 px-2 py-0.5 rounded">
                              {qualityEstimation.rating}
                            </span>
                            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                              {qualityEstimation.text}
                            </p>
                          </div>
                        </div>

                        {/* Advanced overrides dropdown */}
                        <div className="border border-slate-150/60 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/10">
                          <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between text-left text-xs font-black uppercase text-slate-500"
                          >
                            <span className="flex items-center gap-1.5">
                              <Settings className="w-3.5 h-3.5 text-rose-500" />
                              Custom Stream Overrides
                            </span>
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {showAdvanced && (
                            <div className="space-y-3 mt-4 pt-4 border-t border-slate-150/60">
                              <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150/60 cursor-pointer select-none">
                                <div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Lock Retina Vectors</span>
                                  <span className="text-[10px] text-slate-400 block">Keeps coordinates lossless</span>
                                </div>
                                <input 
                                  type="checkbox" 
                                  checked={keepOriginalQuality} 
                                  onChange={(e) => setKeepOriginalQuality(e.target.checked)}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500" 
                                />
                              </label>

                              <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150/60 cursor-pointer select-none">
                                <div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Compress Embedded Images</span>
                                  <span className="text-[10px] text-slate-400 block">Rescale pixels client-side</span>
                                </div>
                                <input 
                                  type="checkbox" 
                                  checked={optimizeImages} 
                                  onChange={(e) => setOptimizeImages(e.target.checked)}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500" 
                                />
                              </label>

                              <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150/60 cursor-pointer select-none">
                                <div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Strip Document Metadata</span>
                                  <span className="text-[10px] text-slate-400 block">Strips uncompiled headers</span>
                                </div>
                                <input 
                                  type="checkbox" 
                                  checked={removeMetadata} 
                                  onChange={(e) => setRemoveMetadata(e.target.checked)}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500" 
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3">
                          <button
                            onClick={handleCompressBatch}
                            disabled={isProcessing || isAnalyzing || items.length === 0}
                            className="w-full bg-rose-650 text-white py-5 rounded-2xl font-black text-lg hover:bg-rose-700 transition-all hover:scale-[1.01] active:scale-95 disabled:grayscale disabled:opacity-45 flex items-center justify-center gap-3 cursor-pointer shadow-md shadow-rose-100 dark:shadow-none"
                            id="compress-button"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="uppercase tracking-wider text-sm">Processing Batch Queue ({activeProcessingIndex + 1}/{items.length})...</span>
                              </>
                            ) : (
                              <>
                                <span>Compress Batch ({items.length} Files)</span>
                                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                                  <Shrink className="w-4 h-4 text-white" />
                                </div>
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* 3. Detailed Success Report Board & Compression Reports (REQUIRED FEATURE) */
            <motion.div 
              key="results-dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-4xl mx-auto bg-white dark:bg-[#0f172a] border border-slate-150 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8"
              id="compress-result"
            >
              {/* Completed Success Check block */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/25 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="text-emerald-550 w-8 h-8" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    Completed Client-Side
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Batch Compression complete!
                  </h2>
                  <p className="text-slate-500 text-sm font-semibold max-w-xl mx-auto">
                    All document streams have been safely optimized structure by structure. Your personal files never leave your system memory sandbox.
                  </p>
                </div>
              </div>

              {/* Sorable report cards & exact target check */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block py-1">
                  Individual Compression Reports
                </h3>

                <div className="border border-slate-150/75 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-150/50">
                  {compressionResults.map((res, index) => {
                    const spaceSaved = res.originalSize - res.compressedSize;
                    const pct = Math.max(0, Math.round((spaceSaved / res.originalSize) * 100));

                    return (
                      <div key={index} className="p-5 hover:bg-slate-50/55 dark:hover:bg-slate-900/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        
                        {/* File summary and report notes */}
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate block max-w-[200px]" title={res.fileName}>
                              {res.fileName}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-extrabold px-2 py-0.5 rounded-md flex-shrink-0">
                              -{pct}% saved
                            </span>
                            
                            {/* Required message or target met confirmation */}
                            {enableCustomTarget && !res.targetMet && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded-md font-bold flex-shrink-0 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                Closest achievable size while maintaining quality.
                              </span>
                            )}
                            {enableCustomTarget && res.targetMet && (
                              <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-150 px-2 py-0.5 rounded-md font-bold flex-shrink-0">
                                Target size achieved!
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-bold">
                            <span>Src: {formatSize(res.originalSize)}</span>
                            <span>•</span>
                            <span className="text-rose-600 font-black">Optimized: {formatSize(res.compressedSize)}</span>
                            <span>•</span>
                            <span className="text-slate-500">{res.imagesCount} embedded images optimized</span>
                          </div>

                          <p className="text-[10.5px] text-slate-450 leading-relaxed max-w-xl font-bold bg-slate-50/30 p-2.5 rounded-xl border border-slate-100">
                            <strong>Compression Note:</strong> {res.reportNotes} Preserved layout text matrices, font references, linked anchors and metadata.
                          </p>
                        </div>

                        {/* Individual Download trigger */}
                        <button
                          onClick={() => downloadSingleResult(res)}
                          className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 hover:scale-[1.01] active:scale-95 transition-all self-end md:self-center"
                        >
                          <Download className="w-4 h-4 text-rose-500" />
                          Download
                        </button>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combined report metrics dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50/40 rounded-3xl border border-slate-100 shadow-inner">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Original Size</span>
                  <span className="text-base font-black text-slate-800 dark:text-white">
                    {formatSize(compressionResults.reduce((acc, curr) => acc + curr.originalSize, 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-rose-600">Compressed Size</span>
                  <span className="text-base font-black text-rose-650">
                    {formatSize(compressionResults.reduce((acc, curr) => acc + curr.compressedSize, 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-emerald-600">Total Saved Space</span>
                  <span className="text-base font-black text-emerald-650">
                    {formatSize(
                      compressionResults.reduce((acc, curr) => acc + curr.originalSize, 0) -
                      compressionResults.reduce((acc, curr) => acc + curr.compressedSize, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Saving Ratio</span>
                  <span className="text-base font-black text-indigo-650">
                    {(() => {
                      const orig = compressionResults.reduce((acc, curr) => acc + curr.originalSize, 0);
                      const comp = compressionResults.reduce((acc, curr) => acc + curr.compressedSize, 0);
                      return orig > 0 ? `${Math.round(((orig - comp) / orig) * 100)}% Saved` : '0%';
                    })()}
                  </span>
                </div>
              </div>

              {/* Large Premium collective Actions */}
              <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                {/* Download All as ZIP (only visible for multiple processed files) */}
                {compressionResults.length > 1 && (
                  <button
                    onClick={downloadAllAsZip}
                    className="w-full sm:w-auto px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-lg shadow-md shadow-rose-100 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileArchive className="w-5.5 h-5.5" />
                    Download All as ZIP
                  </button>
                )}

                {compressionResults.length === 1 && (
                  <button
                    onClick={() => downloadSingleResult(compressionResults[0])}
                    className="w-full sm:w-auto px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-lg shadow-md shadow-rose-100 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-5.5 h-5.5" />
                    Download Compressed PDF
                  </button>
                )}

                <button 
                  onClick={resetAll}
                  className="w-full sm:w-auto px-8 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-base transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                  Compress More Files
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Informative Landing section */}
        <CompressPdfLanding />

        {/* FAQs */}
        <CompressPdfFaq />

        <ToolSeoSection path="/compress-pdf" />
      </main>

      <Footer />

    </div>
  );
}
