import { useEffect } from 'react';

export function usePrefetch() {
  useEffect(() => {
    // Prefetch all main API endpoints in the background
    const prefetchEndpoints = async () => {
      const endpoints = [
        '/api/transactions',
        '/api/taxes',
        '/api/money-tips',
        '/api/user',
      ];

      // Stagger requests to avoid overwhelming the server
      for (let i = 0; i < endpoints.length; i++) {
        setTimeout(async () => {
          try {
            const response = await fetch(endpoints[i], {
              method: 'GET',
              headers: {
                'Cache-Control': 'max-age=3600',
              },
            });
            if (response.ok) {
              // Data is cached by browser automatically
              await response.json();
            }
          } catch (err) {
            // Silent fail - this is a background operation
            console.debug(`Prefetch ${endpoints[i]} failed:`, err);
          }
        }, i * 500); // 500ms delay between requests
      }
    };

    // Start prefetching after a short delay (after page load)
    const timer = setTimeout(prefetchEndpoints, 1000);

    return () => clearTimeout(timer);
  }, []);
}

// Browser prefetch helper for Link components
export const prefetchLink = (href: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
};
