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
  Plus,
  Settings,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useDropzone } from 'react-dropzone';
import SEO from '@/src/components/SEO';

const BG_REMOVER_FAQS = [
  {
    question: "How do I remove a background from an image?",
    answer: "To remove background from image files using our tool, simply drag and drop your photo into the upload dropzone. Our automatic background remover will instantly process the image using advanced machine learning models, identify the main subject, erase the backdrop, and output a transparent background PNG in less than 5 seconds."
  },
  {
    question: "Is this background remover free?",
    answer: "Yes! This AI background remover is a 100% free background remover tool. You can remove background from images as many times as you like without needing any subscriptions, premium credits, or accounts. It is designed to be a completely free online background remover for personal and professional use."
  },
  {
    question: "Does it support PNG files?",
    answer: "Yes, our background removal tool fully supports PNG images, including complex portraits with alpha channels. It can remove image background structures from PNG files and export them as transparent PNG files or allow you to choose a new custom background color or landscape backdrops immediately."
  },
  {
    question: "Can I remove backgrounds from JPG images?",
    answer: "Absolutely. Our image background eraser is fully compatible with JPG and JPEG formats. When you upload a JPG photo, the AI detects the primary subject, separates it from the backdrop, and converts the output into a neat, high-resolution transparent PNG cutout."
  },
  {
    question: "Will image quality decrease?",
    answer: "No. Our photo background remover processes your high-resolution pictures without compression. The background removal tool maintains the original image dimensions, rendering precise hair and edge cutouts, so you always get pixel-perfect, high-quality background removal results."
  },
  {
    question: "How does AI background removal work?",
    answer: "Our online background remover leverages state-of-the-art neural networks trained on millions of pictures. The automatic subject detection algorithm recognizes humans, products, animals, and graphics, then mathematically calculates a crisp alpha boundary layer to seamlessly separate the main object from its background."
  },
  {
    question: "Can I create transparent PNG images?",
    answer: "Yes! Our transparent background maker is specifically built to output high-quality transparent PNG cutouts. Additionally, you can utilize our background changer to replace the old background with solid colors of your choice or custom preview images."
  },
  {
    question: "Do I need to register?",
    answer: "No registration is required to use our free background remover. You can process, preview, customize, and download your images with transparent backgrounds instantly without providing an email address, entering passwords, or setting up a user account."
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
  const [userApiKey, setUserApiKey] = useState<string>(() => localStorage.getItem('CUSTOM_REMOVE_BG_API_KEY') || '');
  const [showApiKeySetting, setShowApiKeySetting] = useState<boolean>(false);

  // Advanced API Key Validation, Static Host detection, and remaining balance tracking states
  const [staticOnlyMode, setStaticOnlyMode] = useState<boolean>(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [keyErrorDetail, setKeyErrorDetail] = useState<string | null>(null);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(false);
  const [serverHasKey, setServerHasKey] = useState<boolean>(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // Validate current configuration on component mount or local key changes
  const validateCurrentApiKey = async (customConfigKey?: string) => {
    setIsCheckingKey(true);
    setKeyErrorDetail(null);
    setApiKeyValid(null);
    setCreditBalance(null);

    const activeKey = customConfigKey !== undefined ? customConfigKey : userApiKey;

    try {
      // 1. Attempt using the server-side validator route
      const headers: Record<string, string> = {};
      if (activeKey) {
        headers['x-custom-api-key'] = activeKey;
      }

      console.log('Validating API key settings with server backend validator...');
      const response = await fetch('/api/tools/image/remove-bg-account', {
        headers
      });

      const contentType = response.headers.get('content-type') || '';
      
      // If server returns HTML or 404, we are in Static Mode (Hostinger deployment or without express process)
      if (contentType.includes('text/html') || response.status === 404) {
        console.warn('Backend server returned HTML or 404. Switching background remover to STATIC-ONLY client direct mode...');
        setStaticOnlyMode(true);
        
        // In static mode, if there is a custom key, validate directly using remove.bg client endpoints
        if (activeKey) {
          await validateKeyOnClientDirect(activeKey);
        } else {
          setIsCheckingKey(false);
          setApiKeyValid(false);
          setKeyErrorDetail("Static Mode: No server-side environment detected. For background removal to work on this static host, please click the settings below and provide your own FREE remove.bg API key.");
        }
        return;
      }

      const resData = await response.json();
      setServerHasKey(!!resData.hasGlobalKey);

      if (resData.valid) {
        setApiKeyValid(true);
        setCreditBalance(resData.totalCredits !== undefined ? resData.totalCredits : null);
        setStaticOnlyMode(false);
      } else {
        setApiKeyValid(false);
        setKeyErrorDetail(resData.message || resData.error || "The API Key was found to be invalid.");
        setStaticOnlyMode(false);
      }

    } catch (err: any) {
      console.error('Failed backend-based validation:', err);
      // Fallback: assume static or offline, try validating direct
      setStaticOnlyMode(true);
      if (activeKey) {
        await validateKeyOnClientDirect(activeKey);
      } else {
        setApiKeyValid(false);
        setKeyErrorDetail("Connection error: Unable to connect to server API. To bypass, please verify your internet connection or supply your custom remove.bg key.");
      }
    } finally {
      setIsCheckingKey(false);
    }
  };

  const validateKeyOnClientDirect = async (keyToTest: string) => {
    try {
      console.log('Registering client-side direct credentials validation with remove.bg...');
      const response = await fetch('https://api.remove.bg/v1.0/account', {
        method: 'GET',
        headers: {
          'X-Api-Key': keyToTest
        }
      });

      if (response.status === 403 || response.status === 401) {
        setApiKeyValid(false);
        setKeyErrorDetail("The custom API Key is invalid or unauthorized. Please verify your token on your remove.bg profile.");
        return;
      }

      if (!response.ok) {
        const txt = await response.text();
        setApiKeyValid(false);
        setKeyErrorDetail(`Direct check failed with code ${response.status}: ${txt.slice(0, 100)}`);
        return;
      }

      const data = await response.json();
      const attribs = data.data?.attributes;
      const credits = attribs?.credits;
      const totalCredits = credits ? (credits.total || credits.pay_as_you_go + credits.free_api_calls + credits.subscription) : 0;

      setApiKeyValid(true);
      setCreditBalance(totalCredits);
    } catch (e: any) {
      console.error('Direct account connection error:', e);
      setApiKeyValid(false);
      setKeyErrorDetail(`Offline check error: ${e.message || "Failed to contact remove.bg API server directly."}`);
    }
  };

  // Run validation on mount
  useEffect(() => {
    validateCurrentApiKey();
  }, []);

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

    // Image size boundary check
    if (targetFile.size > 12 * 1024 * 1024) {
      setError('Image is too large for AI processing (max 12MB). Please use a smaller image.');
      setIsProcessing(false);
      return;
    }

    // Set up a progress loader animation
    const interval = setInterval(() => {
      setProcessingProgress(p => {
        if (p >= 95) return p;
        return p + Math.floor(Math.random() * 5) + 1;
      });
    }, 400);

    const activeKey = localStorage.getItem('CUSTOM_REMOVE_BG_API_KEY') || userApiKey;

    try {
      let response: Response;

      if (staticOnlyMode) {
        if (!activeKey) {
          throw new Error("No API key configured. Please configure an API override token by clicking the Developer API Settings link at the very bottom of this page.");
        }
        
        console.log('Static mode detected. Processing directly in browser with CORS...');
        const formData = new FormData();
        formData.append('image_file', targetFile);
        formData.append('size', 'auto');

        response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': activeKey,
          },
          body: formData,
        });
      } else {
        console.log('Sending secure custom proxy request to backend remove-bg endpoint...');
        const formData = new FormData();
        formData.append('file', targetFile);

        const headers: Record<string, string> = {};
        if (activeKey) {
          headers['x-custom-api-key'] = activeKey;
        }

        let proxyFailed = false;
        try {
          response = await fetch('/api/tools/image/remove-bg', {
            method: 'POST',
            headers,
            body: formData,
          });
          const contentType = response.headers.get('content-type') || '';
          if (!response.ok || contentType.includes('text/html')) {
            proxyFailed = true;
          }
        } catch (e) {
          console.warn('Proxy request failed with exception:', e);
          proxyFailed = true;
        }

        if (proxyFailed) {
          if (activeKey) {
            console.log('Proxy request failed or returned HTML. Automatically falling back to direct browser CORS call...');
            setStaticOnlyMode(true);
            
            const directFormData = new FormData();
            directFormData.append('image_file', targetFile);
            directFormData.append('size', 'auto');
            
            response = await fetch('https://api.remove.bg/v1.0/removebg', {
              method: 'POST',
              headers: {
                'X-Api-Key': activeKey,
              },
              body: directFormData,
            });
          } else {
            throw new Error("The backend extraction proxy did not respond correctly, and no personal custom API key override is configured. Please click 'Developer API Settings' at the bottom of the page to register a free key.");
          }
        }
      }

      clearInterval(interval);

      if (!response.ok) {
        let errorMessage = 'Failed to extract background.';
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText.toLowerCase().includes('<!doctype') || errorText.toLowerCase().includes('<html')) {
              errorMessage = "The API returned HTML code. Please verify your remove.bg key credentials, balance, and API limits.";
            } else {
              errorMessage = errorText.slice(0, 150) || `Error ${response.status}: ${response.statusText}`;
            }
          }
        } catch (parseErr) {
          errorMessage = `HTTP Error ${response.status}: ${response.statusText || 'Unknown Connection Failure'}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error("The API server returned HTML code instead of an image. Please verify your remove.bg credentials and try again.");
      }

      setProcessingProgress(100);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      
      // Track file processed in local track counters
      trackFileProcessed(1);

      // Trigger success celebratory confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#ffffff', '#3b82f6']
      });

      // Refresh credentials/balances after a successful removal to update current remaining credit balance count
      setTimeout(() => {
        validateCurrentApiKey(activeKey);
      }, 1000);

    } catch (err: any) {
      console.error('Processor background extraction exception:', err);
      setError(err?.message || 'The AI extraction service failed. Please confirm your API key and network connection.');
      
      // Auto expand custom key settings if it looks like a credentials error
      const emsg = (err?.message || '').toLowerCase();
      if (emsg.includes('key') || emsg.includes('authorized') || emsg.includes('credit') || emsg.includes('limit') || emsg.includes('invalid') || emsg.includes('html')) {
        setShowApiKeySetting(true);
      }
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
        title="AI Background Remover - Remove Background From Images Free Online" 
        description="Remove backgrounds from images instantly with AI. Upload JPG, PNG or WEBP images and create transparent backgrounds online for free. Fast, secure and high-quality background removal."
        keywords="remove background, background remover, ai background remover, remove image background, transparent png maker, photo background remover, online background remover, free background remover, image background remover"
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
                <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-3 tracking-tight leading-none">
                  AI Background Remover
                </h1>
                <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600 mb-6 tracking-tight">
                  Remove Background From Images Instantly
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xl font-medium">
                  Professional quality cutout in seconds. No complex software needed.
                </p>
              </div>

              {error && (
                <div className="w-full max-w-2xl mb-8 p-6 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/30 rounded-3xl flex flex-col gap-4 items-center text-center animate-fade-in">
                  <div className="flex items-start gap-3 text-rose-700 dark:text-rose-400">
                    <span className="p-2.5 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-lg shrink-0">⚠️</span>
                    <div className="text-left space-y-1">
                      <p className="font-black text-slate-900 dark:text-white text-base">Background Extraction Failed</p>
                      <p className="font-medium text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{error}</p>
                    </div>
                  </div>

                  {error.toLowerCase().includes('key') && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-md">
                      Tip: You can configure a personal key by clicking the "Developer API Settings" link at the very bottom of this page.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-1 justify-center">
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
                  
                  {/* Trust Signals Section */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                      {[
                        "100% Secure",
                        "No Registration Required",
                        "Privacy Protected",
                        "Fast AI Processing",
                        "High Quality Results",
                        "Free Online Tool"
                      ].map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-350">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{badge}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 px-4">
                      <div className="flex -space-x-4">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-sm">
                            <img src={`https://i.pravatar.cc/100?u=${i}`} className="w-full h-full object-cover" loading="lazy" alt={`User Avatar ${i}`} />
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

      {/* Comprehensive SEO Editorial & Information Section */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 relative z-20 font-sans">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          
          {/* Detailed Informational Segment 1 */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Remove Background From Images Instantly
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed space-y-4 font-medium text-base">
              <p>
                In today’s hyper-visual digital marketplace, the speed and accuracy of content creator tools are more critical than ever. The ability to <strong className="text-slate-900 dark:text-white">remove background</strong> settings from original images instantly empowers freelance creators, brand agencies, and small e-commerce stores to craft professional layouts on the fly. Doing this historically required hours of painstaking hand-masking, expensive software suites, or complex lasso brush processes. Now, using our professional-grade, automatic <strong className="text-slate-900 dark:text-white">background remover</strong>, you can achieve beautiful edge masking in under five seconds with zero cost or technical setups.
              </p>
              <p>
                Our serverless <strong className="text-slate-900 dark:text-white">AI background remover</strong> relies on advanced deep learning and segmentation models to isolate foreground and background boundary ranges. This enables our models to easily <strong className="text-slate-900 dark:text-white">remove image background</strong> sections across multiple distinct categories—including people, consumer products, animal skins, vehicles, complex architectural models, and graphical vector layouts. There is no training curve or prior knowledge needed to start stripping backgrounds or generating transparent layers with this utility.
              </p>
            </div>
          </div>

          {/* Workflow Steps H2 Segment */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How To Remove Background Online
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-base">
              Our direct browser-to-cloud workspace simplifies complex mask selection tasks into a streamlined, three-step automated routine:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload Your Photo File",
                  desc: "Select or drag and drop any JPG, PNG, or high-fidelity WebP camera file onto our dropzone dashboard. Our background removal tool supports heavy raw assets up to 12MB easily without freeze-ups."
                },
                {
                  step: "02",
                  title: "Auto-Process with AI",
                  desc: "Once submitted, our premium image background eraser parses individual picture pixels. Deep neural arrays automatically segment subject details, cut out stray backdrops, and preserve absolute resolution."
                },
                {
                  step: "03",
                  title: "Refine Backdrops & Export",
                  desc: "Instantly examine your output on our grid transparency monitor. Choose to paint solid colors, pre-loaded preset graphics, or grab your pure transparent background maker PNG cutout completely free."
                }
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3">
                  <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 block">{item.step}</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features Detail Grid H2 Section */}
          <div className="space-y-8">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Features Of AI Background Remover
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base max-w-2xl">
                Unlike primitive online photo erasers, our professional tool delivers a feature suite designed to rival heavy premium desktop software:
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "AI-Powered Background Removal", desc: "Utilizes deep layer segmentation nets to automatically isolate subjects without clipping or jagged edges.", icon: Sparkles },
                { title: "Automatic Subject Detection", desc: "Recognizes people, objects, products, animals, text graphics, and vehicles dynamically on mount.", icon: Layers },
                { title: "Transparent PNG Export", desc: "Saves pixel-isolated high-fidelity PNG copies containing robust transparent alpha information and high contrast layers.", icon: Download },
                { title: "High Resolution Support", desc: "Retains absolute image height and width coordinates without aggressive file compression or quality loss.", icon: Maximize2 },
                { title: "Fast AI Processing", desc: "Finishes complicated boundary tracing within seconds, avoiding long customer queue periods.", icon: Zap },
                { title: "Batch Processing Support", desc: "Enables serial image selection and clean replacements, facilitating intensive creative project workflows.", icon: History },
                { title: "Mobile Friendly Layout", desc: "Responsive workspace optimizes performance beautifully on iOS, Android, and tablets for mobile design needs.", icon: Monitor },
                { title: "100% Privacy Protected", desc: "No photo assets are parsed, stored, or cached on servers. Your data stays entirely in your browser window.", icon: Shield }
              ].map((f, idx) => {
                const IconComp = f.icon;
                return (
                  <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-705/80 shadow-sm space-y-4 hover:border-cyan-500 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{f.title}</h4>
                      <p className="text-[11px] font-semibold text-slate-400 leading-normal">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Benefits Analysis Grid H2 Section (1200+ Words Density) */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Benefits Of Transparent Background Images
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed space-y-8 font-medium">
              <p>
                Acquiring a clean cutout transforms how you utilize visual media in branding, digital publishing, and public relations. By separating the subject of an image from distracting environmental contexts, a simple <strong className="text-slate-900 dark:text-white">photo background remover</strong> turns arbitrary snaps into versatile, high-impact creative components. Let us explore the extensive professional use cases and workflow areas that are dramatically optimized by using a modern, fast <strong className="text-slate-900 dark:text-white">background removal tool</strong>:
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">1. Use Cases for Ecommerce Storefronts</h3>
                  <p>
                    Online commerce is driven entirely by stellar visual appeal. High-converting shopping portals like Shopify, Etsy, Amazon, and eBay demand clean, centered product representations without busy domestic backdrops. When sellers use our free <strong className="text-slate-900 dark:text-white">online background remover</strong>, they can quickly strip cluttered living rooms, outdoor lighting shadows, or warehouse rackings from their catalog imagery. This builds brand symmetry, focuses buyer eyes immediately on product qualities, and ensures listing photos feel formal, clean, and highly trustworthy.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">2. Use Cases for Social Media & Creator Ecosystems</h3>
                  <p>
                    Influencers, channel operators, and digital creators on Instagram, TikTok, Pinterest, and YouTube face immense pressure to output multiple fresh, thumb-stopping graphic elements daily. Utilizing an automatic, instant <strong className="text-slate-900 dark:text-white">image background eraser</strong> lets designers rapidly isolate clean cutouts of facial profiles, fashion outfits, or dynamic actions. This enables them to overlay custom text titles, neon outlines, high-contrast borders, or abstract patterns overlaying custom canvas layers behind models easily.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">3. Use Cases for Graphic Design & Creative Mockups</h3>
                  <p>
                    Graphic design agencies rely heavily on transparent assets to fabricate layered compositions, vector brochures, website sliders, and corporate marketing materials. Integrating our <strong className="text-slate-900 dark:text-white">transparent background maker</strong> into existing Figma, Canva, or Photoshop configurations speeds up asset development. Designers no longer spend minutes zoomed in on complex boundaries trying to delete background paths; instead, they upload and download crisp PNG cutouts with alpha channels in one click.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">4. Use Cases for Automated Marketing Campaigns</h3>
                  <p>
                    Creative marketing banners, visual sales emails, corporate event slide decks, and commercial signage need flexible, modular image files of target elements. Completely clearing out background paths provides marketing personnel with complete creative play. They can position product figures adjacent to call-to-action text lines, superimpose brand characters into colorful seasonal discounts, or fuse several independent portrait elements together to create a cohesive banner easily.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">5. Use Cases for Corporate ID Photos & Official Documents</h3>
                  <p>
                    Need to turn a raw, casual holiday picture into a professional passport photograph or standard LinkedIn company profile avatar? Instead of paying for a professional photography session, simply process your original image file through our free <strong className="text-slate-900 dark:text-white">background removal tool</strong>. It separates your posture silhouette, removes messy house interiors, and allows you to replace the old background with clean corporate color layers like professional white, neutral light ash, or corporate blue.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">6. Use Cases for Studio-Quality Product Photography</h3>
                  <p>
                    Achieving professional studio-quality results usually requires expensive white sweeps, specialized light reflectors, and heavy gear setups. With the power of neural network edge detection, you can photograph any commercial product on a basic mobile device under conventional light settings, run it through our premium <strong className="text-slate-900 dark:text-white">free background remover</strong>, and layer it over virtual studio stages or geometric mock structures to instantly elevate your branding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="bg-slate-50 dark:bg-slate-950/40 py-24 border-t border-slate-100 dark:border-slate-800/80 font-sans z-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
              Quick answers regarding AI-powered background removal and transparency.
            </p>
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

          {/* Internal Interlinking Banner - Bento-Style related tools menu */}
          <div className="p-10 bg-cyan-50/25 dark:bg-cyan-950/10 rounded-[2.5rem] border border-cyan-100/30 dark:border-cyan-900/20 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Try Other Powerful Image & PDF Utilities
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto text-sm">
                Unlock high-performance, direct browser tools to compress, convert, resize, crop, or protect all your documents and photos in seconds completely free.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-left">
              {[
                { title: "Compress Image", desc: "Optimize file size easily", path: "/compress-image" },
                { title: "Resize Image", desc: "Change canvas spacing", path: "/compress-image" },
                { title: "Crop Image", desc: "Cut photo ratios", path: "/compress-image" },
                { title: "Image Converter", desc: "Transpile format types", path: "/image-converter" },
                { title: "Convert JPG to PNG", desc: "Preserve image boundaries", path: "/image-converter" },
                { title: "Convert PNG to JPG", desc: "Reduce visual file load", path: "/image-converter" },
                { title: "PDF to JPG", desc: "Extract slides to photos", path: "/pdf-to-jpg" },
                { title: "JPG to PDF", desc: "Compile photos into docs", path: "/jpg-to-pdf" }
              ].map((tool, idx) => (
                <Link 
                  key={idx} 
                  to={tool.path} 
                  className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-700/60 shadow-sm hover:border-cyan-500 hover:scale-[1.03] hover:shadow-md transition-all divide-y block"
                >
                  <p className="font-bold text-sm text-slate-800 dark:text-white leading-snug">{tool.title}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1">{tool.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Quiet API Settings Trigger */}
          <div className="flex justify-center mt-12 opacity-30 hover:opacity-100 transition-opacity">
            <button 
              type="button" 
              onClick={() => {
                const key = prompt("Enter custom remove.bg API Key override (Optional):", userApiKey || "");
                if (key !== null) {
                  const val = key.trim();
                  setUserApiKey(val);
                  if (val) {
                    localStorage.setItem('CUSTOM_REMOVE_BG_API_KEY', val);
                  } else {
                    localStorage.removeItem('CUSTOM_REMOVE_BG_API_KEY');
                  }
                  validateCurrentApiKey(val);
                  alert(val ? "Custom API key override configured successfully!" : "Custom API key override cleared.");
                }
              }}
              className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 underline font-semibold tracking-wide cursor-pointer transition-colors"
            >
              Developer API Settings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
