import { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import Dropzone from '@/src/components/Dropzone';
import { ImageIcon, Download, Loader2, CheckCircle, ArrowLeft, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function CompressImage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(60);

  const handleCompress = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('quality', quality.toString());

    try {
      const response = await fetch('/api/tools/image/compress', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Compression failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#ffffff']
      });
    } catch (error) {
      console.error(error);
      alert('Failed to compress image');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResultUrl(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-200">
              <ImageIcon className="text-white w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Compress Image</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Reduce image file size with the perfect balance between quality and file size.</p>
            </div>
          </div>
        </div>

        {!resultUrl ? (
          <div className="space-y-10">
            <Dropzone 
              label="Select an Image"
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
              files={files}
              onFilesAdded={(newFiles) => setFiles(newFiles.slice(0, 1))}
              onRemoveFile={() => setFiles([])}
              maxFiles={1}
            />

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-8"
                >
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-orange-500" /> Compression Settings
                      </h3>
                      <span className="text-sm font-black bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full uppercase tracking-tight">Quality: {quality}%</span>
                    </div>
                    
                    <div className="space-y-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                        <span>High Compression</span>
                        <span>High Quality</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleCompress}
                      disabled={isProcessing}
                      className="group relative bg-orange-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-orange-200 dark:shadow-none hover:bg-orange-700 transition-all hover:scale-105 active:scale-95 disabled:grayscale disabled:scale-100 flex items-center gap-4"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Compressing...
                        </>
                      ) : (
                        <>
                          Compress Image
                          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ImageIcon className="w-4 h-4" />
                          </div>
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
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4">Image Compressed!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium text-lg">Your optimized image is ready to be downloaded.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href={resultUrl} 
                download="compressed-image.jpg"
                className="bg-orange-600 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" />
                Download Image
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
