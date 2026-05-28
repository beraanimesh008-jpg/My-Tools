import { useEffect, useRef } from 'react';

export default function MergePdfAd() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: transparent;
                overflow: hidden;
              }
            </style>
          </head>
          <body>
            <script type="text/javascript" src="https://pl29575317.effectivecpmnetwork.com/34/d2/d8/34d2d859c367374ea7a7e9aa4f617ea1.js" async></script>
          </body>
        </html>
      `);
      doc.close();
    } catch (err) {
      console.error('Error rendering Merge PDF ad iframe content:', err);
    }
  }, []);

  return (
    <section 
      className="w-full flex justify-center my-10 px-4 overflow-hidden select-none"
      id="merge-pdf-ad-section"
    >
      <div 
        className="w-[728px] min-h-[90px] flex justify-center items-center bg-transparent relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/40"
        style={{ contentVisibility: 'auto' }}
      >
        {/* Scale container on smaller viewports so 728px wide fits perfectly without overflow */}
        <div className="w-[728px] h-[90px] flex justify-center items-center origin-center scale-[0.45] xs:scale-[0.58] sm:scale-[0.84] md:scale-100 transition-all duration-300">
          <iframe
            ref={iframeRef}
            title="Sponsor Advertisement"
            className="w-[728px] h-[90px] border-none overflow-hidden"
            scrolling="no"
          />
        </div>
      </div>
    </section>
  );
}
