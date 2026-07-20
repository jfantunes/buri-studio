import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Generates labeled SVG placeholder images for every `/images/**.svg` path
 * referenced from the JSON files in `data/`. Existing files are never
 * overwritten, so once you drop in real photos they stay untouched.
 * Re-run any time you add new image paths to the JSON:
 *
 *   npm run generate:placeholders
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const publicDir = path.join(root, 'public');

const TONES = ['#e9e4d8', '#ddd6c5', '#d2cab5', '#c7bfa5', '#e2ddce'];

function hash(value) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function dimensionsFor(rel) {
  if (rel.includes('og-')) return [1200, 630];
  const match = rel.match(/-(\d+)\.svg$/);
  const w = match ? parseInt(match[1], 10) : 800;
  if (rel.includes('portrait')) return [Math.round(w * 0.75), w];
  if (rel.includes('/hero/')) return [w, Math.round((w * 9) / 16)];
  return [w, Math.round((w * 3) / 4)];
}

function labelFor(rel) {
  return path
    .basename(rel, '.svg')
    .replace(/[-_]+/g, ' ')
    .toUpperCase();
}

function placeholderSvg(rel) {
  const [w, h] = dimensionsFor(rel);
  const bg = TONES[hash(rel) % TONES.length];
  const fontSize = Math.max(12, Math.round(w / 42));
  const label = `${labelFor(rel)} · ${w}×${h}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `  <rect width="${w}" height="${h}" fill="${bg}"/>`,
    '  <defs>',
    '    <pattern id="p" width="36" height="36" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">',
    '      <rect width="18" height="36" fill="rgba(0,0,0,0.045)"/>',
    '    </pattern>',
    '  </defs>',
    `  <rect width="${w}" height="${h}" fill="url(#p)"/>`,
    `  <text x="${w / 2}" y="${h / 2}" font-family="monospace" font-size="${fontSize}" fill="rgba(0,0,0,0.38)" text-anchor="middle" dominant-baseline="middle">${label}</text>`,
    '</svg>',
    ''
  ].join('\n');
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="14" fill="#1a1912"/>
  <path d="M26,14 L26,66" fill="none" stroke="#faf9f6" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M26,16 C46,16 58,24 58,34 C58,44 46,40 26,40" fill="none" stroke="#faf9f6" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M26,40 C48,40 62,49 62,59 C62,67 48,66 26,66" fill="none" stroke="#faf9f6" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

function collectImagePaths(value, acc = new Set()) {
  if (typeof value === 'string') {
    if (value.startsWith('/images/') && value.endsWith('.svg')) acc.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectImagePaths(item, acc));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectImagePaths(item, acc));
  }
  return acc;
}

function writeIfMissing(rel, source) {
  const target = path.join(publicDir, rel.replace(/^\/+/, ''));
  if (fs.existsSync(target)) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
  return true;
}

const imagePaths = new Set();
for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
  const json = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  collectImagePaths(json, imagePaths);
}

let created = 0;
if (writeIfMissing('/images/logo.svg', LOGO_SVG)) created++;
for (const rel of imagePaths) {
  if (rel === '/images/logo.svg') continue;
  if (writeIfMissing(rel, placeholderSvg(rel))) created++;
}

console.log(`Placeholders: ${created} created, ${imagePaths.size + 1 - created} already existed.`);
