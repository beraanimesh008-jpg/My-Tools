import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Check, ShieldCheck, Lock, Sparkles, FolderLock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COMPRESS_PDF_FAQS = [
  {
    question: "How can I compress PDF without losing quality?",
    answer: "Our smart compression engine uses vector preserving technology to scale down embedded images and minify unused XML structures. Unlike basic compression websites that convert PDF pages into raster image snapshots, our engine preserves original vector fonts and lines so text remains crystal clear and printable."
  },
  {
    question: "Is this PDF compressor free?",
    answer: "Yes, 100% free! You can compress as many files as you like without daily limits, subscription popups, or registered accounts."
  },
  {
    question: "Are uploaded files secure?",
    answer: "Absolutely. All compression and decryption happen entirely within your local browser's memory sandbox. Your document payloads never touch a remote server, ensuring perfect confidential peace of mind."
  },
  {
    question: "What is the maximum PDF size?",
    answer: "Our system is optimized to process large PDF files (up to 500MB) smoothly in real-time. Speed depends on your local computer's processor since work is completed safe and secure client-side."
  },
  {
    question: "Does this tool work on mobile devices?",
    answer: "Yes, we designed the interface to be mobile-first and fully responsive. You can select, configure and download optimized files on any iPhone, iPad or Android device with absolute ease."
  }
];

export default function CompressPdfFaq() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="w-full mt-24">
      {/* Trust badging grids */}
      <section className="mb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150/80 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-450" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Secure Local Sandbox</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-normal">
            All compression and decryption operations run in-memory inside your local web browser. Your private PDFs never leave your laptop or phone.
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150/80 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="w-6 h-6 text-rose-600 dark:text-rose-450" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Automated Memory Wipe</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-normal">
            No registration, no emails, and no database queues. Temporary system caches are instantly garbage-collected the moment you complete your workflow.
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150/80 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mb-6">
            <FolderLock className="w-6 h-6 text-indigo-600 dark:text-indigo-405" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Uncompromised Vectors</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-normal">
            Unlike cheap compressors that flatten PDFs, our algorithm maps font coordinates and downsizes embeds, keeping text fully selectable and searchable.
          </p>
        </div>
      </section>

      {/* Accordion FAQ Area */}
      <section className="mb-24 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-550/10 px-3.5 py-1.5 rounded-full mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            Knowledge Base
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">
            Get transparent answers regarding core document optimization speeds, limits, and safety.
          </p>
        </div>

        <div className="space-y-4">
          {COMPRESS_PDF_FAQS.map((faq, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <div 
                key={i} 
                className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-colors"
                >
                  <span className="font-bold text-slate-900 dark:text-white text-base flex items-start gap-3">
                    <span className="text-rose-600 font-extrabold text-sm select-none">Q.</span>
                    {faq.question}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                  )}
                </button>
                
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 pl-11 text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-normal">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Internal Interlinking Directory Segment */}
      <section className="p-10 md:p-12 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-150/80 dark:border-slate-800/80 text-center shadow-inner mb-8">
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-md mb-4 tracking-wider">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Productivity Portal
        </span>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Expand Your Workflow Directory</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 max-w-lg mx-auto">
          Access other high-precision processing tools designed to speed up your office productivity completely free.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/merge-pdf" className="px-5 py-3 bg-white dark:bg-slate-800 text-slate-850 dark:text-white border border-slate-205 dark:border-slate-700/60 rounded-xl font-bold text-xs tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105 active:scale-95">
            Merge Multiple PDFs
          </Link>
          <Link to="/pdf-to-jpg" className="px-5 py-3 bg-white dark:bg-slate-800 text-slate-850 dark:text-white border border-slate-205 dark:border-slate-700/60 rounded-xl font-bold text-xs tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105 active:scale-95">
            Extract PDF to JPG
          </Link>
          <Link to="/jpg-to-pdf" className="px-5 py-3 bg-white dark:bg-slate-800 text-slate-850 dark:text-white border border-slate-205 dark:border-slate-700/60 rounded-xl font-bold text-xs tracking-wide shadow-sm hover:border-rose-400 dark:hover:border-rose-800 transition-all hover:scale-105 active:scale-95">
            Convert JPG to PDF
          </Link>
          <Link to="/background-remover" className="px-5 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs tracking-wide shadow-md shadow-rose-250 dark:shadow-none transition-all hover:scale-105 active:scale-95">
            Remove Background (AI)
          </Link>
        </div>
      </section>
    </div>
  );
}
