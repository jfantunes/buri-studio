import Seo from '../components/Seo.jsx';
import ResponsiveImage from '../components/ResponsiveImage.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useContent } from '../hooks/useContent.js';
import './AboutPage.css';

export default function AboutPage() {
  const { about } = useContent();
  const { t } = useLanguage();
  const portrait = about?.portrait;
  const portraitSrc = typeof portrait === 'string' ? portrait : portrait?.src;

  return (
    <>
      <Seo title={about?.seo?.title} description={about?.seo?.description} path="/about" image={portraitSrc} />
      <section className="about">
        <div className="about__grid">
          <div className="about__portrait">
            <ResponsiveImage image={portrait} sizes="(min-width: 900px) 380px, 100vw" />
          </div>
          <div>
            <h1 className="page-heading">{about?.heading || t('nav.about')}</h1>
            <p className="about__bio">{about?.bio}</p>
            <h2 className="about__services-heading">{about?.servicesHeading || t('about.services')}</h2>
            <div className="about__services">
              {(about?.services ?? []).map((service) => (
                <div key={service} className="about__service">
                  {service}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
