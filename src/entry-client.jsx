import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import 'lenis/dist/lenis.css';
import './styles/variables.css';
import './styles/global.css';
import App from './App.jsx';
import { ContentProvider } from './context/ContentContext.jsx';

const rootEl = document.getElementById('root');

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <ContentProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ContentProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Pages prerendered at build time arrive with markup — hydrate them.
// In dev the root is empty, so mount normally.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
