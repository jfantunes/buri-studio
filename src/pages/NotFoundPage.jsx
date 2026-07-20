import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" />
      <section className="not-found">
        <h1 className="page-heading">404</h1>
        <p>
          This page doesn&apos;t exist. <Link to="/">Back to home</Link>
        </p>
      </section>
    </>
  );
}
