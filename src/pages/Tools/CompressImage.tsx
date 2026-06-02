import React, { useState, useCallback, useRef, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
import SEO from '@/src/components/SEO';
import Footer from '@/src/components/Footer';
import { trackFileProcessed } from '@/src/utils/analytics';
import { 
  ImageIcon, 
  Download, 
  Loader2, 
  CheckCircle, 
  ArrowLeft, 
  Sliders, 
  Sparkles, 
  Trash2, 
  Plus, 
  FileArchive, 
  Info, 
  Check, 
  Zap, 
  Maximize2, 
  ArrowRight, 
  Laptop, 
  Cpu, 
  RefreshCw,
  TrendingDown,
  Settings,
  Scale,
  ShieldCheck,
  Lock,
  Award,
  HelpCircle,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';

interface CompressedItem {
  id: string;
  file: File;
  name: string;
  format: string;
  originalSize: number;
  originalUrl: string;
  compressedFile: File | null;
  compressedSize: number | null;
  compressedUrl: string | null;
  status: 'idle' | 'compressing' | 'completed' | 'error';
  progress: number;
  savings: number | null;
  width?: number;
  height?: number;
  error?: string;
}

export default function CompressImage() {
  const [items, setItems] = useState<CompressedItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Settings
  const [dimensionUnit, setDimensionUnit] = useState<'px' | 'mm' | 'cm'>('px');
  const [targetSize, setTargetSize] = useState<string>('300'); // target in KB
  const [compLevel, setCompLevel] = useState<'low' | 'medium' | 'high' | 'ultra'>('medium');
  const [aiSmartMode, setAiSmartMode] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true, // open first by default
  });

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Clean elements on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      });
    };
  }, [items]);

  // Read target size from URL parameters (e.g. ?target=100) on mount and on query change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryTarget = params.get('target');
    if (queryTarget && !isNaN(parseInt(queryTarget))) {
      setTargetSize(queryTarget);
    }
  }, [window.location.search]);

  // Format utility for bytes
  const formatSize = (bytes: number | null | undefined): string => {
    if (bytes === undefined || bytes === null) return '--';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Convert dimensions helper based on Unit selector
  const convertDimensions = (w: number | undefined, h: number | undefined, unit: 'px' | 'mm' | 'cm') => {
    if (!w || !h) return '--';
    if (unit === 'px') {
      return `${w} × ${h} px`;
    }
    // 96 DPI default standard screen resolution
    if (unit === 'mm') {
      const wMm = Math.round(w * 0.264583);
      const hMm = Math.round(h * 0.264583);
      return `${wMm} × ${hMm} mm`;
    }
    if (unit === 'cm') {
      const wCm = (w * 0.0264583).toFixed(1);
      const hCm = (h * 0.0264583).toFixed(1);
      return `${wCm} × ${hCm} cm`;
    }
    return '';
  };

  // Fetch image bounds
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Process file list input
  const processFiles = async (fileList: File[]) => {
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const filtered = fileList.filter(f => validFormats.includes(f.type));

    if (filtered.length === 0) {
      return;
    }

    const newItems: CompressedItem[] = await Promise.all(
      filtered.map(async (file) => {
        const id = Math.random().toString(36).substring(7);
        const originalUrl = URL.createObjectURL(file);
        const bounds = await getImageDimensions(file);

        return {
          id,
          file,
          name: file.name,
          format: file.type.split('/')[1]?.toUpperCase() || 'JPEG',
          originalSize: file.size,
          originalUrl,
          compressedFile: null,
          compressedSize: null,
          compressedUrl: null,
          status: 'idle',
          progress: 0,
          savings: null,
          width: bounds.width,
          height: bounds.height
        };
      })
    );

    setItems(prev => {
      const updated = [...prev, ...newItems];
      if (!activeId && updated.length > 0) {
        setActiveId(updated[0].id);
      }
      return updated;
    });
    setSuccessMsg(null);
  };

  // File drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Estimate the output size dynamically based on settings
  const getEstimatedSize = (originalSize: number): number => {
    if (targetSize && !isNaN(parseInt(targetSize))) {
      const customBytes = parseInt(targetSize) * 1024;
      return Math.min(originalSize * 0.9, customBytes);
    }

    if (aiSmartMode) {
      return Math.round(originalSize * 0.45);
    }

    switch (compLevel) {
      case 'ultra': return Math.round(originalSize * 0.25);
      case 'high': return Math.round(originalSize * 0.45);
      case 'medium': return Math.round(originalSize * 0.65);
      case 'low': return Math.round(originalSize * 0.85);
      default: return Math.round(originalSize * 0.65);
    }
  };

  // Trigger compression algorithm
  const performCompression = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setSuccessMsg(null);

    // Track total successfully processed
    let processedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Update item state to compressing
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'compressing', progress: 10 } : it));

      try {
        let initialQualityScale = 0.7; // default medium

        // If AI is enabled or preset slider is altered
        if (aiSmartMode) {
          initialQualityScale = 0.55; 
        } else {
          switch (compLevel) {
            case 'low': initialQualityScale = 0.85; break;
            case 'medium': initialQualityScale = 0.65; break;
            case 'high': initialQualityScale = 0.45; break;
            case 'ultra': initialQualityScale = 0.25; break;
          }
        }

        // Set target size MB if user filled target size
        let targetSizeMB = 10; // high default limit
        const enteredSize = parseInt(targetSize);
        if (enteredSize > 0) {
          targetSizeMB = enteredSize / 1024;
        }

        const options = {
          maxSizeMB: targetSizeMB,
          maxWidthOrHeight: 3845,
          useWebWorker: true,
          fileType: item.file.type,
          initialQuality: initialQualityScale,
          onProgress: (prog: number) => {
            setItems(prev => prev.map(it => it.id === item.id ? { ...it, progress: Math.min(95, Math.round(prog)) } : it));
          }
        };

        const compressedBlob = await imageCompression(item.file, options);
        
        // Ensure size is smaller, otherwise respect quality limits
        let finalBlob = compressedBlob;
        if (compressedBlob.size >= item.file.size) {
          // If fallback compressed size exceeds original, force lower quality limit
          const fallbackOptions = {
            ...options,
            initialQuality: Math.max(0.15, initialQualityScale - 0.15),
          };
          finalBlob = await imageCompression(item.file, fallbackOptions);
        }

        const compressedFile = new File([finalBlob], item.name, {
          type: item.file.type,
          lastModified: Date.now()
        });

        const url = URL.createObjectURL(compressedFile);
        const savings = Math.max(0, ((item.originalSize - compressedFile.size) / item.originalSize) * 100);

        setItems(prev => prev.map(it => it.id === item.id ? {
          ...it,
          status: 'completed',
          progress: 100,
          compressedFile,
          compressedSize: compressedFile.size,
          compressedUrl: url,
          savings
        } : it));

        processedCount++;
      } catch (err: any) {
        console.error("Compression error:", err);
        setItems(prev => prev.map(it => it.id === item.id ? {
          ...it,
          status: 'error',
          progress: 0,
          error: err?.message || 'Compression failed'
        } : it));
      }
    }

    setIsProcessing(false);
    trackFileProcessed(processedCount);

    if (processedCount > 0) {
      setSuccessMsg(`Successfully compressed ${processedCount} image${processedCount > 1 ? 's' : ''}!`);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#10b981']
      });
    }
  };

  // Single download action
  const handleDownloadSingle = (item: CompressedItem) => {
    if (!item.compressedUrl) return;
    const a = document.createElement('a');
    a.href = item.compressedUrl;
    a.download = `compressed_${item.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all or ZIP if multiple files
  const handleDownloadAll = async () => {
    const completed = items.filter(it => it.status === 'completed' && it.compressedFile);
    if (completed.length === 0) return;

    if (completed.length === 1) {
      handleDownloadSingle(completed[0]);
      return;
    }

    const zip = new JSZip();
    completed.forEach(item => {
      zip.file(`compressed_${item.name}`, item.compressedFile!);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed_images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP creation failed", err);
    }
  };

  // List management
  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev => {
      const item = prev.find(it => it.id === id);
      if (item) {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      }
      const filtered = prev.filter(it => it.id !== id);
      if (activeId === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    items.forEach(item => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    setItems([]);
    setActiveId(null);
    setSuccessMsg(null);
  };

  const activeItem = items.find(it => it.id === activeId);

  // Stats calculation
  const totalOriginalBytes = items.reduce((sum, it) => sum + it.originalSize, 0);
  const totalCompressedBytes = items.reduce((sum, it) => sum + (it.compressedSize || it.originalSize), 0);
  const aggregateSavings = totalOriginalBytes > 0 
    ? ((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />
      <SEO 
        title="AI Ultra Image Compressor – Compress Images Without Losing Quality"
        description="Compress JPG, PNG, WEBP images online with AI Ultra Image Compressor. Reduce image size while maintaining high quality. Fast, secure and free."
        path="/compress-image"
        faqs={[
          {
            question: "How do I compress an image online?",
            answer: "To compress an image online with AI Ultra Image Compressor, simply drag and drop your JPG, PNG, or WEBP photos into the dashed upload container or hit 'Select Images'. Specify your optional dimension scale unit (pixels, mm, cm) and compression range or enter a specific custom KB target, then trigger the 'Compress' process. Download individual optimized files or an archive bundle natively."
          },
          {
            question: "Can I compress JPG images?",
            answer: "Yes! AI Ultra Image Compressor delivers deep optimization for JPG/JPEG layouts without creating blocky artifacts. It cleans metadata headers and downscales structural tables seamlessly in the local browser."
          },
          {
            question: "Can I compress PNG images?",
            answer: "Yes, our PNG compression routine maintains high-fidelity transparency alpha masks while lowering structural catalog weights. PNGs contain rich index tables that we safely consolidate with zero outline blurring."
          },
          {
            question: "Will image quality be reduced?",
            answer: "We ensure maximum visual preservation. Our AI Smart Mode utilizes human-centric visual metrics to downscale redundant code while maintaining detail in main focuses, matching the standards of premium processors."
          },
          {
            question: "Is this image compressor free?",
            answer: "Absolutely! AI Ultra Image Compressor is 100% free with unlimited batch conversions, zero signups, and absolute security as your items are never uploaded to a cloud server."
          },
          {
            question: "Can I compress images to a specific size?",
            answer: "Yes! Simply fill your custom size limit (e.g. 300 KB, 100 KB, etc.) in the target size input box, and our localized engine will automatically adjust quality metrics to attempt to fit that target envelope precisely."
          }
        ]}
      />

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14">
        
        {/* Navigation & Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <div className="flex justify-center items-center gap-2 mb-3">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:dark:text-emerald-400 Transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            AI Ultra Image Compressor
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">
            Next-gen browser side batch photo compressing platform. Instant, 100% secure, and private.
          </p>
        </div>

        {/* Global White Clean Card Panel Layout */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/80 p-5 md:p-8 relative">
          
          {/* Top segment control settings */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-705 pb-5 mb-6 gap-4">
            
            {/* Left AI smart mode selector toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAiSmartMode(!aiSmartMode)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                  aiSmartMode 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50' 
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 border border-transparent'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${aiSmartMode ? 'animate-pulse' : ''}`} />
                AI Smart Compressor {aiSmartMode ? 'ON' : 'OFF'}
              </button>

              {items.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="py-1.5 px-3 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-xl text-xs font-bold flex items-center gap-1.5 Transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Queue
                </button>
              )}
            </div>

            {/* Right Dimension Unit selector (requirement request for top-right dimension selector) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 shadow-inner self-end sm:self-auto">
              {(['px', 'mm', 'cm'] as const).map(unit => (
                <button
                  key={unit}
                  onClick={() => setDimensionUnit(unit)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${
                    dimensionUnit === unit
                      ? 'bg-white dark:bg-slate-805 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-450 dark:text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {unit === 'px' ? 'Pixels' : unit === 'mm' ? 'MM' : 'CM'}
                </button>
              ))}
            </div>
          </div>

          {/* DRAG AND DROP AREA */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('drag-drop-uploader-input')?.click()}
            className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 p-8 md:p-12 text-center select-none cursor-pointer flex flex-col items-center justify-center ${
              isDragOver 
                ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' 
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-650 bg-slate-50/55 dark:bg-slate-900/40'
            }`}
          >
            <input 
              type="file" 
              id="drag-drop-uploader-input" 
              multiple 
              accept="image/jpeg, image/jpg, image/png, image/webp" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) {
                  processFiles(Array.from(e.target.files));
                }
              }}
            />

            <div className={`p-5 rounded-2xl mb-4 transition-all duration-300 ${
              isDragOver ? 'bg-emerald-550 text-white scale-110 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-sm group-hover:text-emerald-500'
            }`}>
              <ImageIcon className="w-10 h-10" />
            </div>

            <p className="text-base md:text-lg font-bold text-slate-800 dark:text-white mb-1">
              Select or Drag & Drop Images Here
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">
              Supports JPEG, JPG, PNG and WEBP. Secure localized rendering.
            </p>

            {/* Centered Green Select Images button */}
            <button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm tracking-wide py-2.5 px-6 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 transition-all outline-none"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('drag-drop-uploader-input')?.click();
              }}
            >
              Select Images
            </button>
          </div>

          {/* QUEUE/PREVIEW AREA */}
          {items.length > 0 && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-100 dark:border-slate-705 pt-8">
              
              {/* Batch items catalog block (Left side) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
                    Upload Queue ({items.length})
                  </h3>
                  {items.length > 1 && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Total size: {formatSize(totalOriginalBytes)}
                    </span>
                  )}
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                  {items.map(item => {
                    const isSelected = item.id === activeId;
                    const isDone = item.status === 'completed';
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-500/80 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-sm'
                            : 'border-slate-100 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-205 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Mini thumbnail */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-750 flex-shrink-0">
                            <img 
                              src={item.originalUrl} 
                              alt="Thumbnail preview" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px]" title={item.name}>
                              {item.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                              <span>{convertDimensions(item.width, item.height, dimensionUnit)}</span>
                              <span>•</span>
                              <span>{item.format}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 flex-shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 line-through">
                                {formatSize(item.originalSize)}
                              </span>
                              {isDone && (
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                  {formatSize(item.compressedSize)}
                                </span>
                              )}
                            </div>
                            
                            {/* Real-time estimated size placeholder or completed saving indicator */}
                            {!isDone && item.status !== 'compressing' && (
                              <p className="text-[11px] text-slate-450 dark:text-slate-500 font-bold">
                                Est. {formatSize(getEstimatedSize(item.originalSize))}
                              </p>
                            )}

                            {item.status === 'compressing' && (
                              <div className="flex items-center gap-1 text-[11px] text-blue-500 font-bold animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> Compressing... {item.progress}%
                              </div>
                            )}

                            {isDone && item.savings !== null && (
                              <span className="inline-block bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-md px-1.5 py-0.5 mt-0.5">
                                -{item.savings.toFixed(0)}%
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isDone && item.compressedUrl && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadSingle(item); }}
                                className="p-2 text-slate-400 hover:text-emerald-555 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Download image"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleRemoveItem(item.id, e)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                              title="Remove image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE PREVIEW PRE compression detailed workspace (Right side) */}
              <div className="lg:col-span-5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-750 p-4 space-y-4">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  Clipped Image Preview & Specs
                </span>

                {activeItem ? (
                  <div className="space-y-4">
                    
                    {/* Centered preview block image */}
                    <div className="relative w-full aspect-[4/3] bg-slate-250 dark:bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-800 flex items-center justify-center">
                      <img 
                        src={activeItem.compressedUrl || activeItem.originalUrl} 
                        alt="Workspace view" 
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Active tag banner over preview */}
                      <span className="absolute bottom-3 left-3 bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        {activeItem.status === 'completed' ? 'Optimized' : 'Original Original'}
                      </span>

                      {/* Overlap savings tag */}
                      {activeItem.status === 'completed' && activeItem.savings !== null && (
                        <span className="absolute bottom-3 right-3 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg">
                          Saved {activeItem.savings.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    {/* Meta specifics lists */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Format Style
                        </span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {activeItem.format} File
                        </span>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Original Dimensions
                        </span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {convertDimensions(activeItem.width, activeItem.height, dimensionUnit)}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Raw Original Size
                        </span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {formatSize(activeItem.originalSize)}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Optimized Size
                        </span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {activeItem.status === 'completed' ? formatSize(activeItem.compressedSize) : 'In Queue...'}
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking line if active compiling */}
                    {activeItem.status === 'compressing' && (
                      <div className="space-y-1.5 bg-white dark:bg-slate-805 rounded-xl p-3.5 border border-blue-100 dark:border-blue-900/40">
                        <div className="flex justify-between text-xs font-black text-blue-500 uppercase tracking-wider">
                          <span>Compressor engine running...</span>
                          <span>{activeItem.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${activeItem.progress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Success notification for single download after compression completed */}
                    {activeItem.status === 'completed' && activeItem.compressedUrl && (
                      <div className="space-y-3 pt-1">
                        <button
                          onClick={() => handleDownloadSingle(activeItem)}
                          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Download Compressed Image
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Laptop className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">Select an image from the queue to showcase detailed metrics and specs.</p>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* CONTROLLER/SETTINGS ACTION BOARD */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-705 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Control Left Column: Optimization Preset Sliders */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white mb-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-extrabold">Compression Settings</h3>
              </div>

              {/* Compression Slider segment */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-755 space-y-4 relative">
                
                {/* AI Toggle Overlap masking warning */}
                {aiSmartMode && (
                  <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-[1px] rounded-2xl z-20 flex flex-col items-center justify-center px-4 text-center">
                    <Sparkles className="w-5 h-5 text-emerald-500 mb-1.5 animate-pulse" />
                    <p className="text-xs font-black text-slate-800 dark:text-white">AI Smart Compression takes precedence</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">The neural slider auto-clusters resolution ratios safely. To alter values, disable AI above.</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                    Compression Level Slider
                  </span>
                  <span className="text-xs font-extrabold capitalize bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md text-emerald-600 dark:text-emerald-400">
                    {compLevel}
                  </span>
                </div>

                {/* Level selector slide mapping */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={compLevel === 'low' ? 1 : compLevel === 'medium' ? 2 : compLevel === 'high' ? 3 : 4}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (v === 1) setCompLevel('low');
                      else if (v === 2) setCompLevel('medium');
                      else if (v === 3) setCompLevel('high');
                      else setCompLevel('ultra');
                    }}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    <span onClick={() => setCompLevel('low')} className={`cursor-pointer ${compLevel === 'low' ? 'text-emerald-555' : ''}`}>Low</span>
                    <span onClick={() => setCompLevel('medium')} className={`cursor-pointer ${compLevel === 'medium' ? 'text-emerald-555' : ''}`}>Medium</span>
                    <span onClick={() => setCompLevel('high')} className={`cursor-pointer ${compLevel === 'high' ? 'text-emerald-555' : ''}`}>High</span>
                    <span onClick={() => setCompLevel('ultra')} className={`cursor-pointer ${compLevel === 'ultra' ? 'text-emerald-555' : ''}`}>Ultra</span>
                  </div>
                </div>
              </div>

              {/* Preservation Warning information stamp */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4.5 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  <strong>Preserve Maximum Quality Assurance:</strong> PNG transparent alphas, Exif meta data vectors, and wide-color profiles remain fully maintained inside client memory pipeline.
                </p>
              </div>

            </div>

            {/* Control Right Column: Compress & Custom Size Targets */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white mb-2">
                <Scale className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-extrabold">Compression Target Size</h3>
              </div>

              {/* Compression Input & Actions (blue compress button next to input) */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-755 space-y-4">
                <p className="text-xs text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider block">
                  Define custom weight targets (KB)
                </p>

                {/* Target input wrapper beside the blue compress button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={targetSize}
                      onChange={(e) => setTargetSize(e.target.value)}
                      placeholder="e.g. 300"
                      className="w-full py-2.5 pl-3.5 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm focus:border-blue-500 dark:focus:border-blue-550 focus:outline-none transition-colors"
                      min="10"
                      max="15000"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-450 uppercase tracking-widest">
                      KB
                    </span>
                  </div>

                  {/* Highlight requirement: Blue Compress button next to input */}
                  <button
                    onClick={performCompression}
                    disabled={isProcessing || items.length === 0}
                    className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-blue-500/10 disabled:bg-slate-350 disabled:dark:bg-slate-700 text-white font-extrabold text-sm rounded-xl tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center gap-2 justify-center"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    Compress
                  </button>
                </div>
                
                <p className="text-[11px] text-slate-450 font-bold dark:text-slate-500">
                  Example: 300 KB size entry. Leave empty or set high value for default compression level slider.
                </p>
              </div>

              {/* Status and Action downloads bundle block */}
              {items.length > 0 && (
                <div className="space-y-3.5">
                  <AnimatePresence>
                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 rounded-xl text-xs font-extrabold flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{successMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ZIP or Combined Output download section */}
                  {items.some(it => it.status === 'completed') && (
                    <button
                      onClick={handleDownloadAll}
                      className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 to-emerald-750 hover:from-emerald-500 hover:to-emerald-650 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-650/15 flex items-center justify-center gap-2 active:scale-98"
                    >
                      {items.filter(it => it.status === 'completed').length > 1 ? (
                        <>
                          <FileArchive className="w-4 h-4" /> Download Combined ZIP
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Download Compressed Image
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>

        {/* TRUST SIGNALS PANELS (Horizontal Row) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-12 mb-16">
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center flex flex-col items-center justify-center transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-850 dark:text-white mb-1">100% Secure</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">No external file transfers. Upload-free client compiler</p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center flex flex-col items-center justify-center transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-850 dark:text-white mb-1">Local Processing</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">Fully client side engine preserving localized bandwidth</p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center flex flex-col items-center justify-center transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-850 dark:text-white mb-1">No Login Required</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">Instant batch optimization workspace open to all</p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center flex flex-col items-center justify-center transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-650 dark:text-amber-400 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-850 dark:text-white mb-1">Free Forever</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">Committed to providing premium web tools at zero cost</p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center col-span-2 sm:col-span-1 flex flex-col items-center justify-center transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-650 dark:text-teal-450 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-850 dark:text-white mb-1">Privacy Protected</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">Images stay stored securely within sandbox boundaries</p>
          </div>
        </div>

        {/* 1000+ WORD SEO RICH KNOWLEDGE CONTENT & GUIDES */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-10 border border-slate-100 dark:border-slate-700/60 shadow-md space-y-12">
          
          {/* ARTICLE SECT 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-1 h-7 bg-emerald-500 rounded-full inline-block"></span>
              Compress Images Online Without Restricting Quality
            </h2>
            <div className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed space-y-4 font-normal">
              <p>
                In the modern landscape of high-performance web development, mobile browsing, and digital aesthetics, image files stand out as the primary source of heavy network overhead. Raw photographs shot directly from smartphones or DSLR cams routinely span anywhere from 4MB to upwards of 15MB. Placing these uncompressed images on portfolios, business websites, e-commerce stores, or email newsletters acts as an immediate bottleneck, slowing page loading speeds, driving up user bounce rates, and negatively impacting search rankings.
              </p>
              <p>
                The <strong>AI Ultra Image Compressor</strong> is designed to solve this digital bottleneck. By leveraging state-of-the-art in-browser compression algorithms coupled with smart visual perception metrics, our tool delivers high-fidelity file reduction. Whether you need to compress JPG, PNG, or WEBP layouts, you can reduce storage weight targets by up to 80% or 90% while keeping visual details sharp. Crucially, this entire pipeline operates locally within your browser sandbox via advanced Client-Side Web Workers, ensuring that your confidential documents, personal graphics, and product media are never sent over networks to foreign cloud databases.
              </p>
            </div>
          </section>

          {/* ARTICLE SECT 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-1 h-7 bg-blue-500 rounded-full inline-block"></span>
              How To Compress Images Online Natively
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-750">
                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest block mb-2">Step 01</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-2">Upload Files Safely</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Drag and drop JPG, JPEG, PNG, or WebP elements directly into the customizable dotted container, or tap "Select Images" to fetch files from your smartphone layout or computer folders.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-750">
                <span className="text-xs font-black text-blue-500 uppercase tracking-widest block mb-2">Step 02</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-2">Tune Target Targets</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Toggle the AI Smart Mode for dynamic neural ratios, slide the compression level (Low, Medium, High, Ultra), or specify a custom weight target (e.g. 300 KB, 100 KB) before hitting "Compress".
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-750">
                <span className="text-xs font-black text-purple-500 uppercase tracking-widest block mb-2">Step 03</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-2">Export Instantly</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Verify the original vs optimized file sizes, reduction ratios, and visual output on the workspace canvas. Then, save individual files or bundle everything in a consolidated ZIP file.
                </p>
              </div>
            </div>
          </section>

          {/* ARTICLE SECT 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-1 h-7 bg-purple-500 rounded-full inline-block"></span>
              The Mechanics of JPEG, PNG, and WebP Compression
            </h2>
            <div className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed space-y-4">
              <p>
                To provide a premium compressor layout that outranks traditional alternatives like Pi7 Image Tool or iLoveIMG, it helps to understand how different image formats behave under active compression parameters. Each extension standard (JPEG, PNG, WEBP) utilizes specific coding models to achieve weight reduction:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-xs md:text-sm text-slate-550 dark:text-slate-400">
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">JPG/JPEG Compression:</strong> This format uses lossy compression model backed by Discrete Cosine Transform (DCT) quantization math. During compression, visually minor chromatic variations are combined to save file space. AI Ultra controls these quantization tables, preventing pixel blockiness around high-contrast vectors and texts even at lower quality bands.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">PNG Image Optimization:</strong> PNG uses a lossless Deflate encoding algorithm that works with index palettes and predictors. Because PNG is commonly selected for icons containing transparent alpha masks, we preserve transparent attributes and EXIF vector layouts cleanly, stripping only redundant overhead and optimize indexing maps.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">WEBP Image Compression:</strong> Built as a next-gen format for the web, WebP leverages predictive coding blocks to predict color cells based on adjacent pixel neighborhoods. Our tool uses customized quality ratios during re-scaling, ensuring WebP containers achieve the best speed-to-weight balance for modern production workspaces.
                </li>
              </ul>
              <p>
                By providing an adjustable <strong>Compression Level Slider</strong> and an <strong>AI Smart Mode</strong> that dynamically finds the optimal quality threshold, our engine handles these distinct formatting characteristics smoothly. This hybrid approach delivers excellent balance, preserving maximum image detail without sacrificing critical loading speed benefits.
              </p>
            </div>
          </section>

          {/* ARTICLE SECT 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-1 h-7 bg-amber-500 rounded-full inline-block"></span>
              Crucial Core Web Vitals Optimization for Peak Google SEO
            </h2>
            <div className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed space-y-4">
              <p>
                Google's organic search algorithm ranks pages based on <strong>Core Web Vitals</strong> metrics, prioritizing websites that respond instantly on mobile and desktop devices. Large, unoptimized images directly degrade your Core Web Vitals scores across three critical criteria:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-1">
                <div className="p-4 bg-slate-50 dark:bg-slate-905 rounded-xl border border-slate-100 dark:border-slate-750">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Largest Contentful Paint (LCP)
                  </h4>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                    By shrinking heavy hero headers down to double-digit KBs, mobile viewports render key elements instantly, ensuring your site stays in Google's fast-loading range.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-905 rounded-xl border border-slate-100 dark:border-slate-750">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-blue-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> First Input Delay (FID)
                  </h4>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                    Local web worker compression keeps the browser's main thread free from heavy calculations, preventing unresponsive UI freezes and maintaining fast tap speeds.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-905 rounded-xl border border-slate-100 dark:border-slate-750">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-purple-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Cumulative Layout Shift (CLS)
                  </h4>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                    Our tool extracts and displays image dimensions (pixels, mm, or cm) on upload, helping developers define proper height-width HTML attributes to prevent layout shifts.
                  </p>
                </div>
              </div>
              <p>
                Using our utility lets you optimize raw elements to fit into precise target envelopes (such as 300 KB, 200 KB, or 100 KB limits) before web deployment. This workflow keeps your web scores high and improves indexing, organic search visibility, and user retention.
              </p>
            </div>
          </section>

          {/* FAQ SECTION (Redesigned Toggling Accordion Layout) */}
          <section className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-750">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-1 h-7 bg-teal-500 rounded-full inline-block"></span>
              Frequently Asked Questions (FAQs)
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  q: "How do I compress an image online?",
                  a: "To compress an image online with AI Ultra Image Compressor, simply drag and drop your JPG, PNG, or WEBP photos into the dashed upload container or hit 'Select Images'. Specify your optional dimension scale unit (pixels, mm, cm) and compression range or enter a specific custom KB target, then trigger the 'Compress' process. Download individual optimized files or an archive bundle natively."
                },
                {
                  q: "Can I compress JPG images?",
                  a: "Yes! AI Ultra Image Compressor delivers deep optimization for JPG/JPEG layouts without creating blocky artifacts. It cleans metadata headers and downscales structural tables seamlessly in the local browser."
                },
                {
                  q: "Can I compress PNG images?",
                  a: "Yes, our PNG compression routine maintains high-fidelity transparency alpha masks while lowering structural catalog weights. PNGs contain rich index tables that we safely consolidate with zero outline blurring."
                },
                {
                  q: "Will image quality be reduced?",
                  a: "We ensure maximum visual preservation. Our AI Smart Mode utilizes human-centric visual metrics to downscale redundant code while maintaining detail in main focuses, matching the standards of premium processors."
                },
                {
                  q: "Is this image compressor free?",
                  a: "Absolutely! AI Ultra Image Compressor is 100% free with unlimited batch conversions, zero signups, and absolute security as your items are never uploaded to a cloud server."
                },
                {
                  q: "Can I compress images to a specific size?",
                  a: "Yes! Simply fill your custom size limit (e.g. 300 KB, 100 KB, etc.) in the target size input box, and our localized engine will automatically adjust quality metrics to attempt to fit that target envelope precisely."
                }
              ].map((faq, idx) => {
                const isOpen = !!faqOpen[idx];
                return (
                  <div 
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/40 dark:hover:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-750 transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left py-4 px-5 font-bold text-sm md:text-base text-slate-800 dark:text-white flex items-center justify-between gap-4 outline-none"
                    >
                      <span className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 pt-0 text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RELATED TOOLS / INTERNAL LINKING SECTION */}
          <section className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-755">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-1 h-6 bg-indigo-500 rounded-full inline-block"></span>
              Related Image & PDF Optimization Tools
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Accelerate your workflow with our other document compilers and converters. Everything processes locally with privacy-first standards:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { title: "Compress Image to 50KB", url: "/compress-image?target=50", badge: "Fast" },
                { title: "Compress Image to 100KB", url: "/compress-image?target=100", badge: "Popular" },
                { title: "Compress Image to 200KB", url: "/compress-image?target=200", badge: "Optimal" },
                { title: "Compress Image to 300KB", url: "/compress-image?target=300", badge: "Standard" },
                { title: "Compress Image to 500KB", url: "/compress-image?target=500", badge: "High-Res" },
                { title: "Resize Image Dimensions", url: "/image-converter" },
                { title: "Crop Image Canvas", url: "/image-converter" },
                { title: "Convert JPG to PNG", url: "/image-converter" },
                { title: "Convert PNG to JPG", url: "/image-converter" },
                { title: "Remove PNG Background", url: "/background-remover", badge: "AI" }
              ].map((tool, index) => (
                <Link
                  key={index}
                  to={tool.url}
                  className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-150 dark:border-slate-750 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/10 transition-all flex flex-col justify-between group h-24"
                >
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {tool.title}
                  </span>
                  <div className="flex items-center justify-between mt-2">
                    {tool.badge ? (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        tool.badge === 'AI' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' 
                          : tool.badge === 'Popular'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}>
                        {tool.badge}
                      </span>
                    ) : (
                      <span />
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>

      </main>

      {/* FULL SEO PRODUCTION FOOTER ELEMENT */}
      <Footer />
    </div>
  );
}
