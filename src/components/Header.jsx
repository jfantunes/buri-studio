import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import './Header.css';

function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="header__language" role="group" aria-label={t('language.label')}>
      {['en', 'pt'].map((code) => (
        <button
          key={code}
          type="button"
          className={language === code ? 'is-active' : ''}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const { site } = useContent();
  const { t } = useLanguage();
  const location = useLocation();

  if (location.pathname === '/') {
    return (
      <header className="header header--home">
        <div className="header__pill">
          {site?.logo ? (
            <img className="header__logo" src={site.logo} alt={`${site.name} logo`} />
          ) : (
            <span className="header__brand">{site?.name}</span>
          )}
          <span className="header__dot" aria-hidden="true" />
          <nav className="header__nav" aria-label="Main navigation">
            <NavLink to="/work">{t('nav.work')}</NavLink>
            <NavLink to="/about">{t('nav.about')}</NavLink>
            <NavLink to="/contact">{t('nav.contact')}</NavLink>
          </nav>
        </div>
        <LanguageSwitch />
      </header>
    );
  }

  return (
    <header className="header header--inner">
      <Link to="/" className="header__name">
        {site?.name}
      </Link>
      <LanguageSwitch />
    </header>
  );
}
