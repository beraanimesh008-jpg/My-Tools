import { Link } from 'react-router-dom';
import { Search, Menu, User, Moon, Sun, Cloud, Zap, Shield, FileText, Image as ImageIcon, Video, Grid } from 'lucide-react';
import { useState } from 'react';
import { useAuth, signInWithGoogle, logOut } from '@/src/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/75 dark:bg-[#0b0f19]/75 backdrop-blur-lg border-b border-rose-100/40 dark:border-slate-800/60 transition-colors duration-300 shadow-sm shadow-slate-100/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200/50 dark:shadow-none group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
              <Zap className="text-white w-6 h-6 fill-white/20 animate-float" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-pink-500 to-rose-500">
                MyLovesPDF
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase -mt-1 pl-0.5">
                Creative Studio
              </span>
            </div>
          </Link>
 
          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-sm mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search premium tools..." 
                className="w-full bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-full py-2 pl-11 pr-4 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 dark:focus:border-rose-500/40 focus:outline-none transition-all shadow-sm focus:shadow-md"
              />
            </div>
          </div>
 
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            <button 
              onClick={toggleDarkMode} 
              className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-rose-600 transition-all active:scale-95 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-5">
                <Link 
                  to="/dashboard" 
                  className="text-sm font-semibold text-slate-650 dark:text-slate-350 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center overflow-hidden border-2 border-rose-500 hover:scale-105 transition-transform">
                    {user.photoURL ? <img src={user.photoURL} alt="pfp" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-rose-600" />}
                  </button>
                  <div className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100/80 dark:border-slate-700/80 hidden group-hover:block py-2 animate-in fade-in slide-in-from-top-2 z-50">
                    <button onClick={logOut} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white px-6 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-md shadow-rose-200/40 dark:shadow-none hover:scale-[1.02] active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg text-slate-600">
              <Menu />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-t border-rose-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search tools..." 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/pdf" className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 font-medium">
                  <FileText className="w-5 h-5" /> PDF
                </Link>
                <Link to="/image" className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 text-orange-700 font-medium">
                  <ImageIcon className="w-5 h-5" /> Images
                </Link>
                <Link to="/ai" className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 text-purple-700 font-medium">
                  <Cloud className="w-5 h-5" /> AI
                </Link>
                <Link to="/social" className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700 font-medium">
                  <Video className="w-5 h-5" /> Social
                </Link>
              </div>
              {!user && (
                <button 
                  onClick={signInWithGoogle}
                  className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
