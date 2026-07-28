import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { socialLinks } from '../utils/socials.js';
import './Footer.css';

const FOOTER_LINKS = [
  ['/', 'nav.home'],
  ['/work', 'nav.work'],
  ['/about', 'nav.about'],
  ['/contact', 'nav.contact']
];

export default function Footer() {
  const { site } = useContent();
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const socials = socialLinks(site);

  return (
    <footer className="footer">
      <span>© {year} {site?.name}</span>
      <nav className="footer__nav" aria-label="Footer navigation">
        {FOOTER_LINKS.map(([to, label]) => <Link key={to} to={to}>{t(label)}</Link>)}
      </nav>
      {socials.length > 0 ? (
        <nav className="footer__socials" aria-label="Social links">
          {socials.map((social) => (
            <a key={social.url} href={social.url} target="_blank" rel="noreferrer">
              {social.handle || social.label}
            </a>
          ))}
        </nav>
      ) : null}
    </footer>
  );
}
