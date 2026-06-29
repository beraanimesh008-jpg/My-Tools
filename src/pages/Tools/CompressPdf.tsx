import { useState, useCallback, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import SEO from '@/src/components/SEO';
import ToolSeoSection from '@/src/components/ToolSeoSection';
import CompressPdfFaq from '@/src/components/CompressPdfFaq';
import CompressPdfLanding from '@/src/components/CompressPdfLanding';
import { trackFileProcessed } from '@/src/utils/analytics';
import { 
  Shrink, 
  Loader2, 
  FileText, 
  AlertCircle, 
  Trash2, 
  Lock, 
  ShieldCheck, 
  Download, 
  RotateCcw, 
  TrendingDown, 
  CheckCircle, 
  FileUp, 
  Sparkles,
  Layers,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import * as pdfjs from 'pdfjs-dist';
import { useDropzone } from 'react-dropzone';

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Only 3 compression options
  const [compressionOption, setCompressionOption] = useState<"low" | "recommended" | "maximum">("recommended");
  
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>("");
  
  const [result, setResult] = useState<{
    downloadId: string;
    fileName: string;
    originalSize: number;
    compressedSize: number;
    savedSize: number;
    savedPercentage: number;
    pageCount: number;
  } | null>(null);

  // Setup pdfjs worker source
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }, []);

  const handleFileChange = async (selectedFile: File) => {
    setError(null);
    setResult(null);
    setPageCount(null);
    setFile(selectedFile);

    // Validate size limit (100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("File exceeds 100MB limit. Please provide a smaller PDF.");
      setFile(null);
      return;
    }

    // Validate file type
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only standard PDF documents are supported.");
      setFile(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const loadingTask = pdfjs.getDocument({ data: fileBytes });
      const pdf = await loadingTask.promise;
      setPageCount(pdf.numPages);
    } catch (err: any) {
      console.error("PDF analysis failed:", err);
      const errMsg = String(err?.message || "").toLowerCase();
      if (err.name === 'PasswordException' || errMsg.includes("password") || errMsg.includes("encrypted") || errMsg.includes("decrypt")) {
        setError("Password Protected PDF. Security encryption prevents unauthorized compression. Please decrypt first.");
      } else {
        setError("Failed to read file. The PDF may be corrupted or invalid.");
      }
      setFile(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      handleFileChange(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  } as any);

  const handleCompress = async () => {
    if (!file) return;

    setError(null);
    setIsCompressing(true);
    setProgress(5);
    setStatusText("Reading document stream...");

    // Smooth simulated progress update
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 25) {
          setStatusText("Uploading file to server...");
          return prev + Math.floor(Math.random() * 5 + 3);
        } else if (prev < 70) {
          setStatusText("Compressing on our high-speed server...");
          return prev + Math.floor(Math.random() * 6 + 2);
        } else if (prev < 90) {
          setStatusText("Re-assembling optimized layout dictionary...");
          return prev + Math.floor(Math.random() * 3 + 1);
        } else if (prev < 98) {
          setStatusText("Finalizing stream compression...");
          return prev + 1;
        }
        return prev;
      });
    }, 350);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("level", compressionOption);

      const response = await fetch("/api/tools/pdf/compress", {
        method: "POST",
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to compress PDF");
      }

      const resData = await response.json();
      setProgress(100);
      setStatusText("Optimization complete!");

      const origSize = resData.originalSize;
      const compSize = resData.compressedSize;
      const savedBytes = origSize - compSize;
      const savedPercent = origSize > 0 ? Math.round((savedBytes / origSize) * 100) : 0;

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#fb7185', '#34d399', '#ffffff']
      });

      setTimeout(() => {
        setResult({
          downloadId: resData.downloadId,
          fileName: resData.fileName,
          originalSize: origSize,
          compressedSize: compSize,
          savedSize: savedBytes > 0 ? savedBytes : 0,
          savedPercentage: savedPercent > 0 ? savedPercent : 0,
          pageCount: resData.pageCount || pageCount || 1
        });
        setIsCompressing(false);
        trackFileProcessed(1);
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("Compression failed:", err);
      setError(err?.message || "An unexpected error occurred during compression.");
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    window.location.href = `/api/tools/pdf/download/${result.downloadId}`;
  };

  const resetAll = () => {
    setFile(null);
    setPageCount(null);
    setError(null);
    setResult(null);
    setCompressionOption("recommended");
    setProgress(0);
    setStatusText("");
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#090d16] transition-colors font-sans antialiased text-slate-800 dark:text-slate-200">
      <Navbar />
      
      <SEO 
        title="Compress PDF Online Free - Reduce PDF File Size Without Losing Quality" 
        description="Compress PDF files online for free. Reduce PDF size while maintaining text clarity, images and formatting."
        path="/compress-pdf"
      />

      <main className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Header Titles */}
        <div className="text-center mb-12 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-4.5 py-2 rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            Ghostscript High-Speed Server Compression
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Compress PDF Online Free
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Reduce PDF file size in seconds while preserving maximum visual quality, layout, formatting and text clarity.
          </p>
        </div>

        {/* Core Compression Card Container */}
        <div className="max-w-xl mx-auto">
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-400 text-left"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">Error Processing PDF</h4>
                  <p className="text-xs font-semibold leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            {!file && !result && (
              /* IDLE STATE: Upload Box */
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                {...getRootProps()}
                className={`w-full min-h-[300px] flex flex-col items-center justify-center p-8 sm:p-12 rounded-[2rem] border-3 border-dashed transition-all bg-white dark:bg-[#0f172a] shadow-sm cursor-pointer
                  ${isDragActive ? 'border-rose-500 bg-rose-50/15 dark:bg-rose-950/10' : 'border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50'}
                `}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center shadow-md shadow-rose-200 dark:shadow-none mb-6 text-white">
                  <FileUp className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-1">Select PDF File</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold mb-6 text-center">
                  Drag and drop your document here, or browse local files
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 text-[11px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <span>PDF format up to 100MB</span>
                  <span className="hidden sm:inline">•</span>
                  <span>100% Confidential & Secure</span>
                </div>
              </motion.div>
            )}

            {file && isAnalyzing && (
              /* LOADING/ANALYSIS STATE */
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-8 sm:p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]"
              >
                <Loader2 className="w-12 h-12 text-rose-600 animate-spin mb-4" />
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Analyzing file structure...</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1">Reading elements and verifying integrity</p>
              </motion.div>
            )}

            {file && !isAnalyzing && !isCompressing && !result && (
              /* READY STATE: File details, options, Compress button */
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-sm text-left space-y-6"
              >
                {/* File Details card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/35 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-450 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate pr-2">{file.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        {formatSize(file.size)} {pageCount !== null && `• ${pageCount} Pages`}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={resetAll}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-650 rounded-xl transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Compression Level Presets */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Choose Compression Level
                  </label>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {/* Low Compression option */}
                    <button
                      type="button"
                      onClick={() => setCompressionOption("low")}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                        compressionOption === "low" 
                          ? 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/15 ring-2 ring-rose-500/10' 
                          : 'border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        compressionOption === "low" ? 'border-rose-650 bg-rose-650 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {compressionOption === "low" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-800 dark:text-white">Low Compression</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold">High Quality</span>
                        </div>
                        <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
                          Slight compression while fully preserving crisp 300 DPI high-definition imagery and layout.
                        </p>
                      </div>
                    </button>

                    {/* Recommended Compression option */}
                    <button
                      type="button"
                      onClick={() => setCompressionOption("recommended")}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                        compressionOption === "recommended" 
                          ? 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/15 ring-2 ring-rose-500/10' 
                          : 'border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        compressionOption === "recommended" ? 'border-rose-650 bg-rose-650 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {compressionOption === "recommended" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-800 dark:text-white">Recommended Compression</span>
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">Perfect Balance</span>
                        </div>
                        <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
                          Standardizes colors at 150 DPI. Outstanding size reduction with virtually no visible loss in text and layout quality.
                        </p>
                      </div>
                    </button>

                    {/* Maximum Compression option */}
                    <button
                      type="button"
                      onClick={() => setCompressionOption("maximum")}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                        compressionOption === "maximum" 
                          ? 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/15 ring-2 ring-rose-500/10' 
                          : 'border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        compressionOption === "maximum" ? 'border-rose-650 bg-rose-650 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {compressionOption === "maximum" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-800 dark:text-white">Maximum Compression</span>
                          <span className="text-[10px] bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold">Smallest Size</span>
                        </div>
                        <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
                          High compression rate, standardizes imagery to 72 DPI. Best for quick web transfers and ultra-tight mail storage.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={handleCompress}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-rose-100 dark:shadow-none active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shrink className="w-4.5 h-4.5" />
                  Compress PDF
                </button>
              </motion.div>
            )}

            {isCompressing && (
              /* COMPRESSING STATE: Simple single progress bar */
              <motion.div
                key="compressing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-8 sm:p-12 shadow-sm text-center space-y-6 min-h-[300px] flex flex-col justify-center"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Optimizing PDF Structure</h3>
                  <p className="text-slate-450 dark:text-slate-400 text-xs font-semibold">{statusText}</p>
                </div>

                {/* Single Professional Progress Bar */}
                <div className="w-full space-y-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">{progress}%</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Your document remains highly encrypted and private
                </div>
              </motion.div>
            )}

            {result && !isCompressing && (
              /* SUCCESS / RESULT STATE */
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-sm text-left space-y-8"
              >
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">PDF Compressed Successfully!</h3>
                  <p className="text-slate-450 dark:text-slate-550 text-xs font-bold truncate max-w-[320px] mx-auto">
                    {result.fileName}
                  </p>
                </div>

                {/* Comparison Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Original Size */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-1">
                      Original Size
                    </span>
                    <span className="text-base font-black text-slate-700 dark:text-slate-300">
                      {formatSize(result.originalSize)}
                    </span>
                  </div>

                  {/* Compressed Size */}
                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl">
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-extrabold uppercase block mb-1">
                      Compressed Size
                    </span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {formatSize(result.compressedSize)}
                    </span>
                  </div>

                  {/* Saved Size */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-1">
                      Saved Size
                    </span>
                    <span className="text-base font-black text-slate-700 dark:text-slate-300">
                      {formatSize(result.savedSize)}
                    </span>
                  </div>

                  {/* Compression Percentage */}
                  <div className="p-4 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-rose-600/70 dark:text-rose-450/70 font-extrabold uppercase block mb-1">
                      Compression Ratio
                    </span>
                    <span className="text-base font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <TrendingDown className="w-4.5 h-4.5 text-rose-500" />
                      {result.savedPercentage}% Smaller
                    </span>
                  </div>
                </div>

                {/* Actions Block */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleDownload}
                    className="w-full py-4.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-rose-150 dark:shadow-none active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                  
                  <button
                    onClick={resetAll}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Compress Another File
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                  Notice: Files are unlinked immediately after download or automatically destroyed after 30 minutes to protect your privacy.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Landing Info & Explanations sections */}
        <div className="mt-20">
          <CompressPdfLanding />
        </div>

        <div className="mt-16">
          <ToolSeoSection path="/compress-pdf" />
        </div>

        <div className="mt-16">
          <CompressPdfFaq />
        </div>

      </main>

      <Footer />
    </div>
  );
}
