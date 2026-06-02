import { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import SEO from '@/src/components/SEO';
import { trackFileProcessed } from '@/src/utils/analytics';
import { QrCode, Download, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

export default function QrGenerator() {
  const [text, setText] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async () => {
    if (!text) return;
    setIsGenerating(true);
    try {
      const url = await QRCode.toDataURL(text, {
        width: 1000,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);

      // Track file processed
      trackFileProcessed(1);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#ffffff']
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setText('');
    setQrDataUrl(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <SEO 
        title="Free QR Code Generator - Create Custom QR Codes Online"
        description="Generate custom QR codes instantly for free. Create QR codes for URLs, text, Wi-Fi, or contact info. Fast, easy, and secure."
        path="/qr-gen"
      />
      
      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200"
          >
            <QrCode className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl font-black text-slate-800 dark:text-white mb-4">QR Code Generator</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl mx-auto">
            Convert any URL, text, or contact info into a high-quality QR code instantly.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">
                Enter Text or URL
              </label>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="https://example.com"
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-3xl py-6 px-8 text-xl font-medium focus:ring-4 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-slate-800 dark:text-white resize-none"
              />
            </div>

            <button
              onClick={generateQRCode}
              disabled={isGenerating || !text}
              className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl shadow-emerald-100 dark:shadow-none hover:bg-emerald-600 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:grayscale flex items-center justify-center gap-4"
            >
              {isGenerating ? <RefreshCw className="w-8 h-8 animate-spin" /> : <QrCode className="w-8 h-8" />}
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {qrDataUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex flex-col md:flex-row items-center gap-10"
            >
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[3rem] shadow-2xl border-4 border-emerald-100 dark:border-slate-700">
                <img src={qrDataUrl} alt="Generated QR Code" className="w-64 h-64 rounded-2xl" />
              </div>
              
              <div className="flex-1 space-y-4">
                <h3 className="text-3xl font-black text-slate-800 dark:text-white">Your QR is ready!</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Download your QR code as a high-resolution PNG file.</p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <a 
                    href={qrDataUrl} 
                    download="qrcode.png"
                    className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100 dark:shadow-none"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </a>
                  <button 
                    onClick={reset}
                    className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Start Over
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
