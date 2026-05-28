import { useState, useCallback, useRef } from 'react';
import Navbar from '@/src/components/Navbar';
import { trackFileProcessed } from '@/src/utils/analytics';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle, 
  ArrowLeft, 
  Plus, 
  GripVertical, 
  X, 
  Trash2, 
  AlertCircle,
  FileSearch,
  Move,
  Shield,
  Zap,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// --- Sortable Item Component ---

interface SortableFileCardProps {
  file: File;
  id: string;
  onRemove: (id: string) => void;
  key?: string;
}

function SortableFileCard({ file, id, onRemove }: SortableFileCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-200 shadow-sm
        ${isDragging ? 'border-rose-500 shadow-xl scale-105 z-50' : 'border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900'}
      `}
    >
      <div className="p-4 flex flex-col items-center">
        {/* Grip Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute top-2 left-2 p-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-rose-400 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(id)}
          className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Details */}
        <div className="mt-4 mb-4 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl">
          <FileText className="w-12 h-12 text-rose-500" />
        </div>
        
        <div className="w-full px-2 text-center">
          <p className="text-sm font-bold text-slate-800 dark:text-white truncate mb-1" title={file.name}>
            {file.name}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {formatSize(file.size)}
          </p>
        </div>
      </div>

      {/* Hover Overlay */}
      {isDragging && <div className="absolute inset-0 bg-rose-500/5 rounded-2xl" />}
    </div>
  );
}

// --- Main Page Component ---

interface FileWithId {
  id: string;
  file: File;
}

export default function MergePdf() {
  const [fileList, setFileList] = useState<FileWithId[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Password Decryption States & Helper
  const [passwordPrompt, setPasswordPrompt] = useState<{ fileName: string; resolve: (p: string | null) => void; error?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const askForPassword = (fileName: string, promptError?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setShowPassword(false);
      setPasswordPrompt({
        fileName,
        error: promptError,
        resolve: (p: string | null) => {
          setPasswordPrompt(null);
          resolve(p);
        },
      });
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file
    }));
    setFileList(prev => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    noClick: fileList.length > 0,
  } as any);

  const handleRemoveFile = (id: string) => {
    setFileList(prev => prev.filter(item => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFileList((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMerge = async () => {
    if (fileList.length < 2) {
      setError("Please select at least two PDF files to merge.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Initialize merged PDF
      const mergedPdf = await PDFDocument.create();
      
      const totalFiles = fileList.length;
      for (let i = 0; i < totalFiles; i++) {
        const item = fileList[i];
        
        // Update progress
        setUploadProgress(Math.round(((i) / totalFiles) * 100));

        // Read file as ArrayBuffer
        const arrayBuffer = await item.file.arrayBuffer();
        
        // Load PDF document with password protection detection
        let loadedPdf: PDFDocument | null = null;
        let pResult: { pagesCount: number; renderPages: boolean; pdfjsDoc?: any; passwordUsed?: string } = { pagesCount: 0, renderPages: false };
        let password = '';
        let unlockSuccess = false;

        while (!unlockSuccess) {
          try {
            // First check if it loads natively in pdf-lib (must not be encrypted)
            loadedPdf = await PDFDocument.load(arrayBuffer.slice(0), {
              ignoreEncryption: false, // Ensures it throws if encrypted
              throwOnInvalidObject: false
            });
            unlockSuccess = true;
            pResult = { pagesCount: loadedPdf.getPageCount(), renderPages: false };
          } catch (err: any) {
            const errStr = String(err.message || '').toLowerCase();
            const isEncrypted = errStr.includes('encrypt') || errStr.includes('password') || err.name === 'PasswordException';
            if (isEncrypted) {
              const promptError = password ? 'Incorrect password. Please try again.' : undefined;
              const enteredPassword = await askForPassword(item.file.name, promptError);
              if (enteredPassword === null) {
                throw new Error(`Decrypting "${item.file.name}" was cancelled.`);
              }
              password = enteredPassword;

              // Try to load with pdf.js to verify the password
              try {
                const pdfjsDoc = await pdfjs.getDocument({ data: arrayBuffer.slice(0), password }).promise;
                unlockSuccess = true;
                pResult = { pagesCount: pdfjsDoc.numPages, renderPages: true, pdfjsDoc, passwordUsed: password };
              } catch (pdfjsErr: any) {
                if (pdfjsErr.name !== 'PasswordException' && !String(pdfjsErr.message || '').toLowerCase().includes('password')) {
                  throw pdfjsErr;
                }
              }
            } else {
              throw err;
            }
          }
        }

        // Add pages based on encryption status
        if (pResult.renderPages && pResult.pdfjsDoc) {
          const pdfjsDoc = pResult.pdfjsDoc;
          for (let pIdx = 1; pIdx <= pResult.pagesCount; pIdx++) {
            const p = await pdfjsDoc.getPage(pIdx);
            const viewport = p.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) continue;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Fill canvas with white background
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            await p.render({
              canvasContext: context,
              viewport: viewport
            }).promise;

            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const imgBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());

            const pdfImage = await mergedPdf.embedJpg(imgBytes);
            const newPage = mergedPdf.addPage([viewport.width, viewport.height]);
            newPage.drawImage(pdfImage, {
              x: 0,
              y: 0,
              width: viewport.width,
              height: viewport.height
            });
          }
        } else if (loadedPdf) {
          const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
      }

      setUploadProgress(90);

      // Save the merged PDF
      const pdfBytes = await mergedPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      setUploadProgress(100);

      // Track files processed in analytics
      trackFileProcessed(fileList.length);

      // Generate Blob and URL
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

      // Success celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#fb7185']
      });

      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      console.error("Merge error:", err);
      setError("Failed to merge PDFs. Please ensure all files are valid and not password protected.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFileList([]);
    setResultUrl(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {!resultUrl ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 text-rose-600 mb-6 bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-full font-bold text-sm">
                  <FileSearch className="w-4 h-4" />
                  PDF Productivity Pack
                </div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Merge PDF Files</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto">
                  Combine PDFs in the order you want with the easiest PDF merger available.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-2xl mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-bold">{error}</p>
                </motion.div>
              )}

              {/* Main Interaction Area */}
              {fileList.length === 0 ? (
                /* Initial Dropzone */
                <div 
                  {...getRootProps()}
                  className={`w-full max-w-4xl min-h-[400px] flex flex-col items-center justify-center p-12 rounded-[3.5rem] border-4 border-dashed transition-all duration-300 cursor-pointer
                    ${isDragActive ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-700'}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="w-32 h-32 bg-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-200 dark:shadow-none mb-8 group-hover:scale-110 transition-transform">
                    <Plus className="text-white w-16 h-16 stroke-3" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Select PDF files</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-bold">or drag and drop PDFs here</p>
                  
                  {/* Subtle Background Graphic */}
                  <div className="absolute opacity-5 pointer-events-none">
                    <FileText className="w-96 h-96" />
                  </div>
                </div>
              ) : (
                /* Sorted File List */
                <div className="w-full space-y-12">
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Main Sorting Area */}
                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-8 px-4">
                        <div className="flex items-center gap-3">
                          <Move className="w-5 h-5 text-rose-500" />
                          <h3 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-wider">Arrange Files</h3>
                        </div>
                        <button 
                          onClick={open}
                          className="flex items-center gap-2 text-rose-600 font-bold hover:text-rose-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" /> Add More
                        </button>
                      </div>

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={fileList.map(f => f.id)}
                          strategy={rectSortingStrategy}
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {fileList.map((item) => (
                              <SortableFileCard 
                                key={item.id} 
                                id={item.id} 
                                file={item.file} 
                                onRemove={handleRemoveFile} 
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>

                    {/* Sidebar Sidebar for Merge Action */}
                    <div className="w-full lg:w-80 space-y-6 shrink-0 sticky top-24">
                      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border-2 border-slate-100 dark:border-slate-700 shadow-xl">
                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center justify-between">
                          Merge Order
                          <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 px-3 py-1 rounded-full text-xs font-black">
                            {fileList.length} FILES
                          </span>
                        </h4>
                        
                        <div className="space-y-4 mb-8">
                          {fileList.slice(0, 5).map((item, i) => (
                            <div key={item.id} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                              <span className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded text-[10px] text-slate-400">
                                {i + 1}
                              </span>
                              <span className="truncate">{item.file.name}</span>
                            </div>
                          ))}
                          {fileList.length > 5 && (
                            <div className="text-xs text-slate-400 font-bold px-8">
                              + {fileList.length - 5} more files...
                            </div>
                          )}
                        </div>

                        <button
                          onClick={handleMerge}
                          disabled={isProcessing || fileList.length < 2}
                          className="w-full bg-rose-600 text-white rounded-2xl py-6 font-black text-xl shadow-2xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:scale-100 disabled:opacity-50 flex flex-col items-center gap-2 group"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin" />
                              <span className="text-sm">Merging PDFs...</span>
                              <div className="w-full max-w-[120px] h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                                <motion.div 
                                  className="h-full bg-white shadow-sm"
                                  animate={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              Merge PDF
                              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                              </div>
                            </>
                          )}
                        </button>
                        
                        <button 
                          onClick={reset}
                          disabled={isProcessing}
                          className="w-full mt-4 text-slate-400 hover:text-rose-500 font-bold transition-colors flex items-center justify-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700"
                        >
                          <Trash2 className="w-4 h-4" /> Start Over
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Success State */
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="bg-white dark:bg-slate-800 rounded-[3.5rem] p-16 text-center shadow-2xl border-2 border-rose-50 dark:border-slate-700 max-w-3xl mx-auto"
            >
              <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-200">
                <CheckCircle className="text-white w-16 h-16" />
              </div>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-6">PDFs Merged!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-12 font-medium text-xl leading-relaxed">
                Your combined PDF file is ready. The download should start automatically within seconds.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <a 
                  href={resultUrl} 
                  download="merged.pdf"
                  className="bg-rose-600 text-white px-12 py-6 rounded-[2rem] font-black text-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-rose-200 dark:shadow-none hover:scale-105"
                >
                  <Download className="w-8 h-8" />
                  Download Now
                </a>
                <button 
                  onClick={reset}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-12 py-6 rounded-[2rem] font-black text-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:scale-105"
                >
                  Merge Again
                </button>
              </div>

              <div className="mt-16 flex items-center justify-center gap-12 border-t border-slate-100 dark:border-slate-700 pt-10">
                <div className="text-center">
                  <div className="text-3xl font-black text-rose-600">100%</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secure</div>
                </div>
                <div className="text-center px-12 border-x border-slate-100 dark:border-slate-700">
                  <div className="text-3xl font-black text-rose-600">Fast</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-rose-600">Free</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Forever</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Trust Badges */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-24 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Safe & Private</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Files are processed securely and deleted from our servers automatically after processing.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Lightning Fast</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Proprietary merging algorithms combine high volume PDF files in fractions of a second.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
              <GripVertical className="rotate-90 w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Visual Sorting</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Easily arrange your files using our intuitive drag & drop interface before merging.</p>
          </div>
        </div>
      </section>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 dark:border-slate-700/60 text-center"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200/20 dark:shadow-none animate-bounce">
                <Lock className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Enter PDF Password</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6 truncate px-2" title={passwordPrompt.fileName}>
                The file <span className="font-bold text-rose-600 dark:text-rose-400">"{passwordPrompt.fileName}"</span> is encrypted.
              </p>

              {passwordPrompt.error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-left">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-bold leading-tight">{passwordPrompt.error}</p>
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.currentTarget as HTMLFormElement;
                const passwordInput = target.elements.namedItem('pdfPassword') as HTMLInputElement;
                passwordPrompt.resolve(passwordInput.value);
              }} className="space-y-6">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="pdfPassword"
                    name="pdfPassword"
                    placeholder="Enter password..."
                    autoFocus
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white font-bold text-base focus:border-rose-500 focus:outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => passwordPrompt.resolve(null)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-rose-200 dark:shadow-none active:scale-95"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
