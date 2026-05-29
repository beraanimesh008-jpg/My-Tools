import { useState, useCallback } from 'react';
import Navbar from '@/src/components/Navbar';
import { trackFileProcessed } from '@/src/utils/analytics';
import { Shrink, Download, Loader2, CheckCircle, ArrowLeft, FileText, Settings, Zap, Shield, AlertCircle, Info, Trash2, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { useDropzone } from 'react-dropzone';
import SEO from '@/src/components/SEO';

const COMPRESS_PDF_FAQS = [
  {
    question: "How do I reduce the file size of a PDF online for free?",
    answer: "Simply upload your PDF by clicking inside the dashed dropzone or dropping it in. Choose your preferred optimization level using the precision slider, and click 'Compress PDF'. Your shrunken document compiles locally and triggers a safe automatic download."
  },
  {
    question: "Is there a limit on how small I can make my PDF files?",
    answer: "Our tool offers Low, Medium, and Strong compression profiles, allowing you to reduce the document size by up to 90% depending on the volume of embedded elements and images."
  },
  {
    question: "Is browser-side compression secure?",
    answer: "Yes, My Loves PDF executes all operations directly within your local client sandbox. This ensures and guarantees that sensitive data is never dispatched to cloud processing servers."
  }
];


// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function CompressPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressionPercent, setCompressionPercent] = useState(50);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Password Decryption States & Helper
  const [passwordPrompt, setPasswordPrompt] = useState<{ fileName: string; resolve: (p: string | null) => void; error?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const getCompressionInfo = (percent: number) => {
    if (percent <= 30) return { title: 'Low Compression', desc: 'High Quality (Text & Images preserved)', color: 'text-emerald-500' };
    if (percent <= 60) return { title: 'Medium Compression', desc: 'Balanced Quality (Optimized for Web)', color: 'text-orange-500' };
    if (percent <= 85) return { title: 'Strong Compression', desc: 'Low Quality (Maximum Size Reduction)', color: 'text-rose-500' };
    return { title: 'Extreme Compression', desc: 'Lowest Quality (Text might get slightly fuzzy)', color: 'text-rose-600' };
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProcessingStatus('Starting compression...');
    setOriginalSize(files[0].size);
    setError(null);
    
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF for processing with password support
      setProcessingStatus('Analyzing document...');
      let pdf;
      let password = '';
      let unlockSuccess = false;

      while (!unlockSuccess) {
        try {
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0), password: password || undefined });
          pdf = await loadingTask.promise;
          unlockSuccess = true;
        } catch (err: any) {
          if (err.name === 'PasswordException' || String(err.message || '').toLowerCase().includes('password')) {
            const promptError = password ? 'Incorrect password. Please try again.' : undefined;
            const enteredPassword = await askForPassword(file.name, promptError);
            if (enteredPassword === null) {
              throw new Error(`Decrypting "${file.name}" was cancelled.`);
            }
            password = enteredPassword;
          } else {
            throw err;
          }
        }
      }

      if (!pdf) throw new Error('Failed to parse PDF document.');
      const totalPages = pdf.numPages;

      // Create new PDF with pdf-lib
      const outPdf = await PDFDocument.create();
      
      // Determine quality parameters based on slider
      // Higher compression % = lower scale and quality
      let scale = 1.5;
      let quality = 0.8;

      if (compressionPercent <= 30) {
        scale = 2.0;
        quality = 0.9;
      } else if (compressionPercent <= 60) {
        scale = 1.5;
        quality = 0.7;
      } else if (compressionPercent <= 85) {
        scale = 1.2;
        quality = 0.5;
      } else {
        scale = 0.9;
        quality = 0.3;
      }

      for (let i = 1; i <= totalPages; i++) {
        setProcessingStatus(`Processing page ${i} of ${totalPages}...`);
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        
        // Render page to canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convert canvas to compressed JPG
        const imageData = canvas.toDataURL('image/jpeg', quality);
        const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());
        
        // Embed image into new PDF
        const pdfImage = await outPdf.embedJpg(imageBytes);
        const newPage = outPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }

      setProcessingStatus('Finalizing document structure...');
      const pdfBytes = await outPdf.save({
        useObjectStreams: true,
        addDefaultPage: false
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setCompressedSize(blob.size);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

      // Track files processed in analytics
      trackFileProcessed(1);

      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${files[0].name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#fb7185']
      });
    } catch (err: any) {
      console.error("Compression error:", err);
      setError('Failed to compress PDF. The file might be corrupted or too complex for browser processing.');
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
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const savingPercentage = originalSize > 0 
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
      <Navbar />
      <SEO 
        title="Compress PDF Online - Shrink PDF File Size Free" 
        description="Reduce PDF file size online within your browser securely. Free tool to compress high quality PDFs, shrink images, and optimize documents for web sharing."
        path="/compress-pdf"
        faqs={COMPRESS_PDF_FAQS}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-16">
        {!resultUrl ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-rose-600 mb-6 bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-full font-bold text-sm">
                <Zap className="w-4 h-4" />
                Browser-Side Optimization
              </div>
              <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Compress PDF Online</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto">
                Reduce PDF file size without losing quality. Fully private processing in your browser.
              </p>
            </div>

            {error && (
              <div className="w-full max-w-2xl mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            {files.length === 0 ? (
              <div 
                {...getRootProps()}
                className={`w-full max-w-4xl min-h-[350px] flex flex-col items-center justify-center p-12 rounded-[3.5rem] border-4 border-dashed transition-all duration-300 cursor-pointer
                  ${isDragActive ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-700'}
                `}
              >
                <input {...getInputProps()} />
                <div className="w-24 h-24 bg-rose-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200 dark:shadow-none mb-8">
                  <Shrink className="text-white w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Select PDF to compress</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-bold">or drag and drop here</p>
              </div>
            ) : (
              <div className="w-full max-w-4xl space-y-8">
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border-2 border-slate-100 dark:border-slate-700 shadow-xl">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">{files[0].name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatSize(files[0].size)}</p>
                      </div>
                    </div>
                    <button onClick={reset} className="text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-8 p-6 bg-slate-50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-rose-500" />
                        <span className="font-black text-slate-800 dark:text-white uppercase tracking-wider">Compression Level</span>
                      </div>
                      <span className="text-3xl font-black text-rose-600">{compressionPercent}%</span>
                    </div>

                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={compressionPercent}
                      onChange={(e) => setCompressionPercent(parseInt(e.target.value))}
                      className="w-full h-3 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 border border-slate-200 dark:border-slate-700"
                    />

                    <div className="flex justify-between">
                      <div className="text-center flex-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Better Quality</div>
                        <div className="w-full h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                          {compressionPercent < 35 && <div className="h-full bg-emerald-500 w-full" />}
                        </div>
                      </div>
                      <div className="w-8" />
                      <div className="text-center flex-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Smallest Size</div>
                        <div className="w-full h-1 bg-rose-500/20 rounded-full overflow-hidden">
                          {compressionPercent > 75 && <div className="h-full bg-rose-500 w-full" />}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                      <Info className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      <div>
                        <p className={`font-black uppercase tracking-wider text-sm ${getCompressionInfo(compressionPercent).color}`}>
                          {getCompressionInfo(compressionPercent).title}
                        </p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {getCompressionInfo(compressionPercent).desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col items-center">
                    <button
                      onClick={handleCompress}
                      disabled={isProcessing}
                      className="w-full bg-rose-600 text-white py-6 rounded-2xl font-black text-2xl shadow-2xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all hover:scale-[1.01] active:scale-95 disabled:grayscale disabled:opacity-50 flex flex-col items-center gap-2 group"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="text-sm tracking-widest uppercase">{processingStatus}</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-4">
                          Compress PDF
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Shrink className="w-6 h-6" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-[3.5rem] p-16 text-center shadow-2xl border-2 border-rose-50 dark:border-slate-700 max-w-3xl mx-auto"
          >
            <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-200">
              <CheckCircle className="text-white w-16 h-16" />
            </div>
            <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-6">Success!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-12 font-medium text-xl leading-relaxed">
              Your PDF has been compressed by <span className="text-rose-600 font-black">{savingPercentage}%</span>.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Original Size</div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">{formatSize(originalSize)}</div>
              </div>
              <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/20">
                <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Compressed Size</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatSize(compressedSize)}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <a 
                href={resultUrl} 
                download={`compressed_${files[0]?.name || 'document.pdf'}`}
                className="bg-rose-600 text-white px-12 py-6 rounded-[2rem] font-black text-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-rose-200 dark:shadow-none hover:scale-105"
              >
                <Download className="w-8 h-8" />
                Download PDF
              </a>
              <button 
                onClick={reset}
                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-12 py-6 rounded-[2rem] font-black text-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:scale-105"
              >
                Compress More
              </button>
            </div>
          </motion.div>
        )}

        {/* Feature Grid */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Privacy First</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Files never leave your device. All compression happens locally in your browser memory for absolute data security.
            </p>
          </div>
          <div className="p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">High Speed</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Optimized WASM and JavaScript algorithms ensure blazing fast compression without the need for server uploads.
            </p>
          </div>
          <div className="p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6">
              <Link to="/merge-pdf" className="text-slate-600 dark:text-slate-300">
                <Settings className="w-8 h-8" />
              </Link>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Full Control</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Choose your ideal balance between file size and quality with our precise compression slider.
            </p>
          </div>
        </section>

        {/* Dynamic Mobile Optimized FAQ Segment */}
        <section className="mt-32 max-w-4xl mx-auto font-sans">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Quick answers regarding document optimization safety and metrics.</p>
          </div>

          <div className="space-y-8 mb-20">
            {COMPRESS_PDF_FAQS.map((faq, idx) => (
              <div key={idx} className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 hover:border-rose-100 dark:hover:border-rose-900/40 transition-all">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-start gap-3">
                  <span className="text-rose-600 dark:text-rose-400 font-black">Q.</span>
                  {faq.question}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium pl-6 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Internal Interlinking Banner */}
          <div className="p-10 bg-rose-50/25 dark:bg-rose-950/10 rounded-[2.5rem] border border-rose-100/50 dark:border-rose-900/30 text-center">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Expand Your Workflow Directory</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-lg mx-auto">Access other high-precision tools designed to fast-track your office productivity completely free.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/merge-pdf" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105">
                Merge Multiple PDFs
              </Link>
              <Link to="/pdf-to-jpg" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105">
                Extract PDF to JPG
              </Link>
              <Link to="/jpg-to-pdf" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105">
                Convert JPG to PDF
              </Link>
              <Link to="/background-remover" className="px-6 py-4 bg-rose-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-rose-200 dark:shadow-none transition-all hover:scale-105">
                Remove Background (AI)
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 dark:border-slate-700/60 text-center"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200/20 dark:shadow-none animate-bounce">
                <Lock className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Enter PDF Password</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6 truncate px-2" title={passwordPrompt.fileName}>
                The file <span className="font-bold text-rose-600 dark:text-rose-400">"{passwordPrompt.fileName}"</span> is encrypted.
              </p>

              {passwordPrompt.error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-left">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
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
                    placeholder="Enter password..."
                    autoFocus
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white font-bold text-base focus:border-rose-500 focus:outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => passwordPrompt.resolve(null)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-rose-200 dark:shadow-none active:scale-95"
                  >
                    Unlock
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
