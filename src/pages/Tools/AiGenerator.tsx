import { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import { Zap, Sparkles, Loader2, Wand2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";

export default function AiGenerator() {
  const [topic, setTopic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    
    setIsProcessing(true);
    setResult(null);

    try {
      // Use GoogleGenAI from frontend as per skill guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a highly descriptive image prompt for an image generation tool like Midjourney based on this topic: ${topic}. Focus on lighting, style, composition, and mood.`
      });

      if (response && response.text) {
        setResult(response.text);
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#a78bfa', '#ffffff']
        });
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate AI prompt. Please ensure your Gemini API key is configured.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-200"
          >
            <Zap className="text-white w-10 h-10 fill-white" />
          </motion.div>
          <h1 className="text-5xl font-black text-slate-800 dark:text-white mb-4">AI Prompt Generator</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl mx-auto">
            Struggling to find the right words? Tell us what you want to see, and our AI will craft a perfectly descriptive prompt for Midjourney, DALL-E, or Stable Diffusion.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="relative mb-8">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. A futuristic cyberpunk city at neon night..."
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-6 px-8 text-xl font-medium focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-slate-800 dark:text-white"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Sparkles className="text-purple-400 w-6 h-6" />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isProcessing || !topic}
            className="w-full bg-purple-600 text-white py-6 rounded-2xl font-black text-2xl shadow-xl shadow-purple-200 dark:shadow-none hover:bg-purple-700 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:grayscale flex items-center justify-center gap-4"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                Crafting Prompt...
              </>
            ) : (
              <>
                <Wand2 className="w-8 h-8" />
                Generate Masterpiece Prompt
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 group"
            >
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-1 rounded-[2.5rem] shadow-2xl">
                <div className="bg-white dark:bg-slate-800 rounded-[2.3rem] p-10 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-4 py-1.5 rounded-full">
                      Optimized Prompt
                    </span>
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-2xl font-medium text-slate-800 dark:text-white leading-relaxed">
                    {result}
                  </p>
                  
                  {/* Decorative background */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600 opacity-5 rounded-full blur-3xl pointer-events-none" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
