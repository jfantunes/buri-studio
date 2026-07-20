import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads every JSON file from the private `data/` folder and merges them into
 * the single content object the app renders from (window.__CONTENT__).
 */
export function loadContent(root) {
  const dir = path.join(root, 'data');
  const read = (file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const project = read('project.json');
  return {
    site: read('site.json'),
    homepage: read('homepage.json'),
    work: read('work.json'),
    about: read('about.json'),
    contact: read('contact.json'),
    projects: project.projects ?? [],
    projectSeo: project.seo ?? {}
  };
}
