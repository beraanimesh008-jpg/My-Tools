import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Download, RotateCcw, Star, Percent, Sparkles, ShieldCheck } from 'lucide-react';

interface CompressPdfResultProps {
  fileName: string;
  resultUrl: string;
  originalSize: number;
  compressedSize: number;
  reset: () => void;
}

export default function CompressPdfResult({
  fileName,
  resultUrl,
  originalSize,
  compressedSize,
  reset
}: CompressPdfResultProps) {
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const spaceSaved = originalSize - compressedSize;
  const savingPercentage = originalSize > 0 
    ? Math.max(5, Math.round((spaceSaved / originalSize) * 100))
    : 0;

  const triggerBookmarkHelp = () => {
    setShowBookmarkToast(true);
    setTimeout(() => setShowBookmarkToast(false), 5000);
  };

  // Safe sharing link helper
  const triggerShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Smart PDF Compressor',
        text: 'Shrink PDF files cleanly client-side!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      triggerBookmarkHelp();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto bg-white border border-slate-150 rounded-[2.5rem] p-8 md:p-12 shadow-[0_12px_45px_rgba(0,0,0,0.02)] space-y-8"
      id="compress-result"
    >
      {/* Header State */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle className="text-emerald-500 w-8 h-8" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Completed Client-Side
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {originalSize === compressedSize ? "Optimization Complete!" : "PDF Compressed Successfully!"}
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Your document has been processed and and is ready for download. No data leaves your memory sandbox.
          </p>
        </div>
      </div>

      {originalSize === compressedSize && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center text-sm font-bold text-rose-700 max-w-2xl mx-auto">
          No further image compression was needed to optimize this PDF structure.
        </div>
      )}

      {/* Visual Comparative Scale Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100 shadow-inner">
        {/* Left Col: Saving Percent Radial Gauge */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-150/40 shadow-sm">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Progress Circle Background */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="#f1f5f9"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="#e11d48"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="339"
                strokeDashoffset={339 - (339 * savingPercentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-rose-600 tracking-tight font-sans">
                {savingPercentage}%
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Shaved
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-semibold mt-3 text-center">
            {formatSize(spaceSaved)} weight reduction
          </p>
        </div>

        {/* Right Col: Comparative Dual Horizontal Bars */}
        <div className="md:col-span-8 space-y-6">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest block">
            Payload Weight Comparison
          </h4>
          
          <div className="space-y-4">
            {/* Original Bar Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span className="truncate max-w-[200px]" title={fileName}>Original ({fileName})</span>
                <span>{formatSize(originalSize)}</span>
              </div>
              <div className="w-full h-6 bg-slate-200/60 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="h-full bg-slate-400 rounded-full flex items-center pl-3 text-[10px] font-black text-white uppercase tracking-wider"
                  style={{ width: '100%' }}
                >
                  100% Weight
                </div>
              </div>
            </div>

            {/* Compressed Bar Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-rose-600">
                <span>Optimized PDF</span>
                <span className="font-extrabold">{formatSize(compressedSize)}</span>
              </div>
              <div className="w-full h-6 bg-slate-200/60 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full flex items-center pl-3 text-[10px] font-black text-white uppercase tracking-wider transition-all duration-1000"
                  style={{ width: `${Math.max(15, 100 - savingPercentage)}%` }}
                >
                  {100 - savingPercentage}% Left
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Stats Bento Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Source Size</span>
          <span className="text-lg font-black text-slate-800">{formatSize(originalSize)}</span>
        </div>
        <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Target Size</span>
          <span className="text-lg font-black text-rose-600">{formatSize(compressedSize)}</span>
        </div>
        <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">Saved space</span>
          <span className="text-lg font-black text-emerald-600">{formatSize(spaceSaved)}</span>
        </div>
        <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-1">Ratio</span>
          <span className="text-lg font-black text-indigo-600">{originalSize > 0 ? (compressedSize / originalSize).toFixed(2) : 1}x</span>
        </div>
      </div>

      {/* Large Premium Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
        <a 
          href={resultUrl} 
          download={`compressed_${fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`}`}
          className="w-full sm:w-auto px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-200 dark:shadow-none hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          id="download-result-link"
        >
          <Download className="w-5.5 h-5.5" />
          Download Compressed PDF
        </a>
        <button 
          onClick={reset}
          className="w-full sm:w-auto px-8 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-base transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-4.5 h-4.5" />
          Compress Another File
        </button>
      </div>

      {/* User Retention Bookmarking Widget */}
      <div className="relative p-6 bg-rose-50/20 border border-rose-100/40 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-rose-500 fill-rose-500" />
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm">Addicted to rapid PDF compression?</h5>
            <p className="text-slate-500 text-xs">Bookmark this helper to shrink your paperwork in one single local click.</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            type="button"
            onClick={triggerShare}
            className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 transition-all shadow-sm active:scale-95 flex items-center gap-1"
          >
            <Percent className="w-3.5 h-3.5 text-rose-500" />
            Bookmark This Tool
          </button>

          <AnimatePresence>
            {showBookmarkToast && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 bottom-full mb-3 z-30 w-64 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl text-center font-semibold border border-slate-800"
              >
                Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-rose-450 font-mono font-bold">Ctrl + D</kbd> (or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-rose-450 font-mono font-bold">⌘ + D</kbd>) now to add this to your favorites!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
