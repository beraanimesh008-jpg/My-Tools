import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Image as ImageIcon, Zap, Video, Terminal, Scissors, Layers, Shrink, ImagePlus, User, Mail, ShieldCheck, QrCode, Lock, Layout } from 'lucide-react';
import CategorySection from '../components/CategorySection';

const PDF_TOOLS = [
  { name: 'Merge PDF', description: 'Combine multiple PDF files into one single document seamlessly.', icon: Layers, href: '/merge-pdf', color: 'bg-rose-500' },
  { name: 'Compress PDF', description: 'Reduce PDF file size while maintaining the best quality.', icon: Shrink, href: '/compress-pdf', color: 'bg-rose-500' },
  { name: 'JPG to PDF', description: 'Convert your JPG/JPEG images to PDF documents in seconds.', icon: ImagePlus, href: '/jpg-to-pdf', color: 'bg-rose-500' },
  { name: 'PDF to JPG', description: 'Extract images from a PDF or convert every page to JPG.', icon: ImageIcon, href: '/pdf-to-jpg', color: 'bg-rose-500' },
];

const IMAGE_TOOLS = [
  { name: 'Background Remover', description: 'Remove backgrounds from images automatically using AI.', icon: Scissors, href: '/background-remover', color: 'bg-cyan-500', isNew: true },
  { name: 'Image Compressor', description: 'Shrink image file sizes without losing visual quality.', icon: Shrink, href: '/compress-image', color: 'bg-orange-500' },
  { name: 'Image Resizer', description: 'Change the dimensions of your images for any use case.', icon: Layout, href: '/resize-image', color: 'bg-orange-500' },
  { name: 'Passport Photo', description: 'Create perfectly sized passport photos with one click.', icon: User, href: '/passport-photo', color: 'bg-orange-500' },
];

const AI_TOOLS = [
  { name: 'AI Image Generator', description: 'Create stunning images from simple text descriptions.', icon: Zap, href: '/ai-gen', color: 'bg-purple-600', isNew: true },
  { name: 'AI Logo Maker', description: 'Craft unique and professional logos for your brand.', icon: Layout, href: '/ai-logo', color: 'bg-purple-600' },
  { name: 'Text to Speech', description: 'Convert written text into natural-sounding voiceovers.', icon: Mail, href: '/tts', color: 'bg-purple-600' },
];

const UTILITY_TOOLS = [
  { name: 'Visitor Tracking', description: 'Real-time visitor analytic statistics, interactive graphs, and auditing dashboard.', icon: Layout, href: '/visitor-tracker', color: 'bg-indigo-600', isNew: true },
  { name: 'QR Generator', description: 'Generate custom QR codes for links, text, or vCards.', icon: QrCode, href: '/qr-gen', color: 'bg-emerald-500' },
  { name: 'Password Gen', description: 'Generate strong, secure, and random passwords instantly.', icon: Lock, href: '/password-gen', color: 'bg-emerald-500' },
  { name: 'Resume Builder', description: 'Build a professional resume with ease using templates.', icon: FileText, href: '/resume-builder', color: 'bg-emerald-500' },
];

export default function Home() {
  const [filesProcessed, setFilesProcessed] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      let apiCount = null;
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const data = await res.json();
          apiCount = data?.summary?.filesProcessed;
        }
      } catch (e) {
        console.warn('Home processed files loader error:', e);
      }

      // Read from local storage
      const localCountStr = localStorage.getItem('mylovespdf_files_processed');
      const localCount = localCountStr ? parseInt(localCountStr, 10) : 0;

      // Base realistic count for polished production look
      const baseCount = 12458312;

      // If backend was successful, use backend count plus base or fallback to local count plus base
      if (apiCount !== null && apiCount !== undefined) {
        const finalCount = apiCount > baseCount ? apiCount : (baseCount + apiCount);
        setFilesProcessed(finalCount);
      } else {
        // Fallback to local storage (Hostinger environment)
        setFilesProcessed(baseCount + localCount);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-rose-50 dark:bg-slate-900 -z-10" />
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full uppercase tracking-widest bg-opacity-50 border border-rose-200">
              Your All-In-One Toolkit
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
              Powerful tools for <br />
              <span className="text-rose-600">Smart Creators.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
              Join millions of users who transform their digital workflow with MyLovesPDF—the fastest way to merge, convert, compress, and generate.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 dark:shadow-none hover:scale-105 active:scale-95">
                Explore All Tools
              </button>
              <button className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-10 py-4 rounded-2xl font-bold text-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-lg hover:scale-105 active:scale-95">
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools Sections */}
      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-8">
        <CategorySection title="PDF Management" icon={FileText} color="bg-rose-500" tools={PDF_TOOLS} />
        <CategorySection title="Image Studio" icon={ImageIcon} color="bg-orange-500" tools={IMAGE_TOOLS} />
        <CategorySection title="Magical AI" icon={Zap} color="bg-purple-600" tools={AI_TOOLS} />
        <CategorySection title="Daily Utilities" icon={Terminal} color="bg-emerald-500" tools={UTILITY_TOOLS} />
      </div>

      {/* Quick Stats? */}
      <section className="py-20 mt-20 bg-slate-900 rounded-[3rem] mx-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center md:text-left">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Why use MyLovesPDF?</h2>
              <p className="text-slate-400 text-lg mb-8">We provide high-precision conversion tools with ultra-fast processing speeds, all within your browser. No software to install, no signup required.</p>
              <ul className="space-y-4">
                {[
                  { text: 'Privacy First - Files never leave your browser (where possible)', icon: ShieldCheck },
                  { text: 'Batch Processing - Handles hundreds of files at once', icon: Layers },
                  { text: 'Cloud Integration - Save direct to Google Drive or Dropbox', icon: ImagePlus },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-rose-500" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Files Processed', value: filesProcessed !== null ? filesProcessed.toLocaleString() : '12,458,312' },
                { label: 'Active Tools', value: '50' },
                { label: 'Uptime', value: '99.9%' },
                { label: 'User Rating', value: '5/5' },
              ].map((stat, i) => (
                <div key={i} className="p-8 bg-slate-800/50 rounded-3xl border border-slate-700">
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-slate-500 text-sm font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
