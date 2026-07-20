import { useContent } from '../hooks/useContent.js';
import './Footer.css';

export default function Footer() {
  const { site } = useContent();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <span>
        © {year} {site?.name}
      </span>
      {site?.instagramUrl ? (
        <a href={site.instagramUrl} target="_blank" rel="noreferrer">
          {site.instagram}
        </a>
      ) : (
        <span>{site?.instagram}</span>
      )}
    </footer>
  );
}
