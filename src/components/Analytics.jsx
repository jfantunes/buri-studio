import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';

/**
 * Google Analytics (GA4). Enabled by setting analytics.gaMeasurementId in
 * data/site.json — when empty, nothing is injected and nothing is tracked.
 * Sends a page_view on every client-side route change (SPA navigation).
 */
export default function Analytics() {
  const { site } = useContent();
  const id = site?.analytics?.gaMeasurementId;
  const location = useLocation();

  useEffect(() => {
    if (!id || window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: false });
  }, [id]);

  useEffect(() => {
    if (!id || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href
    });
  }, [id, location]);

  return null;
}
