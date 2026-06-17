import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MergePdf from './pages/Tools/MergePdf';
import CompressImage from './pages/Tools/CompressImage';
import JpgToPdf from './pages/Tools/JpgToPdf';
import ResumeBuilder from './pages/Tools/ResumeBuilder';
import CompressPdf from './pages/Tools/CompressPdf';
import PdfToJpg from './pages/Tools/PdfToJpg';
import BackgroundRemover from './pages/Tools/BackgroundRemover';
import GenericToolTemplate from './pages/Tools/GenericToolTemplate';
import BlogIndex from './pages/Blog/BlogIndex';
import BlogPost from './pages/Blog/BlogPost';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';

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
  // Cleanup pre-rendered SEO content element to keep DOM pristine for the client session
  useEffect(() => {
    // Safely remove any static header tags injected for crawlers before SPA hydrates/mounts
    try {
      const prerenderedTags = document.querySelectorAll('[data-prerendered="true"]');
      prerenderedTags.forEach(el => el.remove());
    } catch (e) {
      console.warn("Failed to clean pre-rendered header tags:", e);
    }

    const el = document.getElementById('prerendered-seo-content');
    if (el) {
      el.remove();
    }
  }, []);

  return (
    <BrowserRouter>
      {/* Automatically restore scroll position to top on navigation */}
      <ScrollToTop />
      
      <Routes>
        <Route path="/" element={<AppLayout><Navbar /><Home /></AppLayout>} />
        {/* PDF Tools */}
        <Route path="/merge-pdf" element={<MergePdf />} />
        <Route path="/compress-image" element={<CompressImage />} />
        <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
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
        
        {/* Placeholder for other tools to avoid 404s in demo */}
        <Route path="*" element={<AppLayout><Navbar /><Home /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
