import { useState, useCallback, useRef } from 'react';
import Navbar from '@/src/components/Navbar';
import { trackFileProcessed } from '@/src/utils/analytics';
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle, 
  ArrowLeft, 
  Trash2, 
  Settings, 
  Zap, 
  Shield, 
  AlertCircle, 
  Info,
  Layers,
  Image as ImageIcon,
  Archive,
  RefreshCcw,
  Check,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import { useDropzone } from 'react-dropzone';
import SEO from '@/src/components/SEO';

const PDF_TO_JPG_FAQS = [
  {
    question: "How do I convert PDF pages to JPG images online for free?",
    answer: "Simply upload your PDF document, select your preferred quality multiplier (80%, 90%, 100%), and let our high-speed tool extract every page into a crisp JPG. Download them as individual files or a aggregated ZIP file package safely."
  },
  {
    question: "Is there a page count limit when extracting images from PDF?",
    answer: "No, My Loves PDF provides uncompromised bulk extraction. You can convert short invoices or multi-hundred page ebooks completely free of charge and signup limitations."
  },
  {
    question: "Is my document data secure?",
    answer: "Absolutely, privacy is guaranteed. All PDF to image rendering is mapped in your secure client environment, assuring no external leaks ever occur."
  }
];


// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState(90);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

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
      setFile(acceptedFiles[0]);
      setError(null);
      setImages([]);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  } as any);

  const handleConvert = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProcessingStatus('Reading PDF...');
    setProgress(0);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
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
      const convertedImages: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        setProcessingStatus(`Rendering page ${i} of ${totalPages}...`);
        
        const page = await pdf.getPage(i);
        // Scale 2.0 = ~150-200 DPI depending on the PDF
        const viewport = page.getViewport({ scale: 2.0 }); 
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // White background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const imgData = canvas.toDataURL('image/jpeg', quality / 100);
        convertedImages.push(imgData);
        setProgress(Math.round((i / totalPages) * 100));
      }

      setImages(convertedImages);
      
      // Track file processed in analytics
      trackFileProcessed(1);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#fb7185']
      });
    } catch (err: any) {
      console.error('PDF conversion error:', err);
      setError('Failed to convert PDF. The file might be corrupted, password protected, or too large for browser memory.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const downloadZip = async () => {
    if (images.length === 0) return;
    setIsZipping(true);
    
    try {
      const zip = new JSZip();
      const folder = zip.folder("pdf-images");
      
      if (!folder) throw new Error("Could not create ZIP folder");

      for (let i = 0; i < images.length; i++) {
        const base64Data = images[i].split(',')[1];
        folder.file(`page-${i + 1}.jpg`, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file?.name?.replace('.pdf', '') || 'images'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("ZIP creation failed:", err);
      setError("Failed to create ZIP file. Try downloading individual images instead.");
    } finally {
      setIsZipping(false);
    }
  };

  const reset = () => {
    setFile(null);
    setImages([]);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
      <Navbar />
      <SEO 
        title="Convert PDF to JPG Online - Free PDF Image Extractor" 
        description="Extract images and convert PDF pages into beautiful high-resolution JPG photos easily. Bulk export pages inside a ZIP file directly in your browser."
        path="/pdf-to-jpg"
        faqs={PDF_TO_JPG_FAQS}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-16">
        <AnimatePresence mode="wait">
          {images.length === 0 ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 text-rose-600 mb-6 bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-full font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  PDF to Image Engine
                </div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">PDF to JPG</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto">
                  Extract every page of your PDF as a high-quality JPG image. Done entirely in your browser.
                </p>
              </div>

              {error && (
                <div className="w-full max-w-2xl mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-bold">{error}</p>
                </div>
              )}

              {!file ? (
                <>
                  <div 
                    {...getRootProps()}
                    className={`w-full max-w-4xl min-h-[400px] flex flex-col items-center justify-center p-12 rounded-[3.5rem] border-4 border-dashed transition-all duration-300 cursor-pointer
                      ${isDragActive ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-700'}
                    `}
                  >
                    <input {...getInputProps()} />
                    <div className="w-32 h-32 bg-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-200 dark:shadow-none mb-8">
                      <FileText className="text-white w-16 h-16" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Select PDF file</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-bold">or drag and drop here</p>
                  </div>
                </>
              ) : (
                <div className="w-full max-w-md">
                  <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border-2 border-slate-100 dark:border-slate-700 shadow-2xl space-y-8">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-4 truncate">
                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-rose-600" />
                        </div>
                        <div className="truncate">
                          <p className="font-black text-slate-800 dark:text-white truncate">{file.name}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={reset} className="text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-rose-600" />
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Image Quality</span>
                        </div>
                        <span className="text-sm font-black text-rose-600">{quality}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                      />
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase px-1">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>Full</span>
                      </div>
                    </div>

                    <button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="w-full bg-rose-600 text-white rounded-2xl py-6 font-black text-xl shadow-2xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 flex flex-col items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="text-xs uppercase tracking-widest font-black">{processingStatus} ({progress}%)</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-4 uppercase tracking-tighter">
                          Convert to JPG
                          <ChevronRight className="w-6 h-6" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Results Header */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 glassmorphism">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Conversion Complete</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest">{images.length} Pages Extracted</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={downloadZip}
                    disabled={isZipping}
                    className="bg-rose-600 text-white px-8 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 dark:shadow-none hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isZipping ? <Loader2 className="w-6 h-6 animate-spin" /> : <Archive className="w-6 h-6" />}
                    Download ZIP
                  </button>
                  <button 
                    onClick={reset}
                    className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-8 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:scale-105 active:scale-95"
                  >
                    <RefreshCcw className="w-6 h-6" />
                    New PDF
                  </button>
                </div>
              </div>

              {/* Previews Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {images.map((img, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img src={img} alt={`Page ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <a 
                          href={img} 
                          download={`page-${i + 1}.jpg`}
                          className="bg-white text-rose-600 p-5 rounded-[1.5rem] font-black flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all hover:scale-110 active:scale-90"
                        >
                          <Download className="w-6 h-6" />
                          Save Page {i + 1}
                        </a>
                      </div>
                    </div>
                    <div className="p-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Page {i + 1}</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Highlights */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-100 dark:border-slate-800 pt-24">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-2 group transition-all hover:bg-rose-600">
              <Shield className="w-10 h-10 text-rose-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Secure & Private</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Your files never leave your device. All rendering and conversion happen locally in your browser memory.
            </p>
          </div>
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-2 group transition-all hover:bg-rose-600">
              <Zap className="w-10 h-10 text-rose-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Blazing Fast</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Utilizing a high-performance rendering engine to extract images from multi-page PDFs in seconds.
            </p>
          </div>
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-2 group transition-all hover:bg-rose-600">
              <Layers className="w-10 h-10 text-rose-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Bulk Export</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Don't manually save every page. One click to bundle all your extracted images into a single ZIP archive.
            </p>
          </div>
        </section>

        {/* Dynamic Mobile Optimized FAQ Segment */}
        <section className="mt-32 max-w-4xl mx-auto font-sans">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Quick answers regarding bulk extraction, confidentiality, and performance.</p>
          </div>

          <div className="space-y-8 mb-20">
            {PDF_TO_JPG_FAQS.map((faq, idx) => (
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

          {/* Internal Interlinking Directory */}
          <div className="p-10 bg-rose-50/25 dark:bg-rose-950/10 rounded-[2.5rem] border border-rose-100/50 dark:border-rose-900/30 text-center">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Need Sibling Converter Upgrades?</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-lg mx-auto">Access other fast-conversion modules built to merge, size-down, or rebuild documents safely.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/merge-pdf" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105">
                Merge PDFs
              </Link>
              <Link to="/compress-pdf" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105">
                Compress PDF Size
              </Link>
              <Link to="/jpg-to-pdf" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105">
                JPG to PDF Convert
              </Link>
              <Link to="/background-remover" className="px-6 py-4 bg-rose-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-rose-200 dark:shadow-none transition-all hover:scale-105">
                Cut Background (AI)
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

