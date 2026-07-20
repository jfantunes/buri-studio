import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');

const STANDARD_WIDTHS = [480, 800, 1600];
const HEADERS = {
  'User-Agent': 'BuriStudioPlaceholderFetcher/1.0 (local development)'
};

const assets = [
  {
    stem: '/images/hero/hero-1',
    title: 'Claremont Landscape Garden, autumn colours round the lake.jpg'
  },
  {
    stem: '/images/hero/hero-2',
    title: 'Tranquil Park Landscape with Chinese Architecture.jpg'
  },
  {
    stem: '/images/hero/hero-3',
    title: 'View from rooftop garden of Tokyu Plaza Harajuku.jpg'
  },
  {
    stem: '/images/hero/hero-4',
    title: 'Wetland boardwalk at Four Rivers Conservation Area in Vernon County, Missouri.jpg'
  },
  {
    stem: '/images/portrait',
    widths: [480, 800, 1200],
    title: 'Courtyard - Hirata Folk Art Museum - Takayama, Gifu, Japan - DSC06709.jpg'
  },
  {
    stem: '/images/projects/meridian-courtyard/cover',
    title: 'Private courtyard garden in Old Town Alexandria VA.jpg'
  },
  {
    stem: '/images/projects/meridian-courtyard/detail-1',
    title: 'Courtyard - Dr. Sun Yat-Sen Classical Chinese Garden - Vancouver, Canada - DSC09829.JPG'
  },
  {
    stem: '/images/projects/meridian-courtyard/detail-2',
    title: 'Four-seasons courtyard, Kongobuji, Koyasan, 2016.jpg'
  },
  {
    stem: '/images/projects/two-rivers-park/cover',
    title: 'Beaver Boardwalk and Maxwell Lake in Hinton, Alberta.jpg'
  },
  {
    stem: '/images/projects/two-rivers-park/detail-1',
    title: 'Scene boardwalk Salters Lake trail bay wetland Jones Lake SP ncwetlands AM (16).jpg'
  },
  {
    stem: '/images/projects/two-rivers-park/detail-2',
    title: 'Wetland boardwalk at Four Rivers Conservation Area in Vernon County, Missouri.jpg'
  },
  {
    stem: '/images/projects/two-rivers-park/detail-3',
    title: 'Aerial Photo of the Beaver Boardwalk in Hinton, Alberta, Canada.jpg'
  },
  {
    stem: '/images/projects/sable-ridge-garden/cover',
    title: 'Desert Botanical Garden - 52743214552.jpg'
  },
  {
    stem: '/images/projects/sable-ridge-garden/detail-1',
    title: 'Succulent Garden - Naples Botanical Garden - Naples, Florida - DSC09928.jpg'
  },
  {
    stem: '/images/projects/northlight-terrace/cover',
    title: 'View from rooftop garden of Tokyu Plaza Harajuku.jpg'
  },
  {
    stem: '/images/projects/northlight-terrace/detail-1',
    title: 'View from rooftop garden of Tokyu Plaza Harajuku 5.jpg'
  },
  {
    stem: '/images/projects/northlight-terrace/detail-2',
    title: 'View from rooftop garden of Tokyu Plaza Harajuku 10.jpg'
  },
  {
    stem: '/images/projects/aurora-wetlands/cover',
    title: 'Entrance lobby render.jpg'
  },
  {
    stem: '/images/projects/aurora-wetlands/detail-1',
    title: 'Entrance lobby view render in lumion.jpg'
  },
  {
    stem: '/images/projects/aurora-wetlands/detail-2',
    title: 'Entrance lobby perspective view.jpg'
  },
  {
    stem: '/images/projects/cedar-hollow-residence/cover',
    title: 'Entrance lobby design.jpg'
  },
  {
    stem: '/images/projects/cedar-hollow-residence/detail-1',
    title: 'Louis-Pierre Baltard - Projet de marche aux charbons. Site plan with landscape rendered.jpg',
    apiTitle: 'Louis-Pierre Baltard - Projet de marché aux charbons. Site plan with landscape rendered.jpg'
  }
];

async function imageInfo(title, width) {
  const params = new URLSearchParams({
    action: 'query',
    titles: `File:${title}`,
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: String(width),
    format: 'json',
    origin: '*'
  });
  let response;
  for (let attempt = 0; attempt < 6; attempt++) {
    response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: HEADERS });
    if (response.ok || response.status !== 429) break;
    await sleep(10000 * (attempt + 1));
  }
  if (!response.ok) throw new Error(`Commons API failed for ${title}: ${response.status}`);
  const json = await response.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`No image info for ${title}`);
  return { page, info };
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(url, file) {
  let response;
  for (let attempt = 0; attempt < 6; attempt++) {
    response = await fetch(url, { headers: HEADERS });
    if (response.ok || response.status !== 429) break;
    await sleep(10000 * (attempt + 1));
  }
  if (!response.ok) throw new Error(`Download failed for ${url}: ${response.status}`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(await response.arrayBuffer()));
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clean(value = '') {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const sources = ['# Image Sources', ''];

for (const asset of assets) {
  const widths = asset.widths ?? STANDARD_WIDTHS;
  const source = await imageInfo(asset.apiTitle ?? asset.title, widths[0]);

  for (const width of widths) {
    const target = path.join(publicDir, `${asset.stem}-${width}.jpg`.replace(/^\/+/, ''));
    if (await fileExists(target)) {
      console.log(`Skipped ${asset.stem}-${width}.jpg`);
      continue;
    }

    const { info } = await imageInfo(asset.apiTitle ?? asset.title, width);
    const url = info.thumburl ?? info.url;
    await download(url, target);
    console.log(`Downloaded ${asset.stem}-${width}.jpg`);
    await sleep(2000);
  }

  const metadata = source.info.extmetadata ?? {};
  sources.push(`- ${asset.stem}: ${asset.apiTitle ?? asset.title}`);
  sources.push(`  License: ${clean(metadata.LicenseShortName?.value || metadata.UsageTerms?.value) || 'See source page'}`);
  sources.push(`  Source: ${source.info.descriptionurl}`);
  sources.push('');
}

await fs.writeFile(path.join(publicDir, 'images', 'SOURCES.md'), `${sources.join('\n')}\n`);
