import { useEffect, useRef, useState } from 'react';
import Seo from '../components/Seo.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { useContent } from '../hooks/useContent.js';
import './WorkPage.css';

const FILTER_FADE_MS = 240;

export default function WorkPage() {
  const { work, projects } = useContent();
  const [filter, setFilter] = useState('All');
  const [visibleFilter, setVisibleFilter] = useState('All');
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef(null);

  const categories = [...new Set(projects.map((p) => p.category))];
  const tabs = ['All', ...categories];
  const visible = visibleFilter === 'All' ? projects : projects.filter((p) => p.category === visibleFilter);

  useEffect(() => {
    return () => {
      clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  function handleFilterChange(tab) {
    if (tab === filter) return;

    clearTimeout(fadeTimeoutRef.current);
    setFilter(tab);

    if (tab === visibleFilter) {
      setIsFading(false);
      return;
    }

    const shouldReduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (shouldReduceMotion) {
      setVisibleFilter(tab);
      setIsFading(false);
      return;
    }

    setIsFading(true);
    fadeTimeoutRef.current = setTimeout(() => {
      setVisibleFilter(tab);
      setIsFading(false);
    }, FILTER_FADE_MS);
  }

  return (
    <>
      <Seo title={work?.seo?.title} description={work?.seo?.description} path="/work" />
      <section className="work">
        <h1 className="page-heading">{work?.heading || 'Work'}</h1>
        <div className="work__tabs" role="tablist" aria-label="Filter projects">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={filter === tab}
              className={`work__tab${filter === tab ? ' is-active' : ''}`}
              onClick={() => handleFilterChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={`work__grid${isFading ? ' is-fading' : ''}`}>
          {visible.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </>
  );
}
