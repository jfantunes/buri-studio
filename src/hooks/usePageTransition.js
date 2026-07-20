import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const COVER_HOLD_MS = 450;
const FALLBACK_MS = 1700;

/**
 * Drives the "shade" page transition:
 *   idle → covering (shade slides down over the old page)
 *        → covered (swap route content + jump scroll to top + hold logo)
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
  const holdTimerRef = useRef(null);
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
    window.clearTimeout(holdTimerRef.current);
    pendingRef.current = location;
    setStage('covering');
  }, [location, scrollToTop]);

  const advance = useCallback(() => {
    if (stageRef.current === 'covering') {
      const next = pendingRef.current;
      pendingRef.current = null;
      if (next) setDisplayedLocation(next);
      scrollToTop();
      setStage('covered');
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

  useEffect(() => {
    if (stage !== 'covered') return undefined;
    holdTimerRef.current = window.setTimeout(() => setStage('revealing'), COVER_HOLD_MS);
    return () => window.clearTimeout(holdTimerRef.current);
  }, [stage]);

  // Safety net in case transitionend never fires (hidden tab, etc.).
  useEffect(() => {
    if (stage !== 'covering' && stage !== 'revealing') return undefined;
    const id = window.setTimeout(advance, FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [stage, advance]);

  return { displayedLocation, stage, handleShadeTransitionEnd };
}
