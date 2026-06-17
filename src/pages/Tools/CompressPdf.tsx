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
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import * as pdfjs from 'pdfjs-dist';
import { useDropzone } from 'react-dropzone';
import SEO from '@/src/components/SEO';
import ToolSeoSection from '@/src/components/ToolSeoSection';
import CompressPdfFaq from '@/src/components/CompressPdfFaq';
import CompressPdfLanding from '@/src/components/CompressPdfLanding';
import CompressPdfResult from '@/src/components/CompressPdfResult';
import Footer from '@/src/components/Footer';

import { 
  COMPRESSION_STEPS, 
  CompressionStep, 
  runCompressionWorkflow 
} from '@/src/utils/pdfCompressionEngine';

export default function CompressPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Stats
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Default level Recommended (2)
  const [compressionLevel, setCompressionLevel] = useState<CompressionStep>(2);

  // Advanced toggles
  const [keepOriginalQuality, setKeepOriginalQuality] = useState<boolean>(false);
  const [optimizeImages, setOptimizeImages] = useState<boolean>(true);
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);
  const [fastCompression, setFastCompression] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Decryption variables
  const [passwordPrompt, setPasswordPrompt] = useState<{ fileName: string; resolve: (p: string | null) => void; error?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Refs for state retention across threads
  const originalPagesInfo = useRef<{ pageCount: number; opCircleCounts: number[] } | null>(null);
  const decryptedPdfBytesRef = useRef<Uint8Array | null>(null);
  const pdfPasswordRef = useRef<string | null>(null);

  const askForPassword = (fileName: string, promptError?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setShowPassword(false);
      setPasswordPrompt({
        fileName,
        error: promptError,
        resolve: (p: string | null) => {
          setPasswordPrompt(null);
          resolve(p);
        },
      });
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles([acceptedFiles[0]]);
      setError(null);
      setResultUrl(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  } as any);

  // Parse document page metadata and decryption loops on drop
  useEffect(() => {
    if (files.length === 0) {
      setTotalPages(0);
      originalPagesInfo.current = null;
      decryptedPdfBytesRef.current = null;
      pdfPasswordRef.current = null;
      return;
    }

    const loadMeta = async () => {
      setIsAnalyzing(true);
      setError(null);
      decryptedPdfBytesRef.current = null;
      pdfPasswordRef.current = null;
      try {
        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        
        let pdf;
        let password = '';
        let unlockSuccess = false;
        let wasEncrypted = false;

        // Verify encryption first
        try {
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) });
          pdf = await loadingTask.promise;
          unlockSuccess = true;
        } catch (err: any) {
          if (err.name === 'PasswordException' || String(err.message || '').toLowerCase().includes('password')) {
            wasEncrypted = true;
          } else {
            throw err;
          }
        }

        if (wasEncrypted) {
          while (!unlockSuccess) {
            try {
              const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0), password: password || undefined });
              pdf = await loadingTask.promise;
              unlockSuccess = true;
            } catch (err: any) {
              if (err.name === 'PasswordException' || String(err.message || '').toLowerCase().includes('password')) {
                const promptError = password ? 'Incorrect PDF password.' : undefined;
                const enteredPassword = await askForPassword(file.name, promptError);
                if (enteredPassword === null) {
                  throw new Error(`This PDF is password protected. Password is required to optimize embedded streams.`);
                }
                password = enteredPassword;
              } else {
                throw err;
              }
            }
          }
        }

        if (pdf) {
          setTotalPages(pdf.numPages);
          pdfPasswordRef.current = password || null;
          
          let decryptedBytes: Uint8Array;
          try {
            decryptedBytes = await pdf.saveDocument();
          } catch (saveErr) {
            console.warn("Could not extract clean bytes Copy, using standard arrayBuffer", saveErr);
            decryptedBytes = new Uint8Array(arrayBuffer);
          }
          decryptedPdfBytesRef.current = decryptedBytes;

          // Capture reference layout metrics to verify pages do not become blank
          const opCircleCounts: number[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            try {
              const page = await pdf.getPage(i);
              const opList = await page.getOperatorList();
              opCircleCounts.push(opList.fnArray.length);
            } catch (pErr) {
              console.warn(`Could not capture reference operator list for page ${i}:`, pErr);
              opCircleCounts.push(0);
            }
          }
          originalPagesInfo.current = {
            pageCount: pdf.numPages,
            opCircleCounts
          };
        }
      } catch (err: any) {
        console.error("PDF Meta load error:", err);
        setError(err.message || 'Could not parse document structure. File may be corrupted.');
        setFiles([]);
        decryptedPdfBytesRef.current = null;
        pdfPasswordRef.current = null;
      } finally {
        setIsAnalyzing(false);
      }
    };

    loadMeta();
  }, [files]);

  // Handle core compression sequence using utility module
  const handleCompress = async () => {
    if (files.length === 0 || !originalPagesInfo.current) return;
    
    setIsProcessing(true);
    setProgress(10);
    setProcessingStatus('Starting smart analyzer...');
    setOriginalSize(files[0].size);
    setError(null);
    
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const inputBytes = decryptedPdfBytesRef.current || new Uint8Array(arrayBuffer);
      
      const result = await runCompressionWorkflow(inputBytes, {
        compressionLevel,
        keepOriginalQuality,
        optimizeImages,
        removeMetadata,
        onProgress: (pct, msg) => {
          setProgress(pct);
          setProcessingStatus(msg);
        },
        originalPagesInfo: originalPagesInfo.current,
        password: pdfPasswordRef.current || undefined
      });

      const finalSize = result.finalPdfBytes.length;
      if (finalSize <= 0) {
        throw new Error('Resulting PDF has empty byte sizes.');
      }

      setCompressedSize(finalSize);
      setCompressionLevel(result.successfulLevel); // Update level to reflect actually successful preset!
      
      const compressedBlob = new Blob([result.finalPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(compressedBlob);
      setResultUrl(url);

      setProgress(100);
      setProcessingStatus('PDF Optimized Successfully!');
      trackFileProcessed(1);

      // Trigger high-compatibility download
      const link = document.createElement('a');
      link.href = url;
      const downloadName = file.name.toLowerCase().endsWith('.pdf') ? file.name : `${file.name}.pdf`;
      link.download = `compressed_${downloadName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({
        particleCount: 140,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#e11d48', '#f43f5e', '#ffffff']
      });
    } catch (err: any) {
      console.error("Smart compression failure:", err);
      setError(err.message || 'The PDF document validation or processing failed.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const reset = () => {
    setFiles([]);
    setResultUrl(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setTotalPages(0);
    setProgress(0);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentModeInfo = COMPRESSION_STEPS[compressionLevel];

  // Visual text progress steps computation
  const getStepStatus = (step: 'upload' | 'parse' | 'optimize' | 'finalize') => {
    if (step === 'upload') {
      if (progress < 25) return 'active';
      return 'completed';
    }
    if (step === 'parse') {
      if (progress < 25) return 'pending';
      if (progress >= 25 && progress < 50) return 'active';
      return 'completed';
    }
    if (step === 'optimize') {
      if (progress < 50) return 'pending';
      if (progress >= 50 && progress < 85) return 'active';
      return 'completed';
    }
    if (step === 'finalize') {
      if (progress < 85) return 'pending';
      if (progress >= 85 && progress < 100) return 'active';
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-50/55 dark:bg-[#090d16] transition-colors font-sans antialiased text-slate-800">
      <Navbar />
      
      <SEO 
        title="Compress PDF Online Free - Reduce PDF Size Without Losing Quality" 
        description="Compress PDF files online for free. Reduce PDF size without losing quality. Fast, secure and easy PDF compressor with high-quality optimization."
        path="/compress-pdf"
      />

      <main className="max-w-7xl mx-auto px-4 py-16">
        {!resultUrl ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            {/* Elegant Header Title Section */}
            <div className="text-center mb-12 space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 px-4.5 py-2 rounded-full shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                100% Client-Side Memory Engine
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Compress PDF Online Free - Reduce PDF Size Without Losing Quality
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-3xl mx-auto font-medium">
                Compress PDF Online Free. Optimize image assets and shrink payload sizes safely in your local browser sandbox. Text layers, forms, and coordinate vector programs remain preserved.
              </p>
            </div>

            {error && (
              <div className="w-full max-w-3xl mb-8 p-4 bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold leading-relaxed">{error}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="w-full max-w-3xl mb-8 p-5 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-2xl flex items-center gap-3.5 text-indigo-700 dark:text-indigo-400">
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 text-indigo-500" />
                <p className="text-sm font-bold">Decrypting file and reading operator stream maps into browser memory...</p>
              </div>
            )}

            {files.length === 0 ? (
              <div className="w-full max-w-4xl space-y-8">
                {/* Drag and Drop Zone */}
                <div 
                  {...getRootProps()}
                  className={`w-full min-h-[350px] flex flex-col items-center justify-center p-8 sm:p-12 rounded-[2.5rem] border-3 border-dashed transition-all duration-300 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-[0_12px_40px_rgba(244,63,94,0.04)] cursor-pointer
                    ${isDragActive ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-800 hover:border-rose-400'}
                  `}
                  id="dropzone"
                >
                  <input {...getInputProps()} />
                  <div className="w-20 h-20 bg-rose-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-none mb-8">
                    <Shrink className="text-white w-10 h-10" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-2 text-center">Select PDF to Compress</h2>
                  <p className="text-slate-450 text-sm font-semibold mb-6 text-center">or drag and drop your document here (up to 500MB)</p>
                  
                  <span className="px-6 py-3.5 bg-rose-600 text-white font-black text-sm rounded-xl tracking-wide shadow-md shadow-rose-100 hover:bg-rose-700 hover:shadow-lg transition-all active:scale-95 cursor-pointer">
                    Choose PDF File
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-4xl space-y-8">
                <div className="bg-white dark:bg-[#0f172a] rounded-[2.5rem] p-6 sm:p-10 border border-slate-150 dark:border-slate-800 shadow-sm space-y-8">
                  
                  {/* File specs card */}
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-rose-600" />
                      </div>
                      <div className="max-w-[180px] sm:max-w-md truncate">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate" title={files[0].name}>
                          {files[0].name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 font-bold">
                          <span>Original size: {formatSize(files[0].size)}</span>
                          {totalPages > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{totalPages} Pages</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={reset}
                      disabled={isProcessing}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl transition-all disabled:opacity-40"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Range Slider & Bento Selection sync */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4.5 h-4.5 text-rose-500" />
                      <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
                        Select Compression Level
                      </h4>
                    </div>

                    {/* Step Cards Bento Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {(Object.keys(COMPRESSION_STEPS) as unknown as CompressionStep[]).map((levelNum) => {
                        const info = COMPRESSION_STEPS[levelNum];
                        const isSelected = compressionLevel === levelNum;
                        return (
                          <div
                            key={levelNum}
                            onClick={() => !isProcessing && setCompressionLevel(levelNum)}
                            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative flex flex-col justify-between
                              ${isSelected 
                                ? 'border-rose-500 bg-rose-50/15 ring-2 ring-rose-500/10' 
                                : 'border-slate-150 hover:border-slate-350 bg-white dark:bg-slate-900'
                              }
                              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-black text-slate-900 dark:text-white text-sm">{info.label}</span>
                                {isSelected && (
                                  <div className="w-4 h-4 bg-rose-600 rounded-full flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded block w-fit">
                                {info.badge}
                              </span>
                              <p className="text-[11px] text-slate-400 font-medium pt-2 leading-relaxed">{info.desc}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-3 flex justify-between items-center text-xs font-bold text-slate-400">
                              <span>Reduces approx</span>
                              <span className={`${isSelected ? 'text-rose-600 font-extrabold' : 'text-slate-500'}`}>~{info.approxReduction}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Styled Range Slider Input */}
                    <div className="pt-4 pb-2 px-1">
                      <input 
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={compressionLevel}
                        onChange={(e) => setCompressionLevel(parseInt(e.target.value) as CompressionStep)}
                        disabled={isProcessing}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-600 disabled:opacity-40"
                      />
                      <div className="flex justify-between mt-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <button type="button" onClick={() => !isProcessing && setCompressionLevel(1)}>Low</button>
                        <button type="button" onClick={() => !isProcessing && setCompressionLevel(2)}>Medium</button>
                        <button type="button" onClick={() => !isProcessing && setCompressionLevel(3)}>High</button>
                        <button type="button" onClick={() => !isProcessing && setCompressionLevel(4)}>AI Smart</button>
                      </div>
                    </div>
                  </div>

                  {/* Advanced settings toggles collapsable block */}
                  <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/30">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between text-left text-xs font-black uppercase text-slate-505"
                    >
                      <span className="flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-rose-500" />
                        Advanced Custom Overrides
                      </span>
                      {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {showAdvanced && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-150/60">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-150 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={keepOriginalQuality} 
                            onChange={(e) => setKeepOriginalQuality(e.target.checked)}
                            disabled={isProcessing}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 rounded-md" 
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Lock Retina DPI</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Keeps high-dpi layout variables untouched</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-150 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={optimizeImages} 
                            onChange={(e) => setOptimizeImages(e.target.checked)}
                            disabled={isProcessing}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 rounded-md" 
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Compress Image Streams</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Rescales pictures coordinates first</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-150 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={removeMetadata} 
                            onChange={(e) => setRemoveMetadata(e.target.checked)}
                            disabled={isProcessing}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 rounded-md" 
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Wipe Structural Metadata</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Strips uncompiled dictionaries for space</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-150 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={fastCompression} 
                            onChange={(e) => setFastCompression(e.target.checked)}
                            disabled={isProcessing}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 rounded-md" 
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Multi-Threading Engine</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Launches asynchronous memory allocation</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Processing Status Steps Stepper Block */}
                  {isProcessing && (
                    <div className="p-6 bg-slate-50 dark:bg-[#0c1221] rounded-3xl border border-slate-200/60 shadow-inner space-y-4">
                      {/* Active Status Header */}
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          {processingStatus}
                        </span>
                        <span className="text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md font-bold">
                          {progress}%
                        </span>
                      </div>
                      
                      {/* Numeric Progress Bar */}
                      <div className="w-full h-3 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/20">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full" 
                          style={{ width: `${progress}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>

                      {/* Four Checklist Steps Stepper */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        {/* Step 1 */}
                        <div className={`p-3 rounded-xl border flex flex-col justify-between text-left
                          ${getStepStatus('upload') === 'completed' ? 'bg-emerald-50/30 border-emerald-100 text-emerald-700' : ''}
                          ${getStepStatus('upload') === 'active' ? 'bg-rose-50/30 border-rose-200 text-rose-700 animate-pulse' : ''}
                          ${getStepStatus('upload') === 'pending' ? 'bg-white border-slate-100 text-slate-400' : ''}
                        `}>
                          <span className="text-[10px] font-black uppercase block mb-1">Step 1</span>
                          <span className="text-xs font-bold">Uploading File</span>
                        </div>

                        {/* Step 2 */}
                        <div className={`p-3 rounded-xl border flex flex-col justify-between text-left
                          ${getStepStatus('parse') === 'completed' ? 'bg-emerald-50/30 border-emerald-100 text-emerald-700' : ''}
                          ${getStepStatus('parse') === 'active' ? 'bg-rose-50/30 border-rose-200 text-rose-700 animate-pulse' : ''}
                          ${getStepStatus('parse') === 'pending' ? 'bg-white border-slate-100 text-slate-400' : ''}
                        `}>
                          <span className="text-[10px] font-black uppercase block mb-1">Step 2</span>
                          <span className="text-xs font-bold">Analyzing Structure</span>
                        </div>

                        {/* Step 3 */}
                        <div className={`p-3 rounded-xl border flex flex-col justify-between text-left
                          ${getStepStatus('optimize') === 'completed' ? 'bg-emerald-50/30 border-emerald-100 text-emerald-700' : ''}
                          ${getStepStatus('optimize') === 'active' ? 'bg-rose-50/30 border-rose-200 text-rose-700 animate-pulse' : ''}
                          ${getStepStatus('optimize') === 'pending' ? 'bg-white border-slate-100 text-slate-400' : ''}
                        `}>
                          <span className="text-[10px] font-black uppercase block mb-1">Step 3</span>
                          <span className="text-xs font-bold">Optimizing Streams</span>
                        </div>

                        {/* Step 4 */}
                        <div className={`p-3 rounded-xl border flex flex-col justify-between text-left
                          ${getStepStatus('finalize') === 'completed' ? 'bg-emerald-50/30 border-emerald-100 text-emerald-700' : ''}
                          ${getStepStatus('finalize') === 'active' ? 'bg-rose-50/30 border-rose-200 text-rose-700 animate-pulse' : ''}
                          ${getStepStatus('finalize') === 'pending' ? 'bg-white border-slate-100 text-slate-400' : ''}
                        `}>
                          <span className="text-[10px] font-black uppercase block mb-1">Step 4</span>
                          <span className="text-xs font-bold">Finalizing Packaging</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Activation Trigger */}
                  <div>
                    <button
                      onClick={handleCompress}
                      disabled={isProcessing || isAnalyzing || !totalPages}
                      className="w-full bg-rose-600 text-white py-5 sm:py-6 rounded-2xl font-black text-xl hover:bg-rose-700 transition-all hover:scale-[1.01] active:scale-95 disabled:grayscale disabled:opacity-45 flex items-center justify-center gap-3 cursor-pointer"
                      id="compress-button"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="uppercase tracking-widest text-base">Running Optimizer...</span>
                        </>
                      ) : (
                        <>
                          <span>Compress PDF</span>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Shrink className="w-4.5 h-4.5 text-white" />
                          </div>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Render extracted visual results stats dashboard metrics layout */
          <CompressPdfResult 
            fileName={files[0].name}
            resultUrl={resultUrl}
            originalSize={originalSize}
            compressedSize={compressedSize}
            reset={reset}
          />
        )}



        {/* Modular Landing info articles */}
        <CompressPdfLanding />

        {/* Modular interactive expandable FAQs accordion */}
        <CompressPdfFaq />

        <ToolSeoSection path="/compress-pdf" />
      </main>

      <Footer />

      {/* Security Password Unlock prompts overylay modal */}
      <AnimatePresence>
        {passwordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Lock className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Unlocking Encrypted PDF</h3>
              <p className="text-slate-500 text-xs font-semibold mb-6 px-2">
                This document is protected. Enter the password below so our CPU-sandbox can optimize the file's images.
              </p>

              {passwordPrompt.error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 px-3 text-rose-700 text-left">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <p className="text-xs font-bold leading-tight">{passwordPrompt.error}</p>
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.currentTarget as HTMLFormElement;
                const passwordInput = target.elements.namedItem('pdfPassword') as HTMLInputElement;
                passwordPrompt.resolve(passwordInput.value);
              }} className="space-y-6">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="pdfPassword"
                    name="pdfPassword"
                    placeholder="Document Password..."
                    autoFocus
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:border-rose-500 focus:outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => passwordPrompt.resolve(null)}
                    className="flex-1 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-100"
                  >
                    Unlock PDF
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
