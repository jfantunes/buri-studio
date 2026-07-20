import { Helmet } from 'react-helmet-async';
import { useContent } from '../hooks/useContent.js';

/**
 * Per-page SEO. Every page renders one of these; the tags are injected into
 * <head> at runtime and baked into the static HTML at build time.
 * All strings come from data/*.json — nothing is hardcoded here.
 */
export default function Seo({ title, description, path = '/', image, type = 'website', jsonLd }) {
  const { site } = useContent();
  const seo = site?.seo ?? {};
  const base = (seo.siteUrl || '').replace(/\/+$/, '');

  const fullTitle = title
    ? (seo.titleTemplate || '%s').replace('%s', title)
    : seo.defaultTitle || site?.name || '';
  const desc = description || seo.defaultDescription || '';
  const url = base + path;
  const ogImage = image || seo.ogImage;
  const absoluteImage = ogImage && base ? base + ogImage : ogImage;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {base && <link rel="canonical" href={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {base && <meta property="og:url" content={url} />}
      {absoluteImage && <meta property="og:image" content={absoluteImage} />}
      {site?.name && <meta property="og:site_name" content={site.name} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {absoluteImage && <meta name="twitter:image" content={absoluteImage} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
