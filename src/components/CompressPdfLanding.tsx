import { Sparkles, Shield, Zap, Sliders, FolderClosed, Gauge } from 'lucide-react';

export default function CompressPdfLanding() {
  return (
    <div className="w-full mt-24 space-y-16">
      {/* Dynamic Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white border border-slate-150/80 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3 uppercase tracking-wider">Perfect Vector Preservation</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            We never rasterize pages or turn elements into blurry pictures. Text remains sharp, searchable, selectable and print-ready.
          </p>
        </div>

        <div className="p-8 bg-white border border-slate-150/80 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
            <Zap className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3 uppercase tracking-wider">Dynamic Slider Options</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Choose from Low, Medium, High, or AI Smart compression levels according to your distinct document density and size specifications.
          </p>
        </div>

        <div className="p-8 bg-white border border-slate-150/80 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
            <Sliders className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3 uppercase tracking-wider">Fully Secure Sandbox</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            No cloud storage pipelines. Operations take place completely client-side. Your private worksheets are protected inside browser memory.
          </p>
        </div>
      </section>

      {/* Deep SEO Article */}
      <section className="prose max-w-4xl mx-auto border-t border-slate-100 pt-16 font-sans">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">
          Advanced PDF Compression Techniques with Perfect Quality
        </h2>
        <p className="text-slate-650 text-base leading-relaxed mb-6">
          Managing large document collections is a critical workflow block in modern offices. High-resolution scans, embedded graphics, and unminified XML profiles can inflate PDF payloads from kilobytes to hundreds of megabytes. While traditional encoders crush document elements into flat, unreadable bitmap layers, our <strong>Smart client-side compressor</strong> employs multi-dimensional stream optimization.
        </p>

        <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <FolderClosed className="w-5 h-5 text-rose-600" />
          1. Dynamic Image Rescaling & Stream Recalibration
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Up to 90% of a PDF's size is represented by embedded image assets. Our pipeline crawls the indirect object arrays inside the document context of your file. When it matches stream filters like <code>/DCTDecode</code>, it optimizes raw bytes to matched target DPI metrics (varying from 300 DPI for high-retina layouts down to 90 DPI for fast web previews) using safe canvas-side re-interpolation.
        </p>

        <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-rose-600" />
          2. Preserving Text Layers and Fonts
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Other basic online compressors flatten interactive PDF pages, reducing searchability. Our client engine strictly maps original vector content, embedded font programs, and coordinate matrix operators. By validating compiled operator lists page-by-page, our tool ensures that text characters remain fully selectable, searchable, clear, and print-ready.
        </p>

        <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-600" />
          3. Ironclad Secure Session Architecture
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          In an era where remote databases are subject to recurrent leak vulnerabilities, our client-only secure sandbox provides complete document privacy. No file bytes or passwords travel through remote servers. Entire files are loaded, analyzed, unlocked, compressed, and downloaded directly inside the secure memory buffer of your web browser, ensuring HIPAA and GDPR compliance automatically.
        </p>
      </section>
    </div>
  );
}
