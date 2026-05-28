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
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-rose-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-400">MyLovesPDF</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search tools..." 
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-rose-600">Dashboard</Link>
                <div className="relative group">
                  <button className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden border-2 border-rose-500">
                    {user.photoURL ? <img src={user.photoURL} alt="pfp" /> : <User className="w-5 h-5 text-rose-600" />}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 hidden group-hover:block py-2 animate-in fade-in slide-in-from-top-1">
                    <button onClick={logOut} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="bg-rose-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
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
