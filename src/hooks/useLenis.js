import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Owns the Lenis smooth-scroll instance for the whole app.
 * Returns a ref so other code (e.g. page transitions) can command it.
 * Client-only by construction — safe for prerendering.
 */
export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION).matches) return undefined;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
