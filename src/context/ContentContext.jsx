import { createContext } from 'react';

const ContentContext = createContext(null);

/**
 * Content always comes from window.__CONTENT__ — injected by the Vite plugin
 * in dev and baked into every prerendered page at build time. The server
 * entry passes it explicitly via the `value` prop. Nothing is fetched at
 * runtime, so prerendered markup and client hydration always match.
 */
export function ContentProvider({ value, children }) {
  const content = value ?? (typeof window !== 'undefined' ? window.__CONTENT__ : null) ?? {};
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export default ContentContext;
