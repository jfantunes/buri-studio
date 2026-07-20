import Seo from '../components/Seo.jsx';
import HeroSlideshow from '../components/HeroSlideshow.jsx';
import { useContent } from '../hooks/useContent.js';
import './HomePage.css';

export default function HomePage() {
  const { site, homepage, contact } = useContent();
  const base = (site?.seo?.siteUrl || '').replace(/\/+$/, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site?.name,
    description: homepage?.seo?.description || site?.seo?.defaultDescription,
    url: base || undefined,
    logo: base && site?.logo ? base + site.logo : undefined,
    email: contact?.email,
    telephone: contact?.phone,
    address: contact?.location,
    sameAs: site?.instagramUrl ? [site.instagramUrl] : undefined
  };

  return (
    <>
      <Seo title={homepage?.seo?.title} description={homepage?.seo?.description} path="/" jsonLd={jsonLd} />
      <section className="home" aria-label="Featured work">
        <HeroSlideshow slides={homepage?.hero?.slides ?? []} intervalMs={homepage?.hero?.intervalMs ?? 5000} />
      </section>
    </>
  );
}
