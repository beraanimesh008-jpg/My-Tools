import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  files: File[];
  onRemoveFile: (index: number) => void;
  accept: Record<string, string[]>;
  maxFiles?: number;
  label: string;
}

export default function Dropzone({ onFilesAdded, files, onRemoveFile, accept, maxFiles, label }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onFilesAdded(acceptedFiles),
    accept,
    maxFiles
  } as any);

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`relative group cursor-pointer rounded-[2rem] border-4 border-dashed transition-all duration-300 p-12 text-center overflow-hidden
          ${isDragActive ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900 bg-slate-50 dark:bg-slate-800/50'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className={`p-6 rounded-3xl mb-4 transition-all duration-300 ${isDragActive ? 'bg-rose-500 text-white shadow-xl scale-110' : 'bg-white dark:bg-slate-700 text-slate-400 group-hover:text-rose-500 shadow-sm'}`}>
            <Upload className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{label}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Drag & drop files here, or click to browse</p>
          <div className="mt-4 px-4 py-1.5 bg-white dark:bg-slate-700 rounded-full text-xs font-bold text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-600 shadow-sm">
            Max 20MB per file
          </div>
        </div>

        {/* Dynamic background effect */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-rose-500"
            />
          )}
        </AnimatePresence>
      </div>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {files.map((file, idx) => (
              <motion.div 
                key={`${file.name}-${idx}`}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 relative shadow-sm"
              >
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(idx);
                  }}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
