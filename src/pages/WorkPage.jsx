import { useEffect, useRef, useState } from 'react';
import Seo from '../components/Seo.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { useContent } from '../hooks/useContent.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import './WorkPage.css';

const FILTER_FADE_MS = 240;

export default function WorkPage() {
  const { work, projects } = useContent();
  const { t } = useLanguage();
  const allLabel = t('work.all');
  const [filter, setFilter] = useState(allLabel);
  const [visibleFilter, setVisibleFilter] = useState(allLabel);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef(null);

  const categories = [...new Set(projects.map((p) => p.category))];
  const tabs = [allLabel, ...categories];
  const visible = visibleFilter === allLabel ? projects : projects.filter((p) => p.category === visibleFilter);

  useEffect(() => {
    return () => {
      clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setFilter(allLabel);
    setVisibleFilter(allLabel);
    setIsFading(false);
  }, [allLabel]);

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
        <h1 className="page-heading">{work?.heading || t('nav.work')}</h1>
        <div className="work__tabs" role="tablist" aria-label={t('work.filtersLabel')}>
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
