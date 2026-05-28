import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function VisitorTrackerTrigger() {
  const location = useLocation();

  useEffect(() => {
    // Retrieve or initialize session token to prevent refresh double-counting
    let sessionToken = sessionStorage.getItem('visitor_session_token');
    if (!sessionToken) {
      sessionToken = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('visitor_session_token', sessionToken);
    }

    const trackPageview = async () => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: location.pathname,
            sessionToken,
            referrer: document.referrer || '',
            screenResolution: `${window.screen.width}x${window.screen.height}`,
          }),
        });
      } catch (err) {
        console.warn('Silent tracking ingestion error:', err);
      }
    };

    trackPageview();
  }, [location.pathname]);

  // This is a pure functional tracker wrapper, renders nothing
  return null;
}
