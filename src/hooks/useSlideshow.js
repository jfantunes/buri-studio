import { useEffect, useState } from 'react';

/** Cycles an index through `count` items every `intervalMs` (hero crossfade). */
export function useSlideshow(count, intervalMs = 5000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [count, intervalMs]);

  return index;
}
