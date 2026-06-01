import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MergePdf from './pages/Tools/MergePdf';
import CompressImage from './pages/Tools/CompressImage';
import AiGenerator from './pages/Tools/AiGenerator';
import QrGenerator from './pages/Tools/QrGenerator';
import PasswordGenerator from './pages/Tools/PasswordGenerator';
import JpgToPdf from './pages/Tools/JpgToPdf';
import TextToSpeech from './pages/Tools/TextToSpeech';
import ResumeBuilder from './pages/Tools/ResumeBuilder';
import CompressPdf from './pages/Tools/CompressPdf';
import PdfToJpg from './pages/Tools/PdfToJpg';
import BackgroundRemover from './pages/Tools/BackgroundRemover';
import GenericToolTemplate from './pages/Tools/GenericToolTemplate';
import BlogIndex from './pages/Blog/BlogIndex';
import BlogPost from './pages/Blog/BlogPost';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import VisitorTrackerTrigger from './components/VisitorTrackerTrigger';
import VisitorTracker from './pages/Tools/VisitorTracker';

// Functional Component to handle Layout wrapper if needed
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <div className="flex-1">
      {children}
    </div>
    <Footer />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      {/* Background tracking of routers */}
      <VisitorTrackerTrigger />
      
      <Routes>
        <Route path="/" element={<AppLayout><Navbar /><Home /></AppLayout>} />
        {/* PDF Tools */}
        <Route path="/merge-pdf" element={<MergePdf />} />
        <Route path="/compress-image" element={<CompressImage />} />
        <Route path="/ai-gen" element={<AiGenerator />} />
        <Route path="/qr-gen" element={<QrGenerator />} />
        <Route path="/password-gen" element={<PasswordGenerator />} />
        <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
        <Route path="/tts" element={<TextToSpeech />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="/compress-pdf" element={<CompressPdf />} />
        <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
        <Route path="/background-remover" element={<BackgroundRemover />} />

        {/* Custom New SEO Tools */}
        <Route path="/split-pdf" element={<GenericToolTemplate toolPath="/split-pdf" />} />
        <Route path="/pdf-to-word" element={<GenericToolTemplate toolPath="/pdf-to-word" />} />
        <Route path="/word-to-pdf" element={<GenericToolTemplate toolPath="/word-to-pdf" />} />
        <Route path="/image-converter" element={<GenericToolTemplate toolPath="/image-converter" />} />

        {/* Global SEO Blog System */}
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        
        {/* Analytics Visitor Tracker */}
        <Route path="/visitor-tracker" element={<VisitorTracker />} />
        
        {/* Placeholder for other tools to avoid 404s in demo */}
        <Route path="*" element={<AppLayout><Navbar /><Home /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
