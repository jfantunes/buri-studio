import { useState } from 'react';
import Seo from '../components/Seo.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { useContent } from '../hooks/useContent.js';
import './WorkPage.css';

export default function WorkPage() {
  const { work, projects } = useContent();
  const [filter, setFilter] = useState('All');

  const categories = [...new Set(projects.map((p) => p.category))];
  const tabs = ['All', ...categories];
  const visible = filter === 'All' ? projects : projects.filter((p) => p.category === filter);

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
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="work__grid">
          {visible.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </>
  );
}
