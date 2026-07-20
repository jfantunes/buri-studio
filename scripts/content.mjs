import fs from 'node:fs';
import path from 'node:path';

const RESPONSIVE_WIDTHS = [480, 800, 1200, 1600, 2560, 3840];
const UPLOAD_PATTERN = /^\/images\/uploads\/(.+)-(2560|3840)\.webp$/;

function uploadedSrcset(src) {
  const match = typeof src === 'string' ? src.match(UPLOAD_PATTERN) : null;
  if (!match) return null;
  const sourceWidth = Number(match[2]);
  return Object.fromEntries(
    RESPONSIVE_WIDTHS.filter((width) => width <= sourceWidth).map((width) => [
      String(width),
      width === sourceWidth
        ? src
        : src.replace(/^\/images\/uploads\//, '/images/generated/uploads/').replace(/-(2560|3840)\.webp$/, `-${width}.webp`)
    ])
  );
}

function withResponsiveUploads(value) {
  if (Array.isArray(value)) return value.map((item) => withResponsiveUploads(item));
  if (!value || typeof value !== 'object') return value;

  const next = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withResponsiveUploads(item)]));
  const srcset = uploadedSrcset(next.src);
  return srcset ? { ...next, srcset } : next;
}

/**
 * Loads every JSON file from the private `data/` folder and merges them into
 * the single content object the app renders from (window.__CONTENT__).
 */
export function loadContent(root) {
  const dir = path.join(root, 'data');
  const read = (file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const project = read('project.json');
  const site = read('site.json');
  // Canonical/OG/sitemap URLs follow the domain actually serving the site:
  // SITE_URL (explicit override) -> Netlify's automatic URL -> data/site.json.
  const siteUrl = process.env.SITE_URL || process.env.URL;
  if (siteUrl) site.seo = { ...site.seo, siteUrl };
  return withResponsiveUploads({
    site,
    homepage: read('homepage.json'),
    work: read('work.json'),
    about: read('about.json'),
    contact: read('contact.json'),
    projects: project.projects ?? [],
    projectSeo: project.seo ?? {}
  });
}
