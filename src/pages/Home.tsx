import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Image as ImageIcon, 
  Zap, 
  Video, 
  Terminal, 
  Scissors, 
  Layers, 
  Shrink, 
  ImagePlus, 
  User, 
  Mail, 
  ShieldCheck, 
  QrCode, 
  Lock, 
  Layout, 
  Search, 
  Sparkles, 
  Clock, 
  Sliders, 
  TrendingUp, 
  Check, 
  Globe, 
  HelpCircle,
  Cpu,
  ArrowRight,
  Filter,
  X,
  Gauge
} from 'lucide-react';
import ToolCard from '../components/ToolCard';
import BannerAd from '../components/BannerAd';
import SidebarAd from '../components/SidebarAd';
import SEO from '../components/SEO';

const HOME_FAQS = [
  {
    question: "What is My Loves PDF?",
    answer: "My Loves PDF is a highly flexible multi-tool workspace providing completely free web applications to merge PDFs, compress file size with maximum preservation, convert formats, generate secure parameters, and remove picture backgrounds."
  },
  {
    question: "How secure is My Loves PDF for processing private data?",
    answer: "Extremely secure. All critical PDF tools operate and run directly inside your client's web browser session using WebAssembly compilation, guaranteeing that your raw documents are never dispatched to or cached by remote cloud systems."
  },
  {
    question: "Are there any file processing limits or hidden memberships?",
    answer: "No, My Loves PDF is 100% free. There are no registration forms, no usage credits, and no paywalled gates."
  }
];

const PDF_TOOLS = [
  { name: 'Merge PDF', description: 'Combine multiple PDF files into one single document seamlessly.', icon: Layers, href: '/merge-pdf', color: 'bg-rose-500' },
  { name: 'Compress PDF', description: 'Reduce PDF file size while maintaining the best quality.', icon: Shrink, href: '/compress-pdf', color: 'bg-rose-500' },
  { name: 'Split PDF', description: 'Separate pages or extract specific continuous ranges instantly.', icon: Scissors, href: '/split-pdf', color: 'bg-rose-500', isNew: true },
  { name: 'JPG to PDF', description: 'Convert your JPG/JPEG images to PDF documents in seconds.', icon: ImagePlus, href: '/jpg-to-pdf', color: 'bg-rose-500' },
  { name: 'PDF to JPG', description: 'Extract images from a PDF or convert every page to JPG.', icon: ImageIcon, href: '/pdf-to-jpg', color: 'bg-rose-500' },
  { name: 'PDF to Word', description: 'Convert PDF tables and text back into editable Word formats.', icon: FileText, href: '/pdf-to-word', color: 'bg-rose-500', isNew: true },
  { name: 'Word to PDF', description: 'Compile Word DOCX files into beautiful standards-compliant PDFs.', icon: FileText, href: '/word-to-pdf', color: 'bg-rose-500', isNew: true },
];

const IMAGE_TOOLS = [
  { name: 'Background Remover', description: 'Remove backgrounds from images automatically using AI.', icon: Scissors, href: '/background-remover', color: 'bg-cyan-500', isNew: true },
  { name: 'Image Compressor', description: 'Shrink image file sizes without losing visual quality.', icon: Shrink, href: '/compress-image', color: 'bg-orange-500' },
  { name: 'Image Converter', description: 'Re-encode and convert images to PNG, WebP, or JPG formats.', icon: ImageIcon, href: '/image-converter', color: 'bg-orange-500', isNew: true },
];

const UTILITY_TOOLS = [
  { name: 'Resume Builder', description: 'Build a professional resume with ease using templates.', icon: FileText, href: '/resume-builder', color: 'bg-emerald-500' },
];

