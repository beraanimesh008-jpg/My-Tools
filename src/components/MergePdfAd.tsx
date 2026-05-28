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
            <script type="text/javascript">
              window.atOptions = {
                'key' : '039113a8207cf33c3c8bcf1ef460ab51',
                'format' : 'iframe',
                'height' : 250,
                'width' : 300,
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="https://www.highperformanceformat.com/039113a8207cf33c3c8bcf1ef460ab51/invoke.js"></script>
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
        className="w-[300px] min-h-[250px] flex justify-center items-center bg-transparent relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/40"
        style={{ contentVisibility: 'auto' }}
      >
        <div className="w-[300px] h-[250px] flex justify-center items-center origin-center transition-all duration-300">
          <iframe
            ref={iframeRef}
            title="Sponsor Advertisement"
            className="w-[300px] h-[250px] border-none overflow-hidden"
            scrolling="no"
          />
        </div>
      </div>
    </section>
  );
}
