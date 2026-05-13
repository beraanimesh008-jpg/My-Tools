import { Zap, Github, Twitter, Linkedin, Heart, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
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
              <span className="text-xl font-black text-rose-600">ToolVerse</span>
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
              <a href="mailto:support@toolverse.com" className="flex items-center gap-2 text-rose-600 font-black hover:underline">
                <Mail className="w-4 h-4" /> support@toolverse.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 font-medium text-sm">
            © 2026 ToolVerse. Built with <Heart className="w-4 h-4 inline text-rose-500 fill-rose-500" /> for the internet.
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
