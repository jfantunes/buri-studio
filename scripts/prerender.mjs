import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContent } from './content.mjs';

/**
 * Runs after `vite build` (client) and `vite build --ssr` (server bundle).
 * Renders every route to static HTML — full page content plus the per-page
 * SEO tags produced by each page's <Seo> component — and writes the result
 * into dist/, one index.html per route. Crawlers get complete pages;
 * visitors get a hydrated SPA.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const content = loadContent(root);

const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href);

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const routes = ['/', '/work', '/about', '/contact', ...content.projects.map((p) => `/project/${p.slug}`)];

for (const route of routes) {
  const { html, helmet } = render(route, content);

  const headTags = [helmet?.title?.toString(), helmet?.meta?.toString(), helmet?.link?.toString(), helmet?.script?.toString()]
    .filter(Boolean)
    .join('');

  const out = template
    // The template's fallback tags make room for the per-route ones.
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
    .replace('</head>', `${headTags}</head>`);

  const file = route === '/' ? 'index.html' : path.join(route.slice(1), 'index.html');
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, out);
  console.log(`prerendered ${route} -> ${path.relative(root, target)}`);
}

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
console.log(`Done — ${routes.length} routes prerendered.`);
