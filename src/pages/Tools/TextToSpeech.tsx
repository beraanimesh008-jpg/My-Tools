import { useState, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
import SEO from '@/src/components/SEO';
import { trackFileProcessed } from '@/src/utils/analytics';
import { Volume2, Play, Pause, RotateCcw, VolumeX, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const updateVoices = () => {
      setVoices(synth.getVoices());
    };
    
    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = () => {
    if (!text) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      trackFileProcessed(1);
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <SEO 
        title="Free AI Text to Speech Converter - Human-Like Voice Reader"
        description="Convert text to speech online for free. Realistic human-like AI voices read your files or notes instantly. Fast, natural, and secure."
        path="/tts"
      />
      
      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-200"
          >
            <Volume2 className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl font-black text-slate-800 dark:text-white mb-4">Text to Speech</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl mx-auto">
            Convert any text into a natural-sounding voiceover instantly using your browser's AI engine.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">
                Your Text
              </label>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste everything you want the AI to read..."
                rows={6}
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-3xl py-6 px-8 text-xl font-medium focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-slate-800 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
              <div className="space-y-6">
                <div>
                  <label className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rate (Speed): {rate}x</span>
                  </label>
                  <input 
                    type="range" min="0.5" max="2" step="0.1" value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
                <div>
                  <label className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pitch: {pitch}</span>
                  </label>
                  <input 
                    type="range" min="0.5" max="2" step="0.1" value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Voice</label>
                <select 
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200"
                  onChange={(e) => setVoice(voices[parseInt(e.target.value)])}
                >
                  {voices.map((v, i) => (
                    <option key={i} value={i}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={isSpeaking ? stop : speak}
                disabled={!text}
                className={`flex-1 ${isSpeaking ? 'bg-rose-500 hover:bg-rose-600' : 'bg-purple-600 hover:bg-purple-700'} text-white py-6 rounded-2xl font-black text-2xl shadow-xl transition-all flex items-center justify-center gap-4 disabled:grayscale`}
              >
                {isSpeaking ? <VolumeX className="w-8 h-8" /> : <Play className="w-8 h-8 fill-white" />}
                {isSpeaking ? 'Stop Speaking' : 'Start Professional Voiceover'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
