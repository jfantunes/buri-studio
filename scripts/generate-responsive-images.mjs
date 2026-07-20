import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RESPONSIVE_WIDTHS = [480, 800, 1200, 1600, 2560, 3840];
const UPLOAD_PATTERN = /^\/images\/uploads\/(.+)-(2560|3840)\.webp$/;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const publicDir = path.join(root, 'public');

function collectUploadSources(value, acc = new Set()) {
  if (typeof value === 'string') {
    if (UPLOAD_PATTERN.test(value)) acc.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectUploadSources(item, acc));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectUploadSources(item, acc));
  }
  return acc;
}

function targetUrl(src, width) {
  return src.replace(/^\/images\/uploads\//, '/images/generated/uploads/').replace(/-(2560|3840)\.webp$/, `-${width}.webp`);
}

async function resizeSource(src) {
  const sourcePath = path.join(publicDir, src.replace(/^\/+/, ''));
  const metadata = await sharp(sourcePath).metadata();
  const sourceWidth = metadata.width || Number(src.match(UPLOAD_PATTERN)?.[2] || 0);
  const widths = RESPONSIVE_WIDTHS.filter((width) => width < sourceWidth);

  await Promise.all(
    widths.map(async (width) => {
      const outputUrl = targetUrl(src, width);
      const outputPath = path.join(publicDir, outputUrl.replace(/^\/+/, ''));
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await sharp(sourcePath).resize({ width, withoutEnlargement: true }).webp({ quality: 84 }).toFile(outputPath);
    })
  );

  return widths.length;
}

const uploads = new Set();
for (const file of await fs.readdir(dataDir)) {
  if (!file.endsWith('.json')) continue;
  const json = JSON.parse(await fs.readFile(path.join(dataDir, file), 'utf8'));
  collectUploadSources(json, uploads);
}

let generated = 0;
for (const src of uploads) {
  try {
    generated += await resizeSource(src);
  } catch (error) {
    console.warn(`Responsive images skipped for ${src}: ${error.message}`);
  }
}

console.log(`Responsive images: ${generated} generated from ${uploads.size} uploaded source(s).`);
