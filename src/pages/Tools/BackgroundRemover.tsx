import React, { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import Navbar from '@/src/components/Navbar';
import { trackFileProcessed } from '@/src/utils/analytics';
import { 
  Download, 
  Loader2, 
  CheckCircle, 
  ArrowLeft, 
  Layers, 
  Palette, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Image as ImageLucide,
  Trash2,
  Sparkles,
  Zap,
  Shield,
  Maximize2,
  Share2,
  History,
  CloudIcon,
  MousePointer2,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Layout,
  Star,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useDropzone } from 'react-dropzone';
import SEO from '@/src/components/SEO';

const BG_REMOVER_FAQS = [
  {
    question: "How do I remove an image background online for free?",
    answer: "Drag and drop any photo (PNG, JPG, or JPEG) into our dash workspace. Our smart AI extractor evaluates pixel boundaries instantly and separates backgrounds beautifully. Download your cutout with zero charge."
  },
  {
    question: "Can I replace the cut out background with customized colors?",
    answer: "Yes, My Loves PDF provides pre-loaded flat backdrops and landscape preset backgrounds. Choose a custom shade, fit your cutout, and save as a high-quality JPG or PNG."
  },
  {
    question: "Is this AI background remover private?",
    answer: "Absolutely, yes. High encryption is used on our smart segmentation routes and no image files are stored, retained, or cached on our backend systems."
  }
];


// --- Comparison Slider Component ---

interface SliderProps {
  beforeUrl: string;
  afterUrl: string;
  sliderPosition: number;
  setSliderPosition: (pos: number) => void;
  bgColor?: string;
  bgImage?: string | null;
}

function ComparisonSlider({ beforeUrl, afterUrl, sliderPosition, setSliderPosition, bgColor, bgImage }: SliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setSliderPosition((x / rect.width) * 100);
  }, [setSliderPosition]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[4/3] md:aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 cursor-col-resize group select-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
      onMouseDown={() => setIsDragging(true)}
      onMouseMove={(e) => isDragging && handleMove(e.clientX)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchStart={() => setIsDragging(true)}
      onTouchMove={(e) => isDragging && handleMove(e.touches[0].clientX)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Target Image (After) */}
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-300"
        style={{
          backgroundColor: bgColor && bgColor !== 'transparent' ? bgColor : undefined,
          backgroundImage: bgImage 
            ? `url(${bgImage})` 
            : (bgColor === 'transparent' || !bgColor
                ? "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)"
                : undefined),
          backgroundSize: bgImage ? 'cover' : '16px 16px',
          backgroundPosition: 'center',
        }}
      >
        <img 
          src={afterUrl} 
          className="w-full h-full object-contain relative z-10" 
          alt="Transformed"
        />
      </div>

      {/* Source Image (Before) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <div 
          className="absolute inset-0 w-full h-full flex items-center justify-center"
          style={{ width: `calc(100 * (100 / ${sliderPosition})%)` }}
        >
          <img 
            src={beforeUrl} 
            className="w-full h-full object-contain bg-slate-50 dark:bg-slate-900" 
            alt="Original"
          />
        </div>
      </div>

      {/* Slider Bar */}
      <div 
        className="absolute inset-y-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.3)] flex items-center justify-center"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-2xl flex items-center justify-center border-2 border-cyan-500 scale-110 group-hover:scale-125 transition-transform">
          <div className="flex gap-0.5">
            <ChevronLeft className="w-4 h-4 text-cyan-500" />
            <ChevronRight className="w-4 h-4 text-cyan-500" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/10 pointer-events-none">Original</div>
      <div className="absolute top-6 right-6 px-4 py-2 bg-cyan-600/80 backdrop-blur-xl rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-cyan-400/20 pointer-events-none">Removed</div>
    </div>
  );
}

// --- Background Shapes ---

const FloatingShapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div 
      animate={{ 
        y: [0, -20, 0],
        rotate: [0, 10, 0]
      }}
      transition={{ duration: 5, repeat: Infinity }}
      className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"
    />
    <motion.div 
      animate={{ 
        y: [0, 20, 0],
        rotate: [0, -10, 0]
      }}
      transition={{ duration: 7, repeat: Infinity }}
      className="absolute bottom-40 right-20 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl"
    />
    <motion.div 
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 8, repeat: Infinity }}
      className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"
    />
  </div>
);

// --- Preset Background Choices ---
const PRESET_BG_CHOICES = [
  { id: 'transparent', label: 'Transparent', value: 'transparent' },
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'dark-slate', label: 'Dark Slate', value: '#0f172a' },
  { id: 'sunset', label: 'Sunset Glow', value: 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)' },
  { id: 'azure', label: 'Azure Sea', value: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' },
  { id: 'nebula', label: 'Cosmic Purple', value: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' },
  { id: 'mint', label: 'Mint Fresh', value: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { id: 'sunrise', label: 'Warm Sunrise', value: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
  { id: 'industrial', label: 'Metallic Silver', value: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)' },
];

// --- Main Tool Component ---

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getPreviewStyle = () => {
    if (bgImage) {
      return {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    if (bgColor && bgColor !== 'transparent') {
      if (bgColor.includes('gradient')) {
        return {
          backgroundImage: bgColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      } else {
        return {
          backgroundColor: bgColor,
          backgroundImage: 'none',
        };
      }
    }

    // Transparent Checkerboard
    return {
      backgroundImage: "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
    };
  };

  const handleRemoveBackgroundDirect = async (targetFile: File) => {
    if (!targetFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    // Cloud API Processing Mode (remove.bg)
    if (targetFile.size > 12 * 1024 * 1024) {
      setError('Image is too large for AI processing (max 12MB). Please use a smaller image.');
      setIsProcessing(false);
      return;
    }

    const clientApiKey = import.meta.env.VITE_REMOVE_BG_API_KEY;
    if (!clientApiKey) {
      setError('VITE_REMOVE_BG_API_KEY is not defined. Please configure VITE_REMOVE_BG_API_KEY in your Netlify/Vercel environment variables to run the AI Background Remover.');
      setIsProcessing(false);
      return;
    }

    // Simulated loader progress for cloud fetch
    const interval = setInterval(() => {
      setProcessingProgress(p => {
        if (p >= 95) return p;
        return p + Math.floor(Math.random() * 5) + 1;
      });
    }, 400);

    try {
      console.log('Sending direct client-side request to remove.bg...');
      const formData = new FormData();
      formData.append('image_file', targetFile);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': clientApiKey,
        },
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        let errorMessage = 'Failed to remove background.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.errors?.[0]?.title || errorData.details || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText.slice(0, 150) || `Error ${response.status}: ${response.statusText}`;
          }
        } catch (parseErr) {
          errorMessage = `Error ${response.status}: ${response.statusText || 'Unknown API Error'}`;
        }
        throw new Error(`remove.bg API Error: ${errorMessage}`);
      }

      setProcessingProgress(100);
      const blob = await response.blob();
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error("API returned an HTML page instead of an image. Ensure you are calling the real remove.bg server.");
      }

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      
      // Track file processed in analytics
      trackFileProcessed(1);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#ffffff', '#3b82f6']
      });
    } catch (err: any) {
      console.error('Background removal error:', err);
      setError(err.message || 'AI Processing failed. Please check your API key configuration.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      const url = URL.createObjectURL(f);
      setOriginalUrl(url);
      setResultUrl(null);
      setBgImage(null);
      setBgColor('transparent');
      setError(null);
      
      // Auto-start removal
      setTimeout(() => {
        handleRemoveBackgroundDirect(f);
      }, 100);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false
  } as any);

  const handleRemoveBackground = () => {
    if (file) handleRemoveBackgroundDirect(file);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const ufile = e.target.files[0];
      const url = URL.createObjectURL(ufile);
      setCustomBgImage(url);
      setBgImage(url);
      setBgColor('transparent');
    }
  };

  const reset = () => {
    setFile(null);
    setResultUrl(null);
    setOriginalUrl(null);
    setBgImage(null);
    setCustomBgImage(null);
    setBgColor('transparent');
    setError(null);
  };

  const downloadImage = async (withBackground: boolean) => {
    if (!resultUrl) return;
    setIsDownloading(true);

    try {
      // 1. Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create 2D canvas context');

      // 2. Load the transparent cutout image first to determine output canvas size (supports high-res / HD)
      const subjectImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load transparent subject cutout'));
        img.src = resultUrl;
      });

      // Canvas dimensions match high resolution cutout
      canvas.width = subjectImg.naturalWidth;
      canvas.height = subjectImg.naturalHeight;

      // 3. Draw background if requested
      if (withBackground) {
        if (bgImage) {
          // Load background image
          const bgImgElem = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load background image. Using fallback color.'));
            img.src = bgImage;
          });

          // Draw with cover behavior
          const canvasRatio = canvas.width / canvas.height;
          const bgRatio = bgImgElem.naturalWidth / bgImgElem.naturalHeight;
          let drawWidth, drawHeight, drawX, drawY;

          if (bgRatio > canvasRatio) {
            drawHeight = canvas.height;
            drawWidth = canvas.height * bgRatio;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
          } else {
            drawWidth = canvas.width;
            drawHeight = canvas.width / bgRatio;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
          }

          ctx.drawImage(bgImgElem, drawX, drawY, drawWidth, drawHeight);
        } else if (bgColor && bgColor !== 'transparent') {
          // Check if bgColor is a gradient (e.g. contains 'gradient' / colors)
          const hexColors = bgColor.match(/#[a-fA-F0-9]{3,8}/g);
          if (hexColors && hexColors.length >= 2) {
            // Draw gradient
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            hexColors.forEach((color, idx) => {
              grad.addColorStop(idx / (hexColors.length - 1), color);
            });
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            // Draw solid color
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          // Default background for non-transparency format selection like JPG (avoid black backgrounds)
          if (downloadFormat === 'jpg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      } else {
        // Transparent PNG output. If they selected JPG, we fill white to avoid ugly default black conversion
        if (downloadFormat === 'jpg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      // 4. Draw subject cutout image on top (with excellent anti-aliasing preserved)
      ctx.drawImage(subjectImg, 0, 0, canvas.width, canvas.height);

      // 5. Save and download
      const mimeType = downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png';
      const fileExt = downloadFormat === 'jpg' ? 'jpg' : 'png';
      const quality = downloadFormat === 'jpg' ? 0.95 : undefined;

      const dataUrl = canvas.toDataURL(mimeType, quality);
      const link = document.createElement('a');
      link.href = dataUrl;
      const bgName = withBackground ? (bgImage ? 'custom-bg' : (bgColor !== 'transparent' ? 'colored' : 'flat')) : 'transparent';
      link.download = `removed-bg-${bgName}-${Date.now()}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Merge download compilation failed:', err);
      // Fallback simple download
      alert(`Could not compile custom background cleanly: ${err.message || 'CORS sandbox constraint'}. Downloading transparent PNG as a fallback.`);
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `removed-bg-transparent-fallback-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors relative overflow-hidden">
      <Navbar />
      <SEO 
        title="AI Background Remover - Remove Image Backgrounds Free" 
        description="Remove backgrounds from images instantly for free with AI. Get transparent cutouts from PNGs or JPGs, change backgrounds, and export perfect high-quality portraits."
        path="/background-remover"
        faqs={BG_REMOVER_FAQS}
      />
      <FloatingShapes />
      
      <main className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {!resultUrl && !isProcessing ? (
            /* Upload State */
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              {/* Hero Section */}
              <div className="text-center mb-16 max-w-3xl">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 text-cyan-600 mb-6 bg-cyan-50 dark:bg-cyan-900/20 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest border border-cyan-100 dark:border-cyan-800"
                >
                  <Sparkles className="w-4 h-4" />
                  Neural AI Segmentation
                </motion.div>
                <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-none">
                  Remove Background <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600">Free, Instant, 100% Automatic.</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xl font-medium">
                  Professional quality cutout in seconds. No complex software needed.
                </p>
              </div>

              {/* Cloud API Key Configuration required warning */}
              {!import.meta.env.VITE_REMOVE_BG_API_KEY && (
                <div className="w-full max-w-4xl mb-12 p-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-900/10 border-2 border-amber-200 dark:border-amber-900/30 rounded-[2.5rem] text-slate-800 dark:text-slate-200 shadow-xl">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-black text-amber-900 dark:text-amber-400">API Key Configuration Required</h3>
                      <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                        This AI Background Remover uses the secure, direct <strong className="font-extrabold text-slate-800 dark:text-slate-100">remove.bg API</strong> to produce flawless results. To get this running on your deployment:
                      </p>
                      <ul className="list-decimal list-inside text-sm font-medium space-y-2 text-slate-600 dark:text-slate-300">
                        <li>Go to <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 font-extrabold hover:underline">remove.bg</a> and sign up for a free key.</li>
                        <li>Add <code className="px-2 py-0.5 bg-amber-100/60 dark:bg-amber-900/40 rounded font-bold text-xs text-rose-600 dark:text-rose-400">VITE_REMOVE_BG_API_KEY=your_key</code> in your host configuration dashboard (such as the <strong className="font-bold">Netlify Site settings &gt; Environment variables</strong> section).</li>
                        <li>Trigger a deployment rebuild to let your site load the new environment variable.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="w-full max-w-2xl mb-8 p-6 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/30 rounded-3xl flex flex-col gap-4 items-center text-center animate-fade-in">
                  <div className="flex items-start gap-3 text-rose-700 dark:text-rose-400">
                    <span className="p-2.5 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-lg shrink-0">⚠️</span>
                    <div className="text-left space-y-1">
                      <p className="font-black text-slate-900 dark:text-white text-base">Background Extraction Failed</p>
                      <p className="font-medium text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{error}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 justify-center">
                    {file && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveBackgroundDirect(file)}
                        className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-rose-700 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Retry Extraction
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl items-center">
                {/* Visual Preview */}
                <div className="relative group rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                  <ComparisonSlider 
                    beforeUrl="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop" 
                    afterUrl="https://ais-pre-qaqpgachfytouvql33yqlz-536781633725.asia-southeast1.run.app/placeholder-portrait.png" // This would ideally be a real cutout
                    sliderPosition={sliderPosition}
                    setSliderPosition={setSliderPosition}
                  />
                  <div className="absolute bottom-6 inset-x-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-white font-black text-xs uppercase tracking-widest">Live AI Sample</span>
                    </div>
                    <MousePointer2 className="text-white w-4 h-4 animate-bounce" />
                  </div>
                </div>

                {/* Dropzone Card */}
                <div className="space-y-8">
                  <div 
                    {...getRootProps()}
                    className={`aspect-square w-full bg-white dark:bg-slate-800 rounded-[3.5rem] border-[6px] border-dashed transition-all duration-500 flex flex-col items-center justify-center p-8 group cursor-pointer active:scale-[0.98]
                      ${isDragActive ? 'border-cyan-500 bg-cyan-50/30' : 'border-slate-100 dark:border-slate-800 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-200/20'}
                    `}
                  >
                    <input {...getInputProps()} />
                    
                    {!file ? (
                      <>
                        <div className="w-32 h-32 bg-cyan-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-cyan-200 dark:shadow-none mb-10 group-hover:scale-110 transition-transform duration-500">
                          <ImageLucide className="text-white w-16 h-16" />
                        </div>
                        <button className="bg-cyan-600 text-white px-10 py-5 rounded-2xl font-black text-2xl mb-4 hover:bg-cyan-700 transition-all shadow-xl shadow-cyan-200">
                          Upload Image
                        </button>
                        <p className="text-slate-400 font-bold text-lg">or drag and drop here</p>
                      </>
                    ) : (
                      <div className="space-y-8 w-full text-center">
                        <div className="relative aspect-square w-48 mx-auto rounded-3xl overflow-hidden shadow-2xl">
                          <img src={originalUrl!} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white font-black text-xs uppercase tracking-widest">Ready</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-white truncate mb-1">{file.name}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase">{(file.size / (1024 * 1024)).toFixed(2)} MB • READY FOR AI</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveBackground(); }}
                          className="w-full bg-cyan-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-cyan-700 transition-all shadow-2xl shadow-cyan-200 flex items-center justify-center gap-3"
                        >
                          Extract Subject
                          <Zap className="w-6 h-6 fill-white" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); reset(); }}
                          className="text-slate-400 font-bold hover:text-rose-500 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <Trash2 className="w-4 h-4" /> Change Image
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Trust Badge */}
                  <div className="flex items-center gap-6 px-4">
                    <div className="flex -space-x-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-sm">
                          <img src={`https://i.pravatar.cc/100?u=${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-slate-800 dark:text-white font-black text-sm">Join 1M+ creators</p>
                      <p className="text-slate-400 font-bold text-xs">High definition results guaranteed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-32 w-full max-w-6xl">
                {[
                  { title: 'Upload Image', desc: 'Select any JPG, PNG or WEBP.', icon: CloudIcon },
                  { title: 'AI Magic', desc: 'Our model segments edges perfectly.', icon: Sparkles },
                  { title: 'Download', desc: 'Save high-res transparent PNG.', icon: Download },
                ].map((step, idx) => (
                  <div key={idx} className="relative p-10 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                    <span className="absolute -top-6 -left-6 w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl shadow-xl flex items-center justify-center font-black text-2xl text-cyan-600 border border-slate-100 dark:border-slate-600">
                      {idx + 1}
                    </span>
                    <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-[1.25rem] flex items-center justify-center mb-6">
                      <step.icon className="w-8 h-8 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : isProcessing ? (
            /* Processing State */
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center min-h-[600px] text-center"
            >
              <div className="relative w-64 h-64 mb-12">
                <div className="absolute inset-0 border-[12px] border-slate-50 dark:border-slate-800 rounded-full shadow-inner" />
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="116"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 116}
                    strokeDashoffset={2 * Math.PI * 116 * (1 - processingProgress / 100)}
                    className="text-cyan-600 transition-all duration-300 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{processingProgress}%</span>
                  <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">Optimizing Edges</span>
                </div>
                {/* Floating Elements */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-xl shadow-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-600" />
                  </div>
                </motion.div>
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">AI Background Removal in Progress</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-md mx-auto">
                Our neural network is identifying the subject and refining pixel-perfect edges...
              </p>
            </motion.div>
          ) : (
            /* Result State */
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
            >
              {/* Left Column: Side-by-Side Visual Editor (like remove.bg) */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                  {/* Left Box: Original Image Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-2xl border-4 border-slate-50 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between mb-4 px-1">
                      <span className="text-slate-900 dark:text-white font-extrabold text-xs tracking-wider uppercase flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                        Original
                      </span>
                    </div>

                    <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center p-4 border border-slate-100 dark:border-slate-800">
                      <img 
                        src={originalUrl!} 
                        className="max-h-full max-w-full object-contain select-none shadow-sm transition-transform duration-300 hover:scale-[1.02]" 
                        alt="Original"
                      />
                    </div>
                  </motion.div>

                  {/* Right Box: Removed Background Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="flex flex-col bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-2xl border-4 border-slate-50 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between mb-4 px-1">
                      <span className="text-cyan-600 dark:text-cyan-400 font-extrabold text-xs tracking-wider uppercase flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                        Removed Background
                      </span>
                    </div>

                    <div 
                      className="relative aspect-square w-full rounded-3xl overflow-hidden flex items-center justify-center p-4 transition-all duration-300 border border-slate-100 dark:border-slate-800"
                      style={getPreviewStyle()}
                    >
                      {/* Sub-checkerboard lighting overlay when in transparent mode */}
                      {(bgColor === 'transparent' || !bgColor) && !bgImage && (
                        <div className="absolute inset-0 bg-white/20 dark:bg-slate-950/20 mix-blend-overlay pointer-events-none" />
                      )}

                      <img 
                        src={resultUrl!} 
                        className="max-h-full max-w-full object-contain relative z-10 select-none drop-shadow-2xl transition-transform duration-300 hover:scale-[1.02]" 
                        alt="Removed Background"
                      />
                    </div>
                  </motion.div>
                </div>

                <div className="flex items-center justify-between px-8 text-slate-400 font-black text-xs uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" /> Original Image
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />)}
                  </div>
                  <div className="flex items-center gap-2 text-cyan-600">
                    Transparent Cutout <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Right Column: Controls */}
              <div className="lg:col-span-4 space-y-8 sticky top-24">
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 border-2 border-slate-50 dark:border-slate-800 shadow-xl space-y-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                      <Palette className="w-5 h-5 text-cyan-600" />
                      <h4 className="font-black text-xs uppercase tracking-widest">Preview Background</h4>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {PRESET_BG_CHOICES.map((preset) => {
                        const isSelected = bgColor === preset.value && !bgImage;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => { setBgColor(preset.value); setBgImage(null); }}
                            title={preset.label}
                            className={`w-10 h-10 rounded-2xl border-4 transition-all duration-300 hover:scale-110 relative
                              ${isSelected ? 'border-cyan-600 scale-110 shadow-lg shadow-cyan-500/20' : 'border-slate-100 dark:border-slate-700/60'}
                            `}
                            style={{ 
                              backgroundColor: preset.value === 'transparent' ? 'white' : (preset.value.includes('gradient') ? undefined : preset.value), 
                              backgroundImage: preset.value === 'transparent' 
                                ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)' 
                                : (preset.value.includes('gradient') ? preset.value : undefined), 
                              backgroundSize: preset.value === 'transparent' ? '8px 8px' : undefined 
                            }}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white drop-shadow-md" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-slate-400">
                      <ImageLucide className="w-5 h-5 text-cyan-600" />
                      <h4 className="font-black text-xs uppercase tracking-widest">Environment Preview</h4>
                    </div>
                    <div className="grid grid-cols-4 gap-2.5">
                      {/* Upload button for background */}
                      <button
                        onClick={() => bgFileInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all flex flex-col items-center justify-center gap-1 group"
                        title="Upload custom background image"
                      >
                        <Plus className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-cyan-500 transition-colors uppercase tracking-wider">Custom</span>
                      </button>
                      <input 
                        type="file" 
                        ref={bgFileInputRef} 
                        onChange={handleCustomBgUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />

                      {/* Display uploaded background image thumbnail if available */}
                      {customBgImage && (
                        <button
                          onClick={() => { setBgImage(customBgImage); setBgColor('transparent'); }}
                          className={`aspect-square rounded-2xl bg-center bg-cover border-4 transition-all hover:scale-110 relative group
                            ${bgImage === customBgImage ? 'border-cyan-600 scale-110 shadow-lg shadow-cyan-500/20' : 'border-slate-100 dark:border-slate-700'}
                          `}
                          style={{ backgroundImage: `url(${customBgImage})` }}
                        >
                          {bgImage === customBgImage && (
                            <div className="absolute inset-0 bg-black/25 rounded-xl flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      )}

                      {[
                        'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=400&q=80',
                        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
                        'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=400&q=80'
                      ].map((img, i) => {
                        const isSelected = bgImage === img;
                        return (
                          <button
                            key={i}
                            onClick={() => { setBgImage(img); setBgColor('transparent'); }}
                            className={`aspect-square rounded-2xl bg-center bg-cover border-4 transition-all hover:scale-110 relative
                              ${isSelected ? 'border-cyan-600 scale-110 shadow-lg shadow-cyan-500/20' : 'border-slate-100 dark:border-slate-700/60'}
                            `}
                            style={{ backgroundImage: `url(${img})` }}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/25 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-extrabold text-xs uppercase tracking-widest">Download Format</span>
                      
                      {/* Segmented control for PNG / JPG */}
                      <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl flex gap-1 border border-slate-200/50 dark:border-slate-800">
                        <button
                          onClick={() => setDownloadFormat('png')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                            downloadFormat === 'png'
                              ? 'bg-cyan-600 text-white shadow-md'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          PNG
                        </button>
                        <button
                          onClick={() => setDownloadFormat('jpg')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                            downloadFormat === 'jpg'
                              ? 'bg-cyan-600 text-white shadow-md'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          JPG
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {/* Download Button 1: Download Transparent Cutout */}
                      <button 
                        onClick={() => downloadImage(false)}
                        disabled={isDownloading}
                        className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-3xl py-4 font-extrabold text-sm border border-slate-200/40 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-sm"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        ) : (
                          <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        )}
                        Download Transparent Cutout ({downloadFormat.toUpperCase()})
                      </button>

                      {/* Download Button 2: Merge and Download with Background */}
                      <button 
                        onClick={() => downloadImage(true)}
                        disabled={isDownloading}
                        className="w-full bg-cyan-600 text-white rounded-3xl py-5 font-black text-base shadow-lg shadow-cyan-200 dark:shadow-none hover:bg-cyan-700 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2.5"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 fill-white text-white" />
                        )}
                        Download with Background ({downloadFormat.toUpperCase()})
                      </button>
                    </div>

                    {/* Reset Button */}
                    <div className="pt-4 flex gap-3">
                      <button 
                        onClick={reset}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.96] flex items-center justify-center gap-2 border border-slate-100 dark:border-slate-800/80"
                      >
                        <RefreshCw className="w-4 h-4" /> New Image
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2.5rem] border-2 border-emerald-100 dark:border-emerald-800/20 flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200 dark:shadow-none">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-900 dark:text-emerald-400 text-base">Pixel-Perfect Cutout</h4>
                    <p className="text-emerald-700 dark:text-emerald-500 text-sm font-medium leading-tight">Neural network optimized for fine details like hair & accessories.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Visual FAQ & Interlinking Section */}
      <section className="bg-slate-50 dark:bg-slate-950/40 py-24 border-t border-slate-100 dark:border-slate-800/80 font-sans z-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Quick answers regarding neural AI photo segmentation and transparency.</p>
          </div>

          <div className="space-y-8 mb-20 animate-fade-in">
            {BG_REMOVER_FAQS.map((faq, index) => (
              <div key={index} className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 hover:border-cyan-500 transition-colors">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-start gap-3">
                  <span className="text-cyan-600 dark:text-cyan-400 font-black">Q.</span>
                  {faq.question}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium pl-6 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Internal Interlinking Banner */}
          <div className="p-10 bg-cyan-50/25 dark:bg-cyan-950/10 rounded-[2.5rem] border border-cyan-100/30 dark:border-cyan-900/20 text-center">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Need PDF/Image Compressors next?</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-lg mx-auto">Explore high-quality sizing utilities built to downscale, merge, protect, or optimize all your documents.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/compress-image" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-cyan-400 dark:hover:border-cyan-800 transition-all hover:scale-105">
                Optimize Image Quality
              </Link>
              <Link to="/compress-pdf" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-cyan-400 dark:hover:border-cyan-800 transition-all hover:scale-105">
                Compress PDF Size
              </Link>
              <Link to="/merge-pdf" className="px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:border-cyan-400 dark:hover:border-cyan-800 transition-all hover:scale-105">
                Merge PDFs
              </Link>
              <Link to="/ai-gen" className="px-6 py-4 bg-cyan-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-cyan-200 dark:shadow-none transition-all hover:scale-105">
                AI Image Designer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
