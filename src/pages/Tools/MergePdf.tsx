import { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import Dropzone from '@/src/components/Dropzone';
import { Layers, Download, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleMerge = async () => {
    if (files.length < 2) return;
    
    setIsProcessing(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const response = await fetch('/api/tools/pdf/merge', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Merge failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#fb7185', '#ffffff']
      });
    } catch (error) {
      console.error(error);
      alert('Failed to merge PDFs');
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
            <div className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200">
              <Layers className="text-white w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Merge PDF</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Combine PDF files in the order you want with the easiest PDF merger available.</p>
            </div>
          </div>
        </div>

        {!resultUrl ? (
          <div className="space-y-10">
            <Dropzone 
              label="Select PDF files"
              accept={{ 'application/pdf': ['.pdf'] }}
              files={files}
              onFilesAdded={(newFiles) => setFiles([...files, ...newFiles])}
              onRemoveFile={(idx) => setFiles(files.filter((_, i) => i !== idx))}
            />

            <AnimatePresence>
              {files.length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={handleMerge}
                    disabled={isProcessing}
                    className="group relative bg-rose-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all hover:scale-105 active:scale-95 disabled:grayscale disabled:scale-100 flex items-center gap-4"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Merging PDFs...
                      </>
                    ) : (
                      <>
                        Merge PDF
                        <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                          <Layers className="w-4 h-4" />
                        </div>
                      </>
                    )}
                  </button>
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
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4">PDFs Merged Successfully!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium text-lg">Your combined PDF is ready to be downloaded.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href={resultUrl} 
                download="merged.pdf"
                className="bg-rose-600 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" />
                Download PDF
              </a>
              <button 
                onClick={reset}
                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Merge More
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
