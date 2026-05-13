import { useState, useRef, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
import Dropzone from '@/src/components/Dropzone';
import { ImageIcon, Download, Loader2, CheckCircle, ArrowLeft, Layers, Palette, RefreshCw, ZoomIn, ZoomOut, Image as ImageLucide } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { removeBackground } from '@imgly/background-removal';

export default function BackgroundRemover() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setOriginalUrl(url);
      setResultUrl(null);
      setBgImage(null);
      setBgColor('transparent');
    }
  }, [files]);

  const handleRemoveBackground = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const blob = await removeBackground(files[0], {
        progress: (status, progress) => {
          console.log(status, progress);
          setProcessingProgress(Math.round(progress * 100));
        },
        model: 'isnet_fp16', // High quality, optimized for browser
        output: {
          format: 'image/png',
          quality: 0.8,
        }
      });

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#ffffff']
      });
    } catch (error) {
      console.error(error);
      alert('Failed to remove background. Please try another image.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const reset = () => {
    setFiles([]);
    setResultUrl(null);
    setOriginalUrl(null);
    setBgImage(null);
    setBgColor('transparent');
  };

  const handleMove = (e: any) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) / rect.width * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors" onMouseMove={handleMove} onMouseUp={() => setIsResizing(false)} onTouchMove={handleMove} onTouchEnd={() => setIsResizing(false)}>
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-bold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-cyan-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-cyan-200 dark:shadow-none">
              <Layers className="text-white w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">AI Background Remover</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Remove image backgrounds automatically with professional precision using AI.</p>
            </div>
          </div>
        </div>

        {!resultUrl && !isProcessing ? (
          <div className="space-y-10">
            <Dropzone 
              label="Upload Image to Remove Background"
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
              files={files}
              onFilesAdded={(newFiles) => setFiles(newFiles.slice(0, 1))}
              onRemoveFile={() => setFiles([])}
              maxFiles={1}
            />

            {files.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleRemoveBackground}
                  className="group relative bg-cyan-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-cyan-200 dark:shadow-none hover:bg-cyan-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
                >
                  Remove Background
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-180 transition-transform">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                </button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                { title: 'AI Powered', desc: 'Advanced segmentation for perfect edges.', icon: ZoomIn },
                { title: 'High Definition', desc: 'Preserves the original quality and detail.', icon: CheckCircle },
                { title: 'Transparent PNG', desc: 'Ready for professional graphic design.', icon: ImageIcon },
              ].map((feature, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-cyan-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {isProcessing ? (
              <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-20 text-center shadow-xl border border-slate-100 dark:border-slate-700 max-w-2xl mx-auto">
                <div className="relative w-32 h-32 mx-auto mb-10">
                  <div className="absolute inset-0 border-8 border-cyan-100 dark:border-slate-700 rounded-full" />
                  <motion.div 
                    className="absolute inset-0 border-8 border-cyan-500 rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-cyan-600">{processingProgress}%</span>
                  </div>
                </div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Removing Background...</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">Identifying edges & refining mask</p>
                
                <div className="mt-12 space-y-3">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-cyan-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${processingProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Analyzing Image</span>
                    <span>HD Edge Refinement</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Result Section */}
                <div className="lg:col-span-8 space-y-6">
                  <div 
                    ref={containerRef}
                    className="group relative aspect-square md:aspect-video bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-700 cursor-col-resize select-none"
                    onMouseDown={() => setIsResizing(true)}
                    onTouchStart={() => setIsResizing(true)}
                  >
                    {/* Background Layer */}
                    <div 
                      className="absolute inset-0 w-full h-full bg-center bg-cover transition-colors"
                      style={{ 
                        backgroundColor: bgColor,
                        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                        backgroundSize: 'cover'
                      }}
                    />

                    {/* Result Layer (Masked) */}
                    <div className="absolute inset-0 w-full h-full">
                      <img 
                        src={resultUrl || ''} 
                        className="w-full h-full object-contain" 
                        alt="Result"
                      />
                    </div>

                    {/* Before Layer (Original) */}
                    <div 
                      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img 
                        src={originalUrl || ''} 
                        className="absolute inset-0 w-full h-full object-contain bg-slate-100" 
                        style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
                        alt="Original"
                      />
                    </div>

                    {/* Slider Line */}
                    <div 
                      className="absolute inset-y-0 w-1 bg-white shadow-xl pointer-events-none flex items-center justify-center"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-xl flex items-center justify-center gap-1 group-hover:scale-110 transition-transform">
                        <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                        <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-6 left-6 px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest pointer-events-none">Original</div>
                    <div className="absolute top-6 right-6 px-4 py-2 bg-cyan-600 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest pointer-events-none">Result</div>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <ZoomIn className="w-4 h-4" /> Move the slider to compare original vs result <ZoomOut className="w-4 h-4" />
                  </div>
                </div>

                {/* Sidebar Section */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Background Color
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {['transparent', '#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setBgColor(color);
                              setBgImage(null);
                            }}
                            className={`w-10 h-10 rounded-xl border-2 transition-transform hover:scale-110 ${bgColor === color ? 'border-cyan-500 scale-110 shadow-lg shadow-cyan-100' : 'border-slate-100 dark:border-slate-600'}`}
                            style={{ backgroundColor: color === 'transparent' ? 'white' : color, backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none', backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px' }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageLucide className="w-4 h-4" /> Background Image
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
                          'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=400&q=80',
                          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80'
                        ].map((img, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setBgImage(img);
                              setBgColor('transparent');
                            }}
                            className={`aspect-square rounded-xl bg-center bg-cover border-2 transition-transform hover:scale-110 ${bgImage === img ? 'border-cyan-500 scale-110 shadow-lg shadow-cyan-100' : 'border-slate-100 dark:border-slate-600'}`}
                            style={{ backgroundImage: `url(${img})` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 space-y-4 border-t border-slate-100 dark:border-slate-700">
                      <a 
                        href={resultUrl || ''} 
                        download="background-removed.png"
                        className="w-full bg-cyan-600 text-white px-8 py-5 rounded-2xl font-black text-lg hover:bg-cyan-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-cyan-100 dark:shadow-none"
                      >
                        <Download className="w-6 h-6" />
                        Download PNG
                      </a>
                      <button 
                        onClick={reset}
                        className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-8 py-5 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                      >
                        Upload Another
                      </button>
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-sm">Perfect Cutout</h4>
                      <p className="text-emerald-700 dark:text-emerald-500 text-xs font-medium">Edges refined automatically with AI Alpha Matting.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
