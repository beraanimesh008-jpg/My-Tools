import { useMemo } from 'react';

export default function PdfToJpgAd() {
  const adHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <base href="https://pl29579017.effectivecpmnetwork.com/" target="_blank">
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
          #container-848ae6c97896079103bf48bae82fff46 {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        </style>
      </head>
      <body>
        <div id="container-848ae6c97896079103bf48bae82fff46"></div>
        <script async="async" data-cfasync="false" src="https://pl29579017.effectivecpmnetwork.com/848ae6c97896079103bf48bae82fff46/invoke.js"></script>
      </body>
    </html>
  `, []);

  return (
    <section 
      className="w-full flex justify-center my-8 px-4 overflow-hidden select-none"
      id="pdf-to-jpg-ad-section"
    >
      <div 
        className="w-full max-w-4xl min-h-[90px] flex justify-center items-center bg-transparent relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/40"
        style={{ contentVisibility: 'auto' }}
      >
        <iframe
          srcDoc={adHtml}
          title="Sponsor Advertisement"
          className="w-full min-h-[90px] sm:min-h-[120px] border-none overflow-hidden"
          scrolling="no"
        />
      </div>
    </section>
  );
}
