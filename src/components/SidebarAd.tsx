import { useMemo } from 'react';

interface SidebarAdProps {
  variant?: 'sidebar' | 'tablet-footer';
}

export default function SidebarAd({ variant = 'sidebar' }: SidebarAdProps) {
  const adHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <base href="https://www.highperformanceformat.com/" target="_blank">
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
            'key' : 'e958e3f35dda1ac4876877eb26ae7599',
            'format' : 'iframe',
            'height' : 600,
            'width' : 160,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/e958e3f35dda1ac4876877eb26ae7599/invoke.js"></script>
      </body>
    </html>
  `, []);

  if (variant === 'tablet-footer') {
    return (
      <div className="hidden md:block lg:hidden w-full max-w-[728px] mx-auto text-center px-4 my-10">
        <div className="inline-flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center block pt-1">
            SPONSORED ADVERTISEMENT
          </span>
          <div 
            className="w-[160px] h-[600px] bg-slate-50 dark:bg-slate-950/40 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ contentVisibility: 'auto' }}
          >
            <iframe
              srcDoc={adHtml}
              title="Advertisement"
              className="w-[160px] h-[600px] border-none overflow-hidden"
              scrolling="no"
            />
          </div>
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
          className="w-[160px] h-[600px] bg-slate-50 dark:bg-slate-950/40 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-350"
          style={{ contentVisibility: 'auto' }}
        >
          <iframe
            srcDoc={adHtml}
            title="Advertisement"
            className="w-[160px] h-[600px] border-none overflow-hidden"
            scrolling="no"
          />
        </div>
      </div>
    </aside>
  );
}


