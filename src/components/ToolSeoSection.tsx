import { Link } from 'react-router-dom';
import { SEO_CONFIG } from '../utils/seoData';
import { HelpCircle, ChevronRight, CheckCircle2, Bookmark, ArrowUpRight } from 'lucide-react';

interface ToolSeoSectionProps {
  path: string;
}

export default function ToolSeoSection({ path }: ToolSeoSectionProps) {
  const config = SEO_CONFIG[path];

  if (!config) return null;

  return (
    <section className="mt-24 border-t border-slate-100 dark:border-slate-800/80 pt-20 pb-24 font-sans relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute top-0 left-12 w-96 h-96 bg-rose-500/5 dark:bg-rose-500/2 rounded-full blur-[100px] pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-0 right-12 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/2 rounded-full blur-[100px] pointer-events-none translate-x-1/2" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Breadcrumb Navigation Schema-compliant */}
        <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <Link to="/" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
          <span className="text-slate-600 dark:text-slate-300 pointer-events-none">{config.h1}</span>
        </nav>

        {/* H1 Heading and Introduction */}
        <div className="mb-14">
          <span className="inline-block px-3 py-1 bg-rose-100/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-extrabold uppercase tracking-widest rounded-full border border-rose-200/40 dark:border-rose-900/40 mb-4">
            Educational Document Hub
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-none">
            {config.h1}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {config.intro}
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {config.features.map((feature, idx) => (
            <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-100/80 dark:border-slate-800/60 rounded-3xl">
              <div className="w-8 h-8 bg-rose-500/10 dark:bg-rose-500/20 rounded-xl flex items-center justify-center mb-4 text-rose-500 font-extrabold text-sm">
                0{idx + 1}
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Long Educational SEO Content Block */}
        <div 
          className="prose prose-slate dark:prose-invert max-w-none mb-16 text-slate-600 dark:text-slate-300 font-medium leading-relaxed space-y-6
            prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight prose-headings:mt-10 prose-headings:mb-4
            prose-h2:text-3xl prose-h3:text-xl
            prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
            prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
            prose-li:marker:text-rose-500"
          dangerouslySetInnerHTML={{ __html: config.longSeoContent }}
        />

        {/* How It Works Visual Step Block */}
        <div className="bg-slate-50 dark:bg-slate-950/30 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/60 p-8 sm:p-10 mb-16">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">How It Works (Step-by-Step)</h2>
          <div className="space-y-8 relative">
            <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800/80" />
            {config.howItWorks.map((step, idx) => (
              <div key={idx} className="flex gap-6 items-start relative z-10 select-none">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 shadow-sm shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">{step.heading}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mb-20">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Key Operational Benefits</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {config.benefits.map((benefit, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-4 shrink-0" />
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive FAQ Grid */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <HelpCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 dark:text-slate-500 font-medium">Clear information regarding security standards, formats, and limits.</p>
          </div>
          <div className="grid gap-6">
            {config.faqs.map((faq, idx) => (
              <div key={idx} className="p-8 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-[2rem] hover:border-rose-100 dark:hover:border-rose-900/30 transition-colors">
                <span className="text-xs font-extrabold text-rose-500 uppercase tracking-widest mb-3 block flex items-center gap-1.5">
                  <Bookmark className="w-3 h-3 fill-rose-500" /> Question {idx + 1}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-snug">{faq.question}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800/40 pt-4 mt-2">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Interlinking Section */}
        <div className="p-10 bg-slate-50 dark:bg-slate-950/30 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/60">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight">Looking For Sibling Conversion Libraries?</h3>
          <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mb-8">Access our related lossless browser modules to merge, compress, protect, scan, or format documents safely.</p>
          <div className="flex flex-wrap gap-4">
            {config.relatedTools.map((tool, idx) => (
              <Link
                key={idx}
                to={tool.href}
                className="inline-flex items-center gap-1.5 px-5 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                {tool.name} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
