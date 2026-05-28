import React, { useState, useCallback, useRef, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
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
  Split, 
  Laptop, 
  Cpu, 
  RefreshCw,
  Sun,
  Moon,
  Shield,
  FileImage,
  Layers
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
  outWidth?: number;
  outHeight?: number;
  error?: string;
}

export default function CompressImage() {
  const [items, setItems] = useState<CompressedItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [compressionMode, setCompressionMode] = useState<'balanced' | 'extreme' | 'lossless' | 'custom'>('balanced');
  const [customQuality, setCustomQuality] = useState(60);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  
  // Before / After Slider Position
  const [sliderPosition, setSliderPosition] = useState(50);
  const compareRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      });
    };
  }, [items]);

  // Compute resolved target quality based on active mode
  const getTargetQuality = (): number => {
    switch (compressionMode) {
      case 'lossless': return 92;
      case 'extreme': return 35;
      case 'balanced': return 65;
      case 'custom': return customQuality;
    }
  };

  // Format File Size
  const formatSize = (bytes: number | null | undefined): string => {
    if (bytes === undefined || bytes === null) return '--';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Parse width and height of an image file
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

  // Add Files helper
  const handleAddFiles = async (fileList: File[]) => {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const filteredFiles = fileList.filter(file => validImageTypes.includes(file.type));

    if (filteredFiles.length === 0) return;

    const newItems: CompressedItem[] = await Promise.all(
      filteredFiles.map(async (file) => {
        const id = Math.random().toString(36).substring(7);
        const originalUrl = URL.createObjectURL(file);
        const dimensions = await getImageDimensions(file);
        
        return {
          id,
          file,
          name: file.name,
          format: file.type.split('/')[1]?.toUpperCase() || 'IMG',
          originalSize: file.size,
          originalUrl,
          compressedFile: null,
          compressedSize: null,
          compressedUrl: null,
          status: 'idle',
          progress: 0,
          savings: null,
          width: dimensions.width,
          height: dimensions.height
        };
      })
    );

    setItems((prev) => {
      const updated = [...prev, ...newItems];
      if (!activeId && updated.length > 0) {
        setActiveId(updated[0].id);
      }
      return updated;
    });
  };

  // Trigger compression for a single item
  const compressSingleItem = async (id: string, targetQ: number) => {
    setItems((prev) => 
      prev.map((it) => (it.id === id ? { ...it, status: 'compressing', progress: 5 } : it))
    );

    const match = items.find((it) => it.id === id);
    if (!match) return;

    // browser-image-compression options
    const options = {
      maxSizeMB: 12,
      maxWidthOrHeight: compressionMode === 'extreme' ? 1440 : 3840,
      useWebWorker: true,
      fileType: match.file.type,
      initialQuality: targetQ / 100,
      onProgress: (prog: number) => {
        setItems((prev) => 
          prev.map((it) => (it.id === id ? { ...it, progress: Math.min(95, Math.round(prog)) } : it))
        );
      }
    };

    try {
      const compressedBlob = await imageCompression(match.file, options);
      const compressedFile = new File([compressedBlob], match.file.name, {
        type: match.file.type,
        lastModified: Date.now()
      });

      const compressedUrl = URL.createObjectURL(compressedFile);
      const outDimensions = await getImageDimensions(compressedFile);

      const savings = ((match.originalSize - compressedFile.size) / match.originalSize) * 100;
      
      setItems((prev) => 
        prev.map((it) => {
          if (it.id === id) {
            const completedItem: CompressedItem = {
              ...it,
              compressedFile,
              compressedSize: compressedFile.size,
              compressedUrl,
              status: 'completed',
              progress: 100,
              savings: savings > 0 ? savings : 0,
              outWidth: outDimensions.width || it.width,
              outHeight: outDimensions.height || it.height
            };

            // Trigger auto-download if requested
            if (autoDownload) {
              const link = document.createElement('a');
              link.href = compressedUrl;
              link.download = `optimized_${match.file.name}`;
              link.click();
            }

            return completedItem;
          }
          return it;
        })
      );
    } catch (err: any) {
      console.error(err);
      setItems((prev) => 
        prev.map((it) => (it.id === id ? { ...it, status: 'error', progress: 0, error: err?.message || 'Compression failed' } : it))
      );
    }
  };

  // Run Compression on all Idle items
  const handleCompressAll = async () => {
    if (items.length === 0) return;
    setIsProcessingAll(true);
    const targetQ = getTargetQuality();

    const itemsToProcess = items.filter(it => it.status !== 'completed');
    const processedCount = itemsToProcess.length === 0 ? items.length : itemsToProcess.length;
    if (itemsToProcess.length === 0) {
      // Re-compress everything if all are already compressed
      await Promise.all(items.map(it => compressSingleItem(it.id, targetQ)));
    } else {
      await Promise.all(itemsToProcess.map(it => compressSingleItem(it.id, targetQ)));
    }

    setIsProcessingAll(false);
    
    // Track files in analytics
    trackFileProcessed(processedCount);

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f97316', '#fb923c', '#fdba74', '#ffffff']
    });
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    const completed = items.filter(it => it.status === 'completed' && it.compressedFile);
    if (completed.length === 0) return;

    if (completed.length === 1) {
      // Download single
      const item = completed[0];
      const link = document.createElement('a');
      link.href = item.compressedUrl!;
      link.download = `optimized_${item.name}`;
      link.click();
      return;
    }

    const zip = new JSZip();
    completed.forEach((item) => {
      zip.file(`optimized_${item.name}`, item.compressedFile!);
    });

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'optimized_images.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to construct ZIP bundle');
    }
  };

  // Single file removal
  const handleRemoveItem = (id: string) => {
    const item = items.find(it => it.id === id);
    if (item) {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    }
    setItems((prev) => {
      const filtered = prev.filter(it => it.id !== id);
      if (activeId === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  // Remove All / Reset
  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    setItems([]);
    setActiveId(null);
  };

  // Drag and Drop State Handlers for Native Upload Element
  const [isDragOver, setIsDragOver] = useState(false);
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
      const filesArr = Array.from(e.dataTransfer.files) as File[];
      await handleAddFiles(filesArr);
    }
  };

  // Slider Mouse Move calculation
  const updateSliderFromEvent = (clientX: number) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1 || isDraggingSlider.current) {
      updateSliderFromEvent(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      updateSliderFromEvent(e.touches[0].clientX);
    }
  };

  const activeItem = items.find(it => it.id === activeId);

  // Aggregate Stats
  const totalOriginalBytes = items.reduce((sum, it) => sum + it.originalSize, 0);
  const totalCompressedBytes = items.reduce((sum, it) => sum + (it.compressedSize || it.originalSize), 0);
  const totalSavingsPct = totalOriginalBytes > 0 
    ? ((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100 
    : 0;
  const isAnyCompleted = items.some(it => it.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10">
        
        {/* Header segment */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-[1.6rem] flex items-center justify-center shadow-xl shadow-orange-500/10">
              <Sparkles className="text-white w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <Link to="/" className="text-slate-400 hover:text-orange-500 font-bold text-sm tracking-wide transition-colors flex items-center gap-1 uppercase">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Link>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-2.5 py-0.5 rounded-md">
                  AI-Powered Engine
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-md">
                  100% Client-Side Safe
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Ultra Image Compressor</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                Optimized compression algorithms for JPEG, PNG & WebP while preserving crystalline sharpness.
              </p>
            </div>
          </div>

          {/* Quick Clear controls */}
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              id="clear-all-btn"
              className="px-5 py-3 text-sm font-bold text-slate-500 hover:text-rose-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center gap-2 shadow-sm transition-all active:scale-95 hover:shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              Reset Workspace
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Workspace - Large Drag/Drop Zone */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto"
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('image-uploader-main')?.click()}
              className={`relative group cursor-pointer rounded-[3.2rem] border-4 border-dashed transition-all duration-300 p-12 md:p-16 text-center select-none overflow-hidden ${
                isDragOver 
                  ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/10 scale-[1.01]' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-850 bg-white dark:bg-slate-800/60 shadow-xl'
              }`}
            >
              <input 
                type="file" 
                id="image-uploader-main" 
                multiple
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAddFiles(Array.from(e.target.files));
                  }
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-rose-500/5 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <div className={`p-7 rounded-[2rem] mb-6 transition-all duration-300 ${
                  isDragOver ? 'bg-orange-500 text-white shadow-xl scale-110' : 'bg-gradient-to-tr from-amber-50 to-orange-100 dark:from-slate-800 dark:to-slate-700 text-orange-500 shadow-inner'
                }`}>
                  <ImageIcon className="w-14 h-14" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">
                  Drop files to compress
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto mb-6 text-sm">
                  Drag and drop multiple <span className="font-bold text-orange-500">PNG</span>, <span className="font-bold text-orange-500">JPEG</span>, or <span className="font-bold text-orange-500">WebP</span> files here, or click to browse.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  <span className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    PNG Transparency Preserved
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Batch Compress Enabled
                  </span>
                </div>
              </div>
            </div>

            {/* Core Features Teaser Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Smart Quantization</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Preserves high fidelity by mathematically clusters colors like TinyPNG, resulting in up to 80% file reduction with virtually 0 visual loss.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Split className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Before vs After Comparison</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Review and verify compressed pixel quality using our real-time interactive, fluid splitter preview before downloading.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Offline Browser Engine</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    No uploads to third-party database servers. All operations happen in-memory inside your browser with maximum speed and complete privacy.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Active Workspace Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Controls & Settings & Batch List (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Batch list image progress tracking */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.2rem] border border-slate-100 dark:border-slate-700/80 shadow-md">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Uploaded Queue ({items.length})</h3>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => document.getElementById('image-uploader-add')?.click()}
                      id="add-more-btn"
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-500" />
                      Add Files
                    </button>
                    <input 
                      type="file" 
                      id="image-uploader-add" 
                      multiple
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleAddFiles(Array.from(e.target.files));
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Queue items list */}
                <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isActive = item.id === activeId;
                    const displayOriginalSize = formatSize(item.originalSize);
                    const displayCompressedSize = formatSize(item.compressedSize);
                    const isCompleted = item.status === 'completed';
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isActive 
                            ? 'border-orange-500/80 bg-orange-50/20 dark:bg-orange-950/10 shadow-inner' 
                            : 'border-slate-100 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        {/* Selected overlay border highlight */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 rounded-l-2xl" />
                        )}

                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Miniature Preview Thumbnail */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/55 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
                            <img 
                              src={item.originalUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black bg-slate-200/80 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                {item.format}
                              </span>
                              <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px] md:max-w-[140px] lg:max-w-[200px]" title={item.name}>
                                {item.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mt-1">
                              <span>Size: {displayOriginalSize}</span>
                              {item.width && <span>({item.width}×{item.height}px)</span>}
                            </div>
                          </div>
                        </div>

                        {/* Compression status / progress visualizer */}
                        <div className="flex items-center gap-4 flex-shrink-0 justify-between md:justify-end">
                          
                          {/* Live compression calculations or progress */}
                          {item.status === 'compressing' && (
                            <div className="flex flex-col items-end w-32 md:w-36">
                              <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider flex items-center gap-1 animate-pulse mb-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Optimizing... {item.progress}%
                              </span>
                              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                              </div>
                            </div>
                          )}

                          {isCompleted && (
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="text-xs font-black text-slate-900 dark:text-white">
                                  {displayCompressedSize}
                                </span>
                                <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  -{item.savings?.toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Optimized Successfully</p>
                            </div>
                          )}

                          {item.status === 'idle' && (
                            <div className="text-right">
                              <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-full uppercase tracking-wide">
                                Idle Queue
                              </span>
                            </div>
                          )}

                          {item.status === 'error' && (
                            <div className="text-right max-w-[120px]">
                              <span className="text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg uppercase truncate block">
                                Err: {item.error}
                              </span>
                            </div>
                          )}

                          {/* Quick single item controls */}
                          <div className="flex items-center gap-1">
                            {isCompleted && item.compressedUrl && (
                              <a
                                href={item.compressedUrl}
                                download={`optimized_${item.name}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-slate-100 hover:bg-orange-500 text-slate-500 hover:text-white dark:bg-slate-700 rounded-xl transition-all active:scale-95"
                                title="Download compressed copy"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            
                            {item.status === 'idle' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  compressSingleItem(item.id, getTargetQuality());
                                }}
                                className="p-2 hover:bg-orange-100 dark:hover:bg-orange-950/30 text-slate-500 hover:text-orange-500 rounded-xl transition-all active:scale-95"
                                title="Compress Single now"
                              >
                                <Zap className="w-4 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.id);
                              }}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                              title="Delete from list"
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

              {/* ACTIVE PREVIEW ELEMENT: Comparison Slider */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.2rem] border border-slate-100 dark:border-slate-700/80 shadow-md">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Split className="w-5 h-5 text-orange-500" /> Crystalline Comparison Slider
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Drag across the image below to inspect original vs optimized resolution.</p>
                  </div>
                  {activeItem && (
                    <span className="text-[11px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3.5 py-1.5 rounded-xl truncate max-w-xs" title={activeItem.name}>
                      Viewing: {activeItem.name}
                    </span>
                  )}
                </div>

                {activeItem ? (
                  <div className="space-y-4">
                    {/* The Interactive Split Container */}
                    <div 
                      ref={compareRef}
                      onMouseMove={handleMouseMove}
                      onMouseDown={() => { isDraggingSlider.current = true; }}
                      onMouseUp={() => { isDraggingSlider.current = false; }}
                      onMouseLeave={() => { isDraggingSlider.current = false; }}
                      onTouchMove={handleTouchMove}
                      className="relative w-full h-[320px] md:h-[420px] bg-slate-100 dark:bg-slate-900 rounded-[1.8rem] overflow-hidden select-none border border-slate-200/60 dark:border-slate-700"
                    >
                      {/* Layer 1 (Background): Optimized Image */}
                      {activeItem.status === 'completed' && activeItem.compressedUrl ? (
                        <img 
                          src={activeItem.compressedUrl} 
                          alt="Optimized result"
                          className="absolute inset-0 w-full h-full object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                          <ImageIcon className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700 animate-pulse" />
                          <p className="text-sm font-bold">Optimized Output Image Preview</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">Hit "Compress All" or the lightning icon to run smart optimization and compare side-by-side.</p>
                        </div>
                      )}

                      {/* Layer 2 (Foreground Layer): Original Image cropped by sliding position percentage */}
                      <div 
                        className="absolute inset-0 h-full overflow-hidden border-r-2 border-orange-550/80 pointer-events-none"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        <img 
                          src={activeItem.originalUrl} 
                          alt="Original file"
                          className="absolute inset-0 w-full h-full object-contain p-2 bg-slate-100/90 dark:bg-slate-900" 
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Slider Control Line & Grip Badge overlay */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-rose-500 cursor-ew-resize pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-xl border-2 border-orange-500 flex items-center justify-center pointer-events-none">
                          <Split className="w-4 h-4 text-orange-500" />
                        </div>
                      </div>

                      {/* Hover Overlay Labels for Left/Right sides */}
                      <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-md text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/15">
                        Original File
                      </div>
                      <div className="absolute top-4 right-4 bg-orange-600/90 backdrop-blur-md text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl">
                        AI Optimized
                      </div>

                      {/* Helper tool overlay indicator inside container */}
                      <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                        <span className="inline-block bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase tracking-wider">
                          👈 Drag or hover anywhere over the image to inspect 👉
                        </span>
                      </div>
                    </div>

                    {/* Meta specifications segment for current preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Original Size</p>
                        <p className="text-sm font-black text-slate-700 dark:text-white mt-0.5">{formatSize(activeItem.originalSize)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Optimized Size</p>
                        <p className="text-sm font-black text-orange-500 mt-0.5">
                          {activeItem.status === 'completed' ? formatSize(activeItem.compressedSize) : 'Pending...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Clipped Reduction</p>
                        <p className="text-sm font-black text-emerald-500 mt-0.5">
                          {activeItem.status === 'completed' && activeItem.savings ? `-${activeItem.savings.toFixed(1)}%` : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Pixel Dimensions</p>
                        <p className="text-sm font-black text-slate-600 dark:text-slate-350 truncate mt-0.5" title={activeItem.width ? `${activeItem.width} × ${activeItem.height} px` : '--'}>
                          {activeItem.width ? `${activeItem.width}×${activeItem.height}` : '--'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-[1.8rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <Laptop className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-sm font-bold">Select an item from your queue above to view visual comparison slider.</p>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Quality controls, preset specifications, and Master Download stats panel (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Quality Preset card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.2rem] border border-slate-100 dark:border-slate-700/80 shadow-md">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <Sliders className="w-5 h-5 text-orange-500" /> Optimization Level
                </h3>

                <div className="space-y-3">
                  {/* Preset Buttons Grid */}
                  <div className="grid grid-cols-1 gap-2.5">
                    
                    {/* Balanced Preset */}
                    <button
                      onClick={() => setCompressionMode('balanced')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                        compressionMode === 'balanced'
                          ? 'border-orange-500 bg-orange-50/10 dark:bg-orange-950/10'
                          : 'border-slate-100 dark:border-slate-705 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                          Balanced Mode
                        </span>
                        <span className="text-[10px] font-black bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 px-2 py-0.5 rounded-full uppercase">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Offers superior file reduction up to ~75% with zero perceivable resolution shift.</p>
                    </button>

                    {/* Extreme Preset */}
                    <button
                      onClick={() => setCompressionMode('extreme')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                        compressionMode === 'extreme'
                          ? 'border-orange-500 bg-orange-50/10 dark:bg-orange-950/10'
                          : 'border-slate-100 dark:border-slate-705 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                          Extreme Mode
                        </span>
                        <span className="text-[10px] font-black bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 px-2 py-0.5 rounded-full uppercase">
                          Max Savings
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Provides maximum bytes reduction up to ~90% for ultra-fast web downloads.</p>
                    </button>

                    {/* Lossless Preset */}
                    <button
                      onClick={() => setCompressionMode('lossless')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                        compressionMode === 'lossless'
                          ? 'border-orange-500 bg-orange-50/10 dark:bg-orange-950/10'
                          : 'border-slate-100 dark:border-slate-705 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                          Lossless / High Quality
                        </span>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-700 px-2 py-0.5 rounded-full uppercase">
                          Lossless Focus
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Safe preservation. Compress minimally keeping 100% crystal colors.</p>
                    </button>

                    {/* Custom Preset */}
                    <button
                      onClick={() => setCompressionMode('custom')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                        compressionMode === 'custom'
                          ? 'border-orange-500 bg-orange-50/10 dark:bg-orange-950/10'
                          : 'border-slate-100 dark:border-slate-705 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                          Custom Value Selector
                        </span>
                        <span className="text-[10px] font-black bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase">
                          Clipped Sliders
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Fine-tune custom compression rates (10% to 95%) with our quality dials.</p>
                    </button>

                  </div>

                  {/* Customizable Quality range slider (visible when Custom is activated) */}
                  <AnimatePresence>
                    {compressionMode === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3.5 overflow-hidden mt-3"
                      >
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Master Quality Scale</label>
                          <span className="text-xs font-black bg-orange-500 text-white px-2 py-0.5 rounded-md">{customQuality}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="95"
                          value={customQuality}
                          onChange={(e) => setCustomQuality(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <span>Max Savings (10%)</span>
                          <span>Max Quality (95%)</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* SAVINGS STATEMENTS PANEL / RUN ACTIONS */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 relative p-6 rounded-[2.2rem] shadow-xl text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  
                  {/* Total Savings Metrics */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Aggregated Metrics Dashboard</h4>
                    
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span className="text-xs font-bold text-slate-400">Total Original Bytes</span>
                        <span className="text-sm font-black">{formatSize(totalOriginalBytes)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span className="text-xs font-bold text-slate-400">Post-Optimize Bytes</span>
                        <span className="text-sm font-black text-orange-400">
                          {isAnyCompleted ? formatSize(totalCompressedBytes) : '--'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs font-bold text-slate-400">Complete Disk Savings</span>
                        <div className="text-right">
                          <span className={`text-xl font-extrabold ${isAnyCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {isAnyCompleted ? `-${totalSavingsPct.toFixed(0)}%` : '--'}
                          </span>
                          {isAnyCompleted && (
                            <p className="text-[10px] font-bold text-emerald-500 uppercase mt-0.5">
                              Saved {formatSize(totalOriginalBytes - totalCompressedBytes)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings option */}
                  <div className="p-3.5 bg-white/[0.04] dark:bg-black/[0.15] border border-white/5 rounded-2xl flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="auto-download"
                      checked={autoDownload}
                      onChange={(e) => setAutoDownload(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-650 bg-slate-800 border-white/10 accent-orange-500 cursor-pointer"
                    />
                    <label htmlFor="auto-download" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                      Enable Auto-Download upon finish
                    </label>
                  </div>

                  {/* EXECUTE COMPRESS ALL */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={handleCompressAll}
                      disabled={isProcessingAll || items.length === 0}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 px-5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:grayscale disabled:shadow-none disabled:active:scale-100 transition-all cursor-pointer"
                    >
                      {isProcessingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Crunching images in-browser...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-3.5 text-amber-200 fill-amber-200" />
                          Optimize Bundle
                        </>
                      )}
                    </button>

                    {/* Master ZIP Download button */}
                    <button
                      onClick={handleDownloadZip}
                      disabled={isProcessingAll || !isAnyCompleted}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-4 px-5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-slate-800 disabled:active:scale-100 transition-all cursor-pointer"
                    >
                      {items.filter(it => it.status === 'completed').length > 1 ? (
                        <>
                          <FileArchive className="w-4 h-4 text-orange-400" />
                          Pack zip of download
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download All Outputs
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* TECHNICAL AI ENGINE EXPLAINER IN LOWER CORNER */}
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-5 rounded-3xl space-y-3.5">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Cpu className="w-4 h-4 text-orange-500" />
                  <h5 className="text-xs font-black uppercase tracking-wider">Quantization Core Pipeline</h5>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <li className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <span>Reduces color palettes intelligently using an advanced vector quantization formula.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <span>Preserves the 8-bit alpha channel layer of PNG images cleanly without converting to black backgrounds.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <span>Compresses Huffman coding trees to guarantee maximal bytes storage savings.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
