import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { useKineticType } from '../hooks/useKineticType.js';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const titleRef = useKineticType();

  return (
    <>
      <Seo title="Page not found" />
      <section className="not-found">
        <p className="not-found__label">Page not found</p>
        <h1 ref={titleRef} className="not-found__title" aria-label="404">
          {['4', '0', '4'].map((digit, index) => (
            <span key={index} className="not-found__digit" style={{ '--i': index }} aria-hidden="true">
              <span className="not-found__digit-inner" data-kinetic>
                {digit}
              </span>
            </span>
          ))}
        </h1>
        <p className="not-found__text">You&apos;ve wandered off the path.</p>
        <Link className="not-found__back" to="/">
          ← Back to home
        </Link>
      </section>
    </>
  );
}
