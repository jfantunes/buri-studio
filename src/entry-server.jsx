import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import { ContentProvider } from './context/ContentContext.jsx';

// Used by scripts/prerender.mjs to render each route to static HTML.
export function render(url, content) {
  const helmetContext = {};
  const html = renderToString(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <ContentProvider value={content}>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </ContentProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
  return { html, helmet: helmetContext.helmet };
}
