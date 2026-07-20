/**
 * Renders an image from the JSON content. Accepts either a plain string path
 * or an object: { src, srcset: { "480": url, "800": url, ... }, alt }.
 * `sizes` should match the layout context so the browser picks the right file.
 */
export default function ResponsiveImage({ image, sizes, alt, className, loading = 'lazy', fetchPriority }) {
  const img = typeof image === 'string' ? { src: image } : image ?? {};
  const srcSet = img.srcset
    ? Object.entries(img.srcset)
        .map(([width, url]) => `${url} ${width}w`)
        .join(', ')
    : undefined;

  return (
    <img
      src={img.src}
      srcSet={srcSet}
      sizes={srcSet && sizes ? sizes : undefined}
      alt={alt ?? img.alt ?? ''}
      className={className}
      loading={loading}
      decoding="async"
      fetchpriority={fetchPriority}
    />
  );
}
