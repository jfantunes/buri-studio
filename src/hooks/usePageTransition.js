import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const FALLBACK_MS = 900;

/**
 * Drives the "shade" page transition:
 *   idle → covering (shade slides down over the old page)
 *        → swap route content + jump scroll to top
 *        → revealing (shade lifts away over the new page) → idle
 *
 * Returns the location that should currently be rendered (the old page stays
 * mounted until the shade fully covers it) plus the stage for the shade CSS.
 */
export function usePageTransition(lenisRef) {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [stage, setStage] = useState('idle');
  const pendingRef = useRef(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  const scrollToTop = useCallback(() => {
    const lenis = lenisRef?.current;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [lenisRef]);

  const prevKeyRef = useRef(location.key);
  useEffect(() => {
    if (location.key === prevKeyRef.current) return;
    prevKeyRef.current = location.key;

    if (window.matchMedia(REDUCED_MOTION).matches) {
      pendingRef.current = null;
      setDisplayedLocation(location);
      setStage('idle');
      scrollToTop();
      return;
    }
    pendingRef.current = location;
    setStage('covering');
  }, [location, scrollToTop]);

  const advance = useCallback(() => {
    if (stageRef.current === 'covering') {
      const next = pendingRef.current;
      pendingRef.current = null;
      if (next) setDisplayedLocation(next);
      scrollToTop();
      setStage('revealing');
    } else if (stageRef.current === 'revealing') {
      setStage('idle');
    }
  }, [scrollToTop]);

  const handleShadeTransitionEnd = useCallback(
    (event) => {
      if (event.propertyName !== 'transform') return;
      advance();
    },
    [advance]
  );

  // Safety net in case transitionend never fires (hidden tab, etc.).
  useEffect(() => {
    if (stage === 'idle') return undefined;
    const id = window.setTimeout(advance, FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [stage, advance]);

  return { displayedLocation, stage, handleShadeTransitionEnd };
}
