/**
 * Generators for the SEO files emitted at build time and served live in dev:
 * sitemap.xml, robots.txt, llms.txt and llms-full.txt.
 * Everything is derived from the content in `data/` — never edit the output by hand.
 */

function siteUrl(content) {
  return (content.site?.seo?.siteUrl || 'https://example.com').replace(/\/+$/, '');
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function imageSrc(image) {
  return typeof image === 'string' ? image : image?.src;
}

function socialLines(site) {
  const socials = Array.isArray(site?.socials) ? site.socials : [];
  return socials
    .filter((social) => social?.label && social?.url)
    .map((social) => `- ${social.label}: ${social.handle || social.url}`)
    .join('\n');
}

export function staticRoutes(content) {
  return ['/', '/work', '/about', '/contact', ...content.projects.map((p) => `/project/${p.slug}`)];
}

export function buildSitemap(content) {
  const base = siteUrl(content);
  const today = new Date().toISOString().slice(0, 10);
  const urls = staticRoutes(content)
    .map((route) => {
      const project = content.projects.find((p) => `/project/${p.slug}` === route);
      const cover = project ? imageSrc(project.images?.[0]) : null;
      const priority = route === '/' ? '1.0' : route === '/work' ? '0.9' : '0.7';
      return [
        '  <url>',
        `    <loc>${esc(base + route)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>`,
        `    <priority>${priority}</priority>`,
        cover
          ? `    <image:image>\n      <image:loc>${esc(base + cover)}</image:loc>\n      <image:title>${esc(project.title)}</image:title>\n    </image:image>`
          : null,
        '  </url>'
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;
}

export function buildRobots(content) {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\nDisallow: /404\nDisallow: /404.html\n\nSitemap: ${siteUrl(content)}/sitemap.xml\n`;
}

export function buildLlms(content) {
  const { site, homepage } = content;
  const base = siteUrl(content);
  const projects = content.projects
    .map((p) => `- [${p.title}](${base}/project/${p.slug}): ${p.category} — ${p.location}, ${p.year}`)
    .join('\n');
  return `# ${site.name}\n\n> ${site.tagline}. ${homepage.intro || ''}\n\n## Work\n\n${projects}\n\n## Studio\n\n- [About](${base}/about)\n- [Contact](${base}/contact)\n- [Full content](${base}/llms-full.txt)\n`;
}

export function buildLlmsFull(content) {
  const { site, homepage, about, contact } = content;
  const base = siteUrl(content);
  const services = (about.services || []).map((s) => `- ${s}`).join('\n');
  const socials = socialLines(site);
  const projects = content.projects
    .map((p) =>
      [
        `### ${p.title}`,
        '',
        `- URL: ${base}/project/${p.slug}`,
        `- Category: ${p.category}`,
        `- Location: ${p.location}`,
        `- Year: ${p.year}`,
        '',
        p.description
      ].join('\n')
    )
    .join('\n\n');
  return [
    `# ${site.name}`,
    '',
    `> ${site.tagline}. ${homepage.intro || ''}`,
    '',
    '## About',
    '',
    about.bio || '',
    '',
    '## Services',
    '',
    services,
    '',
    '## Projects',
    '',
    projects,
    '',
    '## Contact',
    '',
    `- Location: ${contact.location}`,
    `- Email: ${contact.email}`,
    `- Phone: ${contact.phone}`,
    socials,
    `- Website: ${base}`,
    ''
  ].join('\n');
}
