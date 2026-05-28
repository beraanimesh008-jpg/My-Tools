import { useEffect, useRef } from 'react';

export default function BannerAd() {
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
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }
            </style>
          </head>
          <body>
            <script type="text/javascript">
              window.atOptions = {
                'key' : '43a804b3deaebef6546aed45e59327df',
                'format' : 'iframe',
                'height' : 90,
                'width' : 728,
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="https://www.highperformanceformat.com/43a804b3deaebef6546aed45e59327df/invoke.js"></script>
          </body>
        </html>
      `);
      doc.close();
    } catch (err) {
      console.error('Error rendering ad iframe content:', err);
    }
  }, []);

  return (
    <section 
      className="top-banner-ad w-full flex justify-center my-[40px] px-4 overflow-hidden select-none"
      id="responsive-banner-ad-root"
    >
      <div 
        className="banner-ad-container w-[728px] min-h-[90px] flex justify-center items-center bg-transparent relative overflow-hidden rounded-[16px] border border-slate-100 dark:border-slate-800/40"
        style={{ contentVisibility: 'auto' }}
      >
        {/* Scale container on smaller viewports so 728px width fits elegantly and responsively */}
        <div 
          className="w-[728px] h-[90px] flex justify-center items-center origin-center scale-[0.42] xs:scale-[0.56] sm:scale-[0.82] md:scale-100 transition-all duration-300"
        >
          <iframe
            ref={iframeRef}
            title="Advertisement"
            className="w-[728px] h-[90px] border-none overflow-hidden"
            scrolling="no"
          />
        </div>
      </div>
    </section>
  );
}

