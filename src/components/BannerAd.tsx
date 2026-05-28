import { useEffect, useRef } from 'react';

export default function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content to prevent duplication
    containerRef.current.innerHTML = '';

    // Create container for the actual script-injected ad
    const adWrapper = document.createElement('div');
    adWrapper.id = 'highperformanceformat-ad';
    adWrapper.className = 'flex justify-center items-center w-full min-h-[90px] overflow-hidden';

    // 1. Create and inject atOptions script configuration
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.innerHTML = `
      atOptions = {
        'key' : '43a804b3deaebef6546aed45e59327df',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    // 2. Create the script execution tag
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = '//www.highperformanceformat.com/43a804b3deaebef6546aed45e59327df/invoke.js';
    invokeScript.async = true;

    // Append both under the wrapper
    adWrapper.appendChild(configScript);
    adWrapper.appendChild(invokeScript);

    containerRef.current.appendChild(adWrapper);

    // Cleanup resources on component destruction
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      className="w-full flex justify-center items-center my-[40px] px-4 overflow-hidden"
      id="responsive-banner-ad-root"
    >
      <div 
        className="w-full max-w-[728px] min-h-[90px] flex justify-center items-center bg-transparent relative overflow-hidden rounded-[12px]"
        style={{ contentVisibility: 'auto' }}
      >
        {/* Scale container on mobile so 728px width fits mobile screens without overflow */}
        <div 
          ref={containerRef}
          className="w-[728px] h-[90px] flex justify-center items-center origin-center scale-[0.45] xs:scale-[0.55] sm:scale-[0.8] md:scale-100 transition-all duration-300"
        />
      </div>
    </div>
  );
}
