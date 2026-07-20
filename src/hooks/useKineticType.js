import { useEffect, useRef } from 'react';

const RADIUS = 260; // pointer influence radius (px)
const STRENGTH = 28; // max displacement (px)
const TILT = 0.18; // rotation per px of displacement
const EASE = 0.12; // lerp factor per frame

/**
 * Kinetic type: digits are gently repelled by the pointer and ease back home.
 * Mutates transforms directly (no re-renders). Disabled on touch devices and
 * when the user prefers reduced motion. Attach the returned ref to the
 * container; children marked with `data-kinetic` become reactive.
 */
export function useKineticType() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const digits = Array.from(container.querySelectorAll('[data-kinetic]'));
    const state = digits.map(() => ({ x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0 }));
    let raf = null;

    const tick = () => {
      let settled = true;
      digits.forEach((el, i) => {
        const s = state[i];
        s.x += (s.tx - s.x) * EASE;
        s.y += (s.ty - s.y) * EASE;
        s.r += (s.tr - s.r) * EASE;
        if (Math.abs(s.tx - s.x) > 0.05 || Math.abs(s.ty - s.y) > 0.05 || Math.abs(s.tr - s.r) > 0.05) {
          settled = false;
        }
        el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.r}deg)`;
      });
      raf = settled ? null : requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      digits.forEach((el, i) => {
        const s = state[i];
        // The rect includes the current transform, so subtract it to recover
        // the digit's resting center — keeps measurements free of feedback.
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2 - s.x);
        const dy = event.clientY - (rect.top + rect.height / 2 - s.y);
        const dist = Math.hypot(dx, dy);
        if (dist > 1 && dist < RADIUS) {
          const force = (1 - dist / RADIUS) * STRENGTH;
          s.tx = (-dx / dist) * force;
          s.ty = (-dy / dist) * force;
          s.tr = (-dx / dist) * force * TILT;
        } else {
          s.tx = 0;
          s.ty = 0;
          s.tr = 0;
        }
      });
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return containerRef;
}
