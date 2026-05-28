import { useEffect } from 'react';

export default function AdSenseBanner() {
  useEffect(() => {
    try {
      // 1. Inject the Google AdSense library script if not already added to the document
      const scriptId = 'adsense-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4026443598393506';
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.body.appendChild(script);
      }

      // 2. Initialize adsbygoogle array and push the banner
      const pushAd = () => {
        try {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        } catch (e) {
          console.debug('AdSense push error or script pending initialization:', e);
        }
      };

      // Delay slightly using a requestAnimationFrame to ensure the DOM node is fully mounted and active
      const id = requestAnimationFrame(() => {
        pushAd();
      });

      return () => cancelAnimationFrame(id);
    } catch (err) {
      console.warn('AdSense script injection error:', err);
    }
  }, []);

  return (
    <div 
      id="adsense-banner-container"
      className="mx-auto my-[40px] max-w-[1200px] w-full px-4 overflow-hidden rounded-[12px] bg-transparent text-center select-none"
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-4026443598393506"
        data-ad-slot="3377785023"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
