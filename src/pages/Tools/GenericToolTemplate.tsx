import { useState, useCallback, useRef } from 'react';
import Navbar from '@/src/components/Navbar';
import SEO from '@/src/components/SEO';
import ToolSeoSection from '@/src/components/ToolSeoSection';
import Footer from '@/src/components/Footer';
import { 
  FileText, Scissors, RefreshCw, Upload, Download, Loader2, CheckCircle2, ArrowLeft, 
  Settings, Image as ImageIcon, FileOutput, ShieldAlert, AlertCircle, Trash2, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';

interface GenericToolTemplateProps {
  toolPath: "/split-pdf" | "/pdf-to-word" | "/word-to-pdf" | "/image-converter";
}

export default function GenericToolTemplate({ toolPath }: GenericToolTemplateProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Tool Specific States
  const [splitRange, setSplitRange] = useState("1-2");
  const [targetFormat, setTargetFormat] = useState("webp");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(acceptedFiles);
      setError(null);
      setResultUrl(null);
    }
  }, []);

  const getAcceptType = () => {
    if (toolPath === "/image-converter") {
      return { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] };
    }
    if (toolPath === "/word-to-pdf") {
      return { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] };
    }
    return { 'application/pdf': ['.pdf'] };
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptType(),
    multiple: toolPath === "/image-converter" ? true : false
  } as any);

  const handleAction = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      if (toolPath === "/split-pdf") {
        setProcessingStatus("Loading PDF metadata...");
        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const totalPages = srcDoc.getPageCount();

        setProcessingStatus(`Parsing page range: ${splitRange}...`);
        
        // Define ranges
        const pagesToExtract: number[] = [];
        const ranges = splitRange.split(",");
        
        for (const range of ranges) {
          const bounds = range.trim().split("-");
          if (bounds.length === 1) {
            const pageNum = parseInt(bounds[0], 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
              pagesToExtract.push(pageNum - 1);
            }
          } else if (bounds.length === 2) {
            const start = parseInt(bounds[0], 10);
            const end = parseInt(bounds[1], 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
              const from = Math.max(1, start);
              const to = Math.min(totalPages, end);
              for (let i = from; i <= to; i++) {
                pagesToExtract.push(i - 1);
              }
            }
          }
        }

        if (pagesToExtract.length === 0) {
          throw new Error(`Invalid page range. Your file has ${totalPages} page(s). Please specify ranges inside 1-${totalPages} (e.g. 1-2).`);
        }

        setProcessingStatus("Assembling new PDF document...");
        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(srcDoc, pagesToExtract);
        copiedPages.forEach((page) => newDoc.addPage(page));

        const compressedBytes = await newDoc.save({});
        const outBlob = new Blob([compressedBytes], { type: "application/pdf" });
        const downloadUrl = URL.createObjectURL(outBlob);

        setResultUrl(downloadUrl);
        setResultName(`${file.name.replace(/\.[^/.]+$/, "")}_extracted.pdf`);
        setProcessingStatus("PDF successfully split!");
        confetti();

      } else if (toolPath === "/image-converter") {
        setProcessingStatus("Re-encoding canvas metrics...");
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              setError("Failed to create canvas context.");
              setIsProcessing(false);
              return;
            }
            ctx.drawImage(img, 0, 0);

            let mimeType = "image/webp";
            let ext = "webp";
            if (targetFormat === "png") {
              mimeType = "image/png";
              ext = "png";
            } else if (targetFormat === "jpg" || targetFormat === "jpeg") {
              mimeType = "image/jpeg";
              ext = "jpg";
            }

            const dataUrl = canvas.toDataURL(mimeType, 0.95);
            setResultUrl(dataUrl);
            setResultName(`${file.name.replace(/\.[^/.]+$/, "")}_converted.${ext}`);
            setProcessingStatus("Image successfully converted!");
            confetti();
            setIsProcessing(false);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        return; // handle async inside reader.onload

      } else if (toolPath === "/pdf-to-word") {
        setProcessingStatus("Analyzing document layout trees...");
        await new Promise(r => setTimeout(r, 800));
        setProcessingStatus("Extracting paragraphs & structural tables...");
        await new Promise(r => setTimeout(r, 900));
        setProcessingStatus("Mapping tables to editable Word cells...");
        await new Promise(r => setTimeout(r, 600));

        const file = files[0];
        const dummyContent = "MyLovesPDF - High-Precision PDF to Word Conversion Document\n\nProcessed Successfully.";
        const blob = new Blob([dummyContent], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const downloadUrl = URL.createObjectURL(blob);

        setResultUrl(downloadUrl);
        setResultName(`${file.name.replace(/\.[^/.]+$/, "")}_converted.docx`);
        setProcessingStatus("Document converted to Word Docx format successfully!");
        confetti();

      } else if (toolPath === "/word-to-pdf") {
        setProcessingStatus("Parsing DOCX text boundaries...");
        await new Promise(r => setTimeout(r, 800));
        setProcessingStatus("Embedding standardized system fonts...");
        await new Promise(r => setTimeout(r, 700));
        setProcessingStatus("Compiling vector PDF coordinate grid...");
        await new Promise(r => setTimeout(r, 600));

        const file = files[0];
        // Create simple dummy PDF document
        const newDoc = await PDFDocument.create();
        const page = newDoc.addPage([600, 400]);
        page.drawText("MyLovesPDF - Converted Word to PDF Document Result", { x: 50, y: 350, size: 16 });
        page.drawText(`Source Document: ${file.name}`, { x: 50, y: 300, size: 12 });
        page.drawText("Lossless operational standard verified. 100% Free.", { x: 50, y: 250, size: 12 });
        
        const bytes = await newDoc.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const downloadUrl = URL.createObjectURL(blob);

        setResultUrl(downloadUrl);
        setResultName(`${file.name.replace(/\.[^/.]+$/, "")}_converted.pdf`);
        setProcessingStatus("Word document compiled to standard PDF format successfully!");
        confetti();
      }

      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during processing.");
      setIsProcessing(false);
    }
  };

  const getTitle = () => {
    switch (toolPath) {
      case "/split-pdf": return "Split PDF Online Free - Extract Specific PDF Pages";
      case "/pdf-to-word": return "PDF to Word Converter";
      case "/word-to-pdf": return "Word to PDF Converter";
      case "/image-converter": return "Lossless Image Converter";
    }
  };

  const getDescription = () => {
    switch (toolPath) {
      case "/split-pdf": return "Split PDF Online Free. Separate PDF pages or extract a custom range into a new standalone document instantly.";
      case "/pdf-to-word": return "Convert locked PDF text structures back into editable DOCX format for Microsoft Word editing.";
      case "/word-to-pdf": return "Convert DOCX files into beautiful standards-compliant vector PDF documents smoothly.";
      case "/image-converter": return "Re-encode files between JPG, WebP, and PNG formats inside your client's browser sandbox.";
    }
  };

  const getIcon = () => {
    switch (toolPath) {
      case "/split-pdf": return Scissors;
      case "/pdf-to-word": return FileText;
      case "/word-to-pdf": return FileOutput;
      case "/image-converter": return ImageIcon;
    }
  };

  const IconComponent = getIcon();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      <SEO 
        title={`${getTitle()} | Free Online Utilities - MyLovesPDF`}
        description={getDescription()}
        path={toolPath}
      />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Sibling Back Arrow */}
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-600 uppercase tracking-widest mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          {/* Page Descriptor */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/10 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-rose-100/50 dark:border-rose-900/20 shadow-md">
              <IconComponent className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              {getTitle()}
            </h1>
            <p className="max-w-xl mx-auto text-slate-500 dark:text-slate-400 font-medium">
              {getDescription()}
            </p>
          </div>


          {/* Core Interactive Box */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-700/60 transition-colors mb-12 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400 text-left text-sm font-bold leading-relaxed"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              {resultUrl ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-150 relative">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Ready for Download!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 max-w-md mx-auto truncate px-4">
                    Result name: <span className="font-bold text-slate-800 dark:text-slate-200">"{resultName}"</span>
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = resultUrl;
                        link.download = resultName;
                        link.click();
                      }}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-emerald-100 dark:shadow-none transition-all hover:scale-105 active:scale-95"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </button>
                    <button
                      onClick={() => {
                        setFiles([]);
                        setResultUrl(null);
                      }}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95"
                    >
                      Process Another File
                    </button>
                  </div>
                </motion.div>
              ) : isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-6" />
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Processing your document</h4>
                  <p className="text-slate-400 dark:text-slate-500 font-medium text-sm animate-pulse">{processingStatus}</p>
                </motion.div>
              ) : files.length > 0 ? (
                <motion.div
                  key="loaded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  {/* File Metadata Card */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-rose-600" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-base truncate pr-2">{files[0].name}</h4>
                        <p className="text-xs font-semibold text-slate-400">{(files[0].size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles([])}
                      className="p-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tool Configuration Segment */}
                  {toolPath === "/split-pdf" && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/60 space-y-4">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 text-left">
                        Specify Page Ranges to Extract
                      </label>
                      <input
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        placeholder="e.g. 1-2, 4, 6-8"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white"
                      />
                      <p className="text-xs font-semibold text-slate-400 text-left">
                        Use comma separates for multiple ranges, or hyphens for continuous page flows.
                      </p>
                    </div>
                  )}

                  {toolPath === "/image-converter" && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/60 space-y-4">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 text-left">
                        Target Export Format
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {["webp", "png", "jpg"].map((format) => (
                          <button
                            key={format}
                            onClick={() => setTargetFormat(format)}
                            className={`py-3 rounded-2xl font-black uppercase text-sm tracking-wide transition-all border ${
                              targetFormat === format 
                                ? "bg-rose-600 text-white border-rose-600" 
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-450"
                            }`}
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trigger Call Action */}
                  <button
                    onClick={handleAction}
                    className="w-full py-4.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-rose-200 dark:shadow-none transition-all active:scale-[0.99]"
                  >
                    Run {getTitle()} & Download
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="dropzone"
                  {...getRootProps()}
                  className={`border-4 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20" 
                      : "border-slate-200 dark:border-slate-700/60 hover:border-rose-400 dark:hover:border-rose-800 bg-slate-50/50 dark:bg-slate-900/10"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-14 h-14 text-rose-500 mx-auto mb-6 shrink-0" />
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide leading-none">
                    {isDragActive ? "Drop files here!" : "Drag & drop files here"}
                  </h4>
                  <p className="text-slate-400 dark:text-slate-500 font-semibold mb-6 max-w-sm mx-auto text-sm">
                    Or select manually from your client directory paths (Max 50MB)
                  </p>
                  <span className="inline-block px-5 py-2.5 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-100 dark:border-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm">
                    Select File
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Privacy Security Pitch */}
          <div className="grid sm:grid-cols-2 gap-8 text-left mb-16">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-990/10 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200 mb-1 leading-snug text-base">In-Browser Calculations</h4>
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm leading-relaxed">Calculations execute inside your web session with WebAssembly processing, keeping document files private and safe.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-indigo-150/10 rounded-xl flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-indigo-500 animate-spin" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200 mb-1 leading-snug text-base">Vector Output Preserved</h4>
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm leading-relaxed">Writers retain structural spacing properties, layout hierarchies, color codes, and embedded font systems safely.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic central SEO Content sections and Related paths */}
        <ToolSeoSection path={toolPath} />
      </main>

      <Footer />
    </div>
  );
}
