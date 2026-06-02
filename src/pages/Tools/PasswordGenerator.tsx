import { useState, useCallback, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
import SEO from '@/src/components/SEO';
import { Lock, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let chars = lowercase;
    if (includeUppercase) chars += uppercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;
    
    let generatedPassword = '';
    for (let i = 0; i < length; i++) {
      generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generatedPassword);
  }, [length, includeUppercase, includeNumbers, includeSymbols]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    if (length < 8) return { label: 'Weak', color: 'bg-rose-500' };
    if (length < 12) return { label: 'Medium', color: 'bg-orange-500' };
    if (length < 16) return { label: 'Strong', color: 'bg-emerald-500' };
    return { label: 'Ultra Secure', color: 'bg-purple-600' };
  };

  const strength = getStrength();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <SEO 
        title="Secure Password Generator - Create Strong Random Passwords"
        description="Generate extremely strong, random, and secure passwords with custom lengths, symbols, and numbers. 100% private and secure."
        path="/password-gen"
      />
      
      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200"
          >
            <Lock className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl font-black text-slate-800 dark:text-white mb-4">Password Generator</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl mx-auto">
            Generate strong, secure, and random passwords instantly to keep your accounts safe.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-10 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <div className="relative group">
              <input 
                type="text" 
                readOnly
                value={password}
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-6 px-8 text-3xl font-mono font-bold text-center text-slate-800 dark:text-white mb-4"
              />
              <div className="flex justify-center gap-3">
                <button 
                  onClick={copyToClipboard}
                  className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button 
                  onClick={generatePassword}
                  className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  Regenerate
                </button>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-widest">
                Strength: <span className={`${strength.color} text-white px-3 py-1 rounded-full text-xs transition-colors`}>{strength.label}</span>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider text-sm">Password Length: {length}</label>
              </div>
              <input 
                type="range" 
                min="8" 
                max="64" 
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>8 Characters</span>
                <span>64 Characters</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Uppercase', state: includeUppercase, setState: setIncludeUppercase },
                { label: 'Numbers', state: includeNumbers, setState: setIncludeNumbers },
                { label: 'Symbols', state: includeSymbols, setState: setIncludeSymbols },
              ].map((opt, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={opt.state}
                      onChange={(e) => opt.setState(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-14 h-8 rounded-full transition-colors ${opt.state ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform ${opt.state ? 'translate-x-6' : ''}`} />
                  </div>
                  <span className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-emerald-500 transition-colors uppercase text-sm tracking-wide">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-6">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck className="text-emerald-500 w-7 h-7" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Why generated passwords are safer?</h4>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Randomly generated passwords are impossible to guess using social engineering or dictionary attacks. We recommend using at least 16 characters with symbols and numbers for maximum security.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
