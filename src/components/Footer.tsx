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
    <footer className="bg-white dark:bg-slate-900 border-t border-rose-100 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & About */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Zap className="text-white w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-black text-rose-600">MyLovesPDF</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
              The world's most versatile multi-tool platform. We help creators, students, and professionals save time with precision tools.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600 transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 font-medium">
              <li><a href="#" className="hover:text-rose-600">About Us</a></li>
              <li><a href="#" className="hover:text-rose-600">Our Story</a></li>
              <li><a href="#" className="hover:text-rose-600">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-rose-600">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6">Popular Tools</h4>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 font-medium">
              <li><Link to="/merge-pdf" className="hover:text-rose-600">Merge PDF</Link></li>
              <li><Link to="/bg-remover" className="hover:text-rose-600">Background Remover</Link></li>
              <li><Link to="/ai-gen" className="hover:text-rose-600">AI Image Generator</Link></li>
              <li><Link to="/qr-gen" className="hover:text-rose-600">QR Code Generator</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6">Support</h4>
            <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <p className="text-rose-700 dark:text-rose-400 text-sm font-bold mb-4">Have questions? We're here to help!</p>
              <a href="mailto:support@mylovespdf.com" className="flex items-center gap-2 text-rose-600 font-black hover:underline">
                <Mail className="w-4 h-4" /> support@mylovespdf.com
              </a>
            </div>
          </div>
        </div>

        {/* Live Counter Aligned Bottom Center */}
        <div className="mt-12 py-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-4 md:px-6 md:py-3.5 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Online</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-100/50 dark:border-emerald-950">
                {visitorStats ? visitorStats.active : 1}
              </span>
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Hits</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg border border-indigo-100/50 dark:border-indigo-950">
                {visitorStats?.total !== undefined ? visitorStats.total.toLocaleString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
          <p className="text-slate-400 font-medium text-sm">
            © 2026 MyLovesPDF. Built with <Heart className="w-4 h-4 inline text-rose-500 fill-rose-500" /> for the internet.
          </p>
          <div className="flex gap-8">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-400 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
