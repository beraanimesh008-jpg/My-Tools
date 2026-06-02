import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Disable browser's default scroll restoration behavior
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // 2. Perform a clean, smooth scroll to the top of the viewport.
    // We use a tiny timeout or requestAnimationFrame to ensure the DOM is painted 
    // and ready before routing changes scroll positions, working reliably on all devices.
    const handleScroll = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth' // Smooth scroll to top on navigation
      });
    };

    // Execute immediately on route change
    handleScroll();

    // Fallback/backup for infinite loaded content or heavy paint delays
    const timeoutId = setTimeout(handleScroll, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
