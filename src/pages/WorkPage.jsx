import { useEffect, useRef, useState } from 'react';
import Seo from '../components/Seo.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { useContent, useRawContent } from '../hooks/useContent.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import './WorkPage.css';

const FILTER_FADE_MS = 240;
const ALL_FILTER = 'all';

function rawTitle(project) {
  const title = project?.title;
  if (!title || typeof title !== 'object') return title || '';
  return title.en || title.pt || '';
}

export default function WorkPage() {
  const { work, projects } = useContent();
  const rawContent = useRawContent();
  const { t } = useLanguage();
  const allLabel = t('work.all');
  const [filter, setFilter] = useState(ALL_FILTER);
  const [visibleFilter, setVisibleFilter] = useState(ALL_FILTER);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef(null);

  const rawProjects = rawContent?.projects ?? [];
  const categories = [...new Set(rawProjects.map((p) => p.category?.en || p.category).filter(Boolean))];
  const tabs = [
    { key: ALL_FILTER, label: allLabel },
    ...categories.map((category) => {
      const project = projects.find((item) => {
        const rawProject = rawProjects.find((raw) => raw.slug === item.slug);
        return (rawProject?.category?.en || rawProject?.category) === category;
      });
      return { key: category, label: project?.category || category };
    })
  ];
  const visible = visibleFilter === ALL_FILTER
    ? projects
    : projects.filter((project) => {
        const rawProject = rawProjects.find((item) => item.slug === project.slug);
        return (rawProject?.category?.en || rawProject?.category) === visibleFilter;
      });

  useEffect(() => {
    return () => {
      clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  function handleFilterChange(nextFilter) {
    if (nextFilter === filter) return;

    clearTimeout(fadeTimeoutRef.current);
    setFilter(nextFilter);

    if (nextFilter === visibleFilter) {
      setIsFading(false);
      return;
    }

    const shouldReduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (shouldReduceMotion) {
      setVisibleFilter(nextFilter);
      setIsFading(false);
      return;
    }

    setIsFading(true);
    fadeTimeoutRef.current = setTimeout(() => {
      setVisibleFilter(nextFilter);
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
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={filter === tab.key}
              className={`work__tab${filter === tab.key ? ' is-active' : ''}`}
              onClick={() => handleFilterChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={`work__grid${isFading ? ' is-fading' : ''}`}>
          {visible.map((project) => {
            const rawProject = rawContent?.projects?.find((item) => item.slug === project.slug);
            return (
              <ProjectCard
                key={project.slug}
                project={project}
                coverImage={rawProject?.images?.[0]}
                altFallback={rawTitle(rawProject) || project.slug}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}
