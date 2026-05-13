import { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import Dropzone from '@/src/components/Dropzone';
import { Shrink, Download, Loader2, CheckCircle, ArrowLeft, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function CompressPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressionPercent, setCompressionPercent] = useState(50);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const getCompressionInfo = (percent: number) => {
    if (percent <= 35) return { title: 'Near Lossless', desc: 'Strict text & structural cleanup', color: 'text-emerald-500' };
    if (percent <= 65) return { title: 'Balanced', desc: 'Optimized image layers', color: 'text-orange-500' };
    if (percent <= 85) return { title: 'Strong', desc: 'DPI reduction & JPEG compression', color: 'text-rose-500' };
    return { title: 'Extreme', desc: 'Max size reduction, visuals preserved', color: 'text-rose-600' };
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProcessingStatus('Analyzing PDF...');
    setOriginalSize(files[0].size);
    
    try {
      // Smart Logic:
      // 1-35%: Structural cleanup (Server side) - Perfect for text/vector PDFs
      // 36-100%: Adaptive Page re-sampling (Rasterization) - Required to shrink image-heavy PDFs
      if (compressionPercent <= 35) {
        await handleSmartServerCompression();
      } else {
        // Calculate adaptive parameters based on percentage
        let renderScale = 2.0; // Default ~150 DPI
        let quality = 0.75;    // Default balanced

        if (compressionPercent <= 55) {
          // 36-55%: High quality (approx 220 DPI)
          renderScale = 3.0;
          quality = 0.85;
        } else if (compressionPercent <= 75) {
          // 56-75%: Balanced (approx 180 DPI)
          renderScale = 2.5;
          quality = 0.80;
        } else if (compressionPercent <= 90) {
          // 76-90%: Strong (approx 150 DPI)
          renderScale = 2.1;
          quality = 0.70;
        } else {
          // 91-100%: Maximum (approx 120 DPI)
          renderScale = 1.7;
          quality = 0.65;
        }

        await handleHighQualityRasterization(renderScale, quality);
      }
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#fb7185', '#ffffff']
      });
    } catch (error) {
      console.error(error);
      alert('Compression failed. This can happen with very large or encrypted PDFs.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleSmartServerCompression = async () => {
    setProcessingStatus('Removing unused objects...');
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('percent', compressionPercent.toString());

    const response = await fetch('/api/tools/pdf/compress', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Smart compression failed');

    const blob = await response.blob();
    setCompressedSize(blob.size);
    setResultUrl(URL.createObjectURL(blob));
  };

  const handleHighQualityRasterization = async (renderScale: number, quality: number) => {
    setProcessingStatus('Optimizing image layers...');
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    const formData = new FormData();

    for (let i = 1; i <= totalPages; i++) {
      setProcessingStatus(`Processing page ${i}/${totalPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: renderScale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Paint white background (important for PDFs with transparency)
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob) {
        formData.append('files', blob, `page-${i}.jpg`);
      }
    }

    setProcessingStatus('Rebuilding PDF structure...');
    const response = await fetch('/api/tools/pdf/jpg-to-pdf', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Rasterization failed');

    const blob = await response.blob();
    setCompressedSize(blob.size);
    setResultUrl(URL.createObjectURL(blob));
  };

  const reset = () => {
    setFiles([]);
    setResultUrl(null);
    setOriginalSize(0);
    setCompressedSize(0);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200">
              <Shrink className="text-white w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Compress PDF</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Reduce your PDF file size while keeping visual quality.</p>
            </div>
          </div>
        </div>

        {!resultUrl ? (
          <div className="space-y-10">
            <Dropzone 
              label="Select PDF file"
              accept={{ 'application/pdf': ['.pdf'] }}
              files={files}
              onFilesAdded={(newFiles) => setFiles([newFiles[0]])} // Only one for compression
              onRemoveFile={() => setFiles([])}
            />

            <AnimatePresence>
              {files.length === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-10"
                >
                  <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border-2 border-rose-100 dark:border-slate-700 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
                          <Shrink className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Compression Level</h3>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Balance quality vs file size</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tighter">{compressionPercent}%</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={compressionPercent}
                        onChange={(e) => setCompressionPercent(parseInt(e.target.value))}
                        className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality</div>
                          <div className="text-sm font-bold text-slate-600 dark:text-slate-300">Highest</div>
                        </div>
                        <div className="text-center bg-rose-50 dark:bg-rose-900/20 px-6 py-3 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                          <div className={`text-base font-black ${getCompressionInfo(compressionPercent).color}`}>{getCompressionInfo(compressionPercent).title}</div>
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{getCompressionInfo(compressionPercent).desc}</div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">File Size</div>
                          <div className="text-sm font-bold text-slate-600 dark:text-slate-300">Smallest</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-full max-w-sm">
                      <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                        <FileText className="w-6 h-6 text-rose-500" />
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{files[0].name}</div>
                        <div className="text-xs text-slate-500 font-medium">{formatSize(files[0].size)}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleCompress}
                      disabled={isProcessing}
                      className="group relative bg-rose-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all hover:scale-105 active:scale-95 disabled:grayscale disabled:scale-100 flex items-center gap-4"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          {processingStatus || 'Compressing...'}
                        </>
                      ) : (
                        <>
                          Compress PDF
                          <Shrink className="w-6 h-6" />
                        </>
                      )}
                    </button>
                  </div>
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 text-center shadow-xl border border-slate-100 dark:border-slate-700"
          >
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200">
              <CheckCircle className="text-white w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">Compressed!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-lg">Your PDF has been successfully compressed.</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Before</div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{formatSize(originalSize)}</div>
              </div>
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">After</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatSize(compressedSize)}</div>
              </div>
              <div className="col-span-2 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">Total Savings: {savingPercentage}%</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href={resultUrl} 
                download="compressed.pdf"
                className="bg-rose-600 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" />
                Download PDF
              </a>
              <button 
                onClick={reset}
                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Compress Another
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
