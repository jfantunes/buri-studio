import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadContent } from './scripts/content.mjs';
import { buildSitemap, buildRobots, buildLlms, buildLlmsFull } from './scripts/sitemap.mjs';

const GENERATED_ROUTES = {
  '/sitemap.xml': { type: 'application/xml; charset=utf-8', build: buildSitemap },
  '/robots.txt': { type: 'text/plain; charset=utf-8', build: buildRobots },
  '/llms.txt': { type: 'text/plain; charset=utf-8', build: buildLlms },
  '/llms-full.txt': { type: 'text/plain; charset=utf-8', build: buildLlmsFull }
};

function send(res, body, type) {
  res.statusCode = 200;
  res.setHeader('Content-Type', type);
  res.end(body);
}

/**
 * Wires the private `data/` folder into the app and generates the SEO files:
 * - dev: injects window.__CONTENT__ into index.html and serves sitemap/robots/llms live
 * - build: injects window.__CONTENT__ and emits sitemap/robots/llms into dist/
 */
function contentSeoPlugin() {
  let root = process.cwd();
  let isSsrBuild = false;
  return {
    name: 'buri-content-seo',
    configResolved(config) {
      root = config.root;
      isSsrBuild = Boolean(config.build.ssr);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        const route = GENERATED_ROUTES[url];
        if (!route) return next();
        return send(res, route.build(loadContent(root)), route.type);
      });
    },
    transformIndexHtml(_html, context) {
      if (isSsrBuild) return [];
      if (context?.filename && path.resolve(context.filename) !== path.join(root, 'index.html')) return [];
      if (!context?.filename && context?.path && context.path !== '/') return [];
      const json = JSON.stringify(loadContent(root)).replace(/</g, '\\u003c');
      return [
        {
          tag: 'script',
          children: `window.__CONTENT__ = ${json};`,
          injectTo: 'head-prepend'
        }
      ];
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(path.join(root, 'data') + path.sep)) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
      return undefined;
    },
    generateBundle() {
      if (isSsrBuild) return;
      const content = loadContent(root);
      for (const [route, { build }] of Object.entries(GENERATED_ROUTES)) {
        this.emitFile({ type: 'asset', fileName: route.slice(1), source: build(content) });
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), contentSeoPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(process.cwd(), 'index.html'),
        admin: path.resolve(process.cwd(), 'admin/index.html')
      }
    }
  },
  ssr: {
    // These packages are CommonJS-only; bundle them into the SSR build so
    // Node's ESM loader can consume them during prerendering.
    noExternal: ['react-helmet-async', 'react-router-dom', 'react-router', '@remix-run/router']
  }
});
