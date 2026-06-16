import React, { useState, useEffect } from 'react';
import { Zap, Github, Twitter, Linkedin, Heart, Mail, Users, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAnalyticsPayloadClient } from '../utils/visitorTrackerClient';

export default function Footer() {
  const [visitorStats, setVisitorStats] = useState<{ total: number; active: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await fetchAnalyticsPayloadClient();
        setVisitorStats({
          total: data?.summary?.totalPageViews || 0,
          active: data?.activeLast15Mins || 1
        });
      } catch (e) {
        console.warn('Footer statistics load fallback:', e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-white dark:bg-[#0b0f19] border-t border-rose-100/40 dark:border-slate-800/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & About */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3.5 mb-6 group">
              <div className="w-9 h-9 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-md shadow-rose-200/40 dark:shadow-none">
                <Zap className="text-white w-5 h-5 fill-white/20 animate-pulse-subtle" />
              </div>
              <span className="text-xl font-display font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-400">MyLovesPDF</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 font-normal text-sm leading-relaxed mb-6">
              The world's most versatile multi-tool workspace. We empower creators, students, and professionals with secure and free conversion utility apps.
            </p>
            <div className="flex gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="p-2.5 bg-slate-50 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/20 rounded-xl text-slate-500 hover:text-rose-600 border border-slate-100 dark:border-slate-800 transition-colors">
                  <Icon className="w-4.5 h-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-slate-850 dark:text-slate-100 font-display font-bold text-sm uppercase tracking-wider mb-6">Company</h4>
            <ul className="space-y-3.5 text-[15px] text-slate-550 dark:text-slate-400 font-medium">
              <li><Link to="/blog" className="hover:text-rose-550 transition-colors">Our Blog</Link></li>
              <li><a href="#" className="hover:text-rose-550 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-rose-550 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Popular tools links */}
          <div>
            <h4 className="text-slate-850 dark:text-slate-100 font-display font-bold text-sm uppercase tracking-wider mb-6">Popular Tools</h4>
            <ul className="space-y-3.5 text-[15px] text-slate-550 dark:text-slate-400 font-medium">
              <li><Link to="/merge-pdf" className="hover:text-rose-500 transition-colors">Merge PDF</Link></li>
              <li><Link to="/background-remover" className="hover:text-rose-500 transition-colors">Background Remover</Link></li>
              <li><Link to="/tts" className="hover:text-rose-500 transition-colors">Text to Speech</Link></li>
              <li><Link to="/qr-gen" className="hover:text-rose-500 transition-colors">QR Code Generator</Link></li>
            </ul>
          </div>

          {/* Support block */}
          <div>
            <h4 className="text-slate-850 dark:text-slate-100 font-display font-bold text-sm uppercase tracking-wider mb-6">Support</h4>
            <div className="bg-gradient-to-tr from-rose-50/50 to-pink-50/20 dark:from-rose-950/10 dark:to-transparent p-6 rounded-2xl border border-rose-100/60 dark:border-rose-950/30 shadow-sm">
              <p className="text-rose-700 dark:text-rose-400 text-sm font-bold mb-4">Have questions? We're here to help!</p>
              <a href="mailto:support@mylovespdf.com" className="flex items-center gap-2 text-rose-600 dark:text-rose-450 font-bold text-sm hover:underline">
                <Mail className="w-4 h-4" /> support@mylovespdf.com
              </a>
            </div>
          </div>
        </div>

        {/* Live Counter Aligned Bottom Center */}
        <div className="mt-16 py-6 border-t border-slate-100 dark:border-slate-850/60 flex flex-col items-center justify-center">
          <div className="bg-slate-50 dark:bg-[#0c1221] border border-slate-100 dark:border-slate-850/80 rounded-2xl p-4 md:px-6 md:py-3.5 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              </div>
              <span className="text-xs font-display font-bold text-slate-400 uppercase tracking-wider">Live Online</span>
              <span className="text-sm font-black text-emerald-650 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-lg border border-emerald-200/30 dark:border-emerald-950">
                {visitorStats ? visitorStats.active : 1}
              </span>
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-indigo-550 dark:text-indigo-400" />
              <span className="text-xs font-display font-bold text-slate-400 uppercase tracking-wider">Total Hits</span>
              <span className="text-sm font-black text-indigo-650 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded-lg border border-indigo-200/30 dark:border-indigo-950">
                {visitorStats?.total !== undefined ? visitorStats.total.toLocaleString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-850/60 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
          <p className="text-slate-450 dark:text-slate-500 font-medium text-sm">
            © 2026 MyLovesPDF. Built with <Heart className="w-4 h-4 inline text-rose-500 fill-rose-500" /> for the internet.
          </p>
          <div className="flex gap-8">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-505 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 dark:border-emerald-500/10">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
