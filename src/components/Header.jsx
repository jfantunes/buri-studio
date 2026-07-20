import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import './Header.css';

export default function Header() {
  const { site } = useContent();
  const location = useLocation();

  if (location.pathname === '/') {
    return (
      <header className="header header--home">
        <div className="header__pill">
          <Link to="/" className="header__logo" aria-label={`${site?.name} — home`}>
            <img src={site?.logo} alt={`${site?.name} logo`} />
          </Link>
          <nav className="header__nav" aria-label="Main navigation">
            <NavLink to="/work">Work</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="header header--inner">
      <Link to="/" className="header__name">
        {site?.name}
      </Link>
    </header>
  );
}
