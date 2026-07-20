export function socialLinks(site) {
  const configured = Array.isArray(site?.socials) ? site.socials : [];
  const links = configured
    .map((item) => ({
      label: String(item?.label || '').trim(),
      handle: String(item?.handle || '').trim(),
      url: String(item?.url || '').trim()
    }))
    .filter((item) => item.label && item.url);

  if (links.length > 0 || !site?.instagramUrl) return links;

  return [
    {
      label: 'Instagram',
      handle: String(site.instagram || '').trim(),
      url: site.instagramUrl
    }
  ];
}