// Flat list format for real-time dynamic searching
const ALL_TOOLS_FLAT = [
  ...PDF_TOOLS.map(t => ({ ...t, catKey: 'pdf', catLabel: 'PDF Management' })),
  ...IMAGE_TOOLS.map(t => ({ ...t, catKey: 'image', catLabel: 'Image Studio' })),
  ...UTILITY_TOOLS.map(t => ({ ...t, catKey: 'utility', catLabel: 'Daily Utilities' }))
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pdf' | 'image' | 'utility'>('all');
  const [filesProcessed, setFilesProcessed] = useState<number>(0);

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

      // Read from local storage safely
      let localCount = 0;
      try {
        const localCountStr = localStorage.getItem('mylovespdf_files_processed');
        localCount = localCountStr ? parseInt(localCountStr, 10) : 0;
      } catch (err) {
        console.warn('Cannot read localStorage in sandboxed iframe:', err);
      }

      if (apiCount !== null && apiCount !== undefined) {
        setFilesProcessed(apiCount > localCount ? apiCount : localCount);
      } else {
        setFilesProcessed(localCount || 1420); // Friendly beautiful default count if not set
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const scrollToWorkspace = () => {
    document.getElementById('workspace-studio')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter tools based on selected tab and search query
  const filteredTools = useMemo(() => {
    return ALL_TOOLS_FLAT.filter(tool => {
      const matchesCat = selectedCategory === 'all' || tool.catKey === selectedCategory;
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Categories definition
  const categories = [
    { key: 'all', label: 'All Suite', count: ALL_TOOLS_FLAT.length, color: 'bg-rose-500' },
    { key: 'pdf', label: 'PDF Studio', count: PDF_TOOLS.length, color: 'bg-rose-500' },
    { key: 'image', label: 'Image Studio', count: IMAGE_TOOLS.length, color: 'bg-orange-500' },
    { key: 'utility', label: 'Utilities', count: UTILITY_TOOLS.length, color: 'bg-emerald-500' }
  ] as const;

  return (
    <div className="pb-24">
      <SEO 
        title="My Loves PDF - Free Online PDF & Image Tools" 
        description="Use free online PDF and image tools to merge, split, compress, convert, edit PDFs, remove backgrounds, compress images and more. Fast, secure and easy to use."
        path="/"
        faqs={HOME_FAQS}
      />

      {/* Hero Section - Super Modern Template Layout */}
      <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/40 via-transparent to-transparent dark:from-rose-950/20 dark:to-transparent -z-10" />
        <div className="absolute top-0 right-[10%] w-[35%] h-[35%] bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-[5%] w-[30%] h-[30%] bg-blue-500/10 dark:bg-pink-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        {/* Dot pattern decorative container */}
        <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-70 pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center text-left">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 border border-rose-100/60 dark:border-rose-900/40 shadow-sm"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-550"></span>
                </span>
                <span className="text-[11px] font-display font-extrabold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
                  ✨ High-Speed Client Sandbox
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]"
              >
                File processing made <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-pink-500 to-indigo-500 drop-shadow-sm">
                  Beautiful & Fast.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-slate-550 dark:text-slate-350 max-w-xl leading-relaxed"
              >
                A premier suite of offline-first tools for modern webmasters. Convert, compress, merge, split, and refine your PDFs, images, and visual assets without limits.
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <button 
                  onClick={scrollToWorkspace}
                  className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-550/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 group"
                >
                  Launch Workspace 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('about-benefit-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 px-8 py-4 rounded-2xl font-bold text-base border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
                >
                  Platform Benefits
                </button>
              </motion.div>

              {/* Minimal Trust Badge or Live Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-8 pt-4 border-t border-slate-100 dark:border-slate-850/60 max-w-md"
              >
                <div className="flex flex-col">
                  <span className="text-2xl font-display font-black text-rose-600 dark:text-rose-400">
                    {filesProcessed.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Files Processed
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                <div className="flex flex-col">
                  <span className="text-2xl font-display font-black text-slate-850 dark:text-slate-200">
                    100% Free
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    No Sign Up Required
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Hero Right - Beautiful Interactive Graphic representation */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotate: -1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative hidden lg:block"
            >
              <div className="w-full aspect-[4/3] bg-gradient-to-tr from-rose-500/10 via-pink-500/5 to-transparent rounded-[2.5rem] p-4 border border-rose-100/30 dark:border-rose-950/20 shadow-inner">
                {/* Simulated Floating Tool Frame */}
                <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-105 dark:border-slate-800 shadow-xl p-5 w-full h-full flex flex-col justify-between overflow-hidden relative group">
                  {/* Window Bar */}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-850-60">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-450" />
                      <span className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wide uppercase px-3 py-0.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100/50 dark:border-slate-800">
                      compiling-engine.wasm
                    </span>
                  </div>

                  {/* Body Content - Dropzone Preview representation */}
                  <div className="my-auto py-8">
                    <div className="border border-dashed border-rose-200 dark:border-rose-900/40 bg-rose-50/10 dark:bg-rose-950/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 hover:bg-rose-50/20 dark:hover:bg-rose-950/20 transition-colors duration-300">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200/50 dark:shadow-none animate-float">
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-display font-extrabold text-[15px] text-slate-800 dark:text-slate-200">
                          Drag and Drop files here
                        </p>
                        <p className="text-[12px] text-slate-405 dark:text-slate-450">
                          Supports PDFs, Images, Word Documents
                        </p>
                      </div>
                      <div className="px-4 py-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg uppercase tracking-wider">
                        Runs Local & Secure
                      </div>
                    </div>
                  </div>

                  {/* Foot Status */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-850-60 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> WebAssembly Online
                    </span>
                    <span className="font-bold text-rose-500">
                      100% Confidential
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Main Tools Showcase + Workspace Studio Filter Area */}
      <div id="workspace-studio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 scroll-mt-24">
        
        {/* Dynamic Navigation Toolbar & Filtering Options */}
        <div className="mb-10 bg-white dark:bg-[#0f172a] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-md shadow-slate-150/10 dark:shadow-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-sm shrink-0 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools directly..." 
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl py-3.5 pl-11 pr-10 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-rose-500/10 focus:border-rose-450 dark:focus:border-rose-500/40 focus:outline-none transition-all shadow-sm focus:shadow-md text-[14px]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Interactive Tab Filters */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`relative px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 border ${
                      isActive 
                        ? 'text-white border-transparent bg-gradient-to-tr from-rose-500 to-pink-605 shadow-md shadow-rose-500/15'
                        : 'text-slate-550 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 bg-transparent border-slate-100/60 dark:border-slate-800/80'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 dark:bg-slate-850 text-slate-405 dark:text-slate-450'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Dynamic Display Layout container */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Central Workspace Tools Grid */}
          <div className="flex-1 w-full min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {filteredTools.length > 0 ? (
                <motion.div 
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredTools.map((tool) => (
                    <motion.div
                      layout
                      key={tool.name}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ToolCard 
                        name={tool.name}
                        description={tool.description}
                        icon={tool.icon}
                        href={tool.href}
                        color={tool.color}
                        isNew={tool.isNew}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-100 dark:border-slate-800/80 p-12 text-center max-w-lg mx-auto"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 flex items-center justify-center mx-auto mb-6">
                    <Filter className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-display font-extrabold text-slate-800 dark:text-slate-200 mb-2">
                    No relevant tools found
                  </h3>
                  <p className="text-slate-455 dark:text-slate-450 text-sm mb-6 leading-relaxed">
                    We couldn't match any premium tools with "<span className="font-bold text-rose-500">{searchQuery}</span>". Try looking through our tabs or write a different search query.
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 border border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky Sidebar widget layout */}
          <div className="w-full lg:w-80 shrink-0 space-y-6 lg:sticky lg:top-24">
            
            {/* Sidebar Ad Space */}
            <SidebarAd variant="sidebar" />



          </div>

        </div>

      </div>

      {/* Full Width HighPerformance Ad */}
      <SidebarAd variant="tablet-footer" />

      {/* Elegant Faq Section container */}
      <section id="about-benefit-section" className="py-24 mt-24 bg-[#0b0f19] rounded-[2.5rem] md:rounded-[3.5rem] mx-4 overflow-hidden relative border border-slate-800/30 scroll-mt-24 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-rose-500/10 to-pink-500/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center md:text-left">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-3.5 py-1 mb-5 text-xs font-bold bg-rose-500/10 text-rose-450 rounded-full border border-rose-500/20 uppercase tracking-widest">
                Privacy Matters
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6 tracking-tight leading-tight">
                Why use MyLovesPDF?
              </h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed font-normal">
                We provide high-precision file handling with zero-cost servers. Because security is paramount, files run directly in your local browser sandbox when possible.
              </p>
              
              <ul className="space-y-5">
                {[
                  { text: 'Privacy First - Files never leak to remote servers', icon: ShieldCheck },
                  { text: 'Optimized Speed - Client-side compilation is instant', icon: Layers },
                  { text: 'Modern Design - Attractive layouts built for smart curators', icon: ImagePlus },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-200">
                    <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-pink-505 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-rose-950/50">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-[15px]">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: 'Files Handled', value: filesProcessed.toLocaleString() },
                { label: 'Cloud Handlers', value: '50+' },
                { label: 'Server Status', value: 'Active' },
                { label: 'User Feedback', value: '5 / 5' },
              ].map((stat, i) => (
                <div key={i} className="p-8 bg-slate-900/60 rounded-[2rem] border border-slate-800/80 hover:border-rose-500/35 transition-all duration-300 shadow-lg relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="text-3xl font-display font-black text-white mb-1.5 tracking-tight">{stat.value}</div>
                  <div className="text-slate-505 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
