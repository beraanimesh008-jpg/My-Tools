import { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import Dropzone from '@/src/components/Dropzone';
import { Image as ImageIcon, Download, Loader2, CheckCircle, ArrowLeft, FileText, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfToJpg() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setImages([]);
    setProgress(0);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const convertedImages: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        convertedImages.push(canvas.toDataURL('image/jpeg', 0.9));
        setProgress(Math.round((i / totalPages) * 100));
      }

      setImages(convertedImages);
    } catch (error) {
      console.error('PDF conversion error:', error);
      alert('Failed to convert PDF. The file might be corrupted or password protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setImages([]);
    setProgress(0);
  };

  const downloadAll = () => {
    images.forEach((img, i) => {
      const link = document.createElement('a');
      link.href = img;
      link.download = `page-${i + 1}.jpg`;
      link.click();
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200">
              <ImageIcon className="text-white w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">PDF to JPG</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Extract every page of your PDF as a high-quality JPG image.</p>
            </div>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="space-y-10">
            <Dropzone 
              label="Select PDF file"
              accept={{ 'application/pdf': ['.pdf'] }}
              files={files}
              onFilesAdded={(newFiles) => setFiles([newFiles[0]])}
              onRemoveFile={() => setFiles([])}
            />

            <AnimatePresence>
              {files.length === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-6"
                >
                  <button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="bg-rose-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all hover:scale-105 active:scale-95 disabled:grayscale disabled:scale-100 flex items-center gap-4"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Converting ({progress}%)...
                      </>
                    ) : (
                      <>
                        Start Conversion
                        <Layers className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex flex-wrap items-center justify-between gap-6 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Success! {images.length} pages converted.</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Preview and download your images below.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={downloadAll}
                  className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  <Download className="w-5 h-5" /> Download All
                </button>
                <button 
                  onClick={reset}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Convert New
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {images.map((img, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700"
                >
                  <img src={img} alt={`Page ${i + 1}`} className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a 
                      href={img} 
                      download={`page-${i + 1}.jpg`}
                      className="bg-white text-rose-600 p-4 rounded-2xl font-black flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform"
                    >
                      <Download className="w-6 h-6" />
                      Download Page {i + 1}
                    </a>
                  </div>
                  <div className="absolute top-4 left-4 bg-rose-600 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg">
                    PAGE {i + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
