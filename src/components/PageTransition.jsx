import { Routes, Route } from 'react-router-dom';
import { usePageTransition } from '../hooks/usePageTransition.js';
import HomePage from '../pages/HomePage.jsx';
import WorkPage from '../pages/WorkPage.jsx';
import ProjectPage from '../pages/ProjectPage.jsx';
import AboutPage from '../pages/AboutPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import './PageTransition.css';

/**
 * Renders the routes plus the full-screen "shade". On navigation the shade
 * slides down over the old page, the routes swap underneath, then it lifts
 * away to reveal the new page. Timings/easing live in PageTransition.css.
 */
export default function PageTransition({ lenisRef }) {
  const { displayedLocation, stage, handleShadeTransitionEnd } = usePageTransition(lenisRef);

  return (
    <>
      <main className="main">
        <Routes location={displayedLocation}>
          <Route path="/" element={<HomePage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/project/:slug" element={<ProjectPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <div
        className={`page-shade${stage === 'idle' ? '' : ` is-${stage}`}`}
        onTransitionEnd={handleShadeTransitionEnd}
        aria-hidden="true"
      />
    </>
  );
}
