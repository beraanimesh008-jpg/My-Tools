import { useEffect, useRef } from 'react';

interface SidebarAdProps {
  variant?: 'sidebar' | 'tablet-footer';
}

export default function SidebarAd({ variant = 'sidebar' }: SidebarAdProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adContainerRef.current) return;

    // Clear any previous elements
    adContainerRef.current.innerHTML = '';

    // Create wrapper for script elements
    const adWrapper = document.createElement('div');
    adWrapper.className = 'w-[160px] h-[600px] flex items-center justify-center overflow-hidden mx-auto';

    // 1. Create options script
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.innerHTML = `
      atOptions = {
        'key' : 'e958e3f35dda1ac4876877eb26ae7599',
        'format' : 'iframe',
        'height' : 600,
        'width' : 160,
        'params' : {}
      };
    `;

    // 2. Create highperformanceformat invoke script
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = '//www.highperformanceformat.com/e958e3f35dda1ac4876877eb26ae7599/invoke.js';
    invokeScript.async = true;

    // Append script tags to wrapper
    adWrapper.appendChild(optionsScript);
    adWrapper.appendChild(invokeScript);

    adContainerRef.current.appendChild(adWrapper);

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (variant === 'tablet-footer') {
    return (
      <div className="hidden md:block lg:hidden w-full max-w-[728px] mx-auto text-center px-4 my-10">
        <div className="inline-flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center block pt-1">
            SPONSORED ADVERTISEMENT
          </span>
          <div 
            ref={adContainerRef} 
            className="w-[160px] h-[600px] bg-slate-50 dark:bg-slate-950/40 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ contentVisibility: 'auto' }}
          />
        </div>
      </div>
    );
  }

  return (
    <aside 
      className="hidden lg:block w-[180px] shrink-0 self-start sticky top-5"
      aria-label="Responsive Sidebar Advertisement"
    >
      <div className="w-full flex flex-col items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md shadow-slate-100 dark:shadow-none">
        {/* Ad Title/Label for clean layout look */}
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center block pt-1">
          SPONSORED
        </span>

        {/* 160x600 Ad Frame Container */}
        <div 
          ref={adContainerRef} 
          className="w-[160px] h-[600px] bg-slate-50 dark:bg-slate-950/40 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-350"
          style={{ contentVisibility: 'auto' }}
        />
      </div>
    </aside>
  );
}
