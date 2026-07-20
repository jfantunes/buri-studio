import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import ImageSlider from '../components/ImageSlider.jsx';
import { useContent } from '../hooks/useContent.js';
import './ProjectPage.css';

function coverSrc(project) {
  const cover = project?.images?.[0];
  return typeof cover === 'string' ? cover : cover?.src;
}

export default function ProjectPage() {
  const { slug } = useParams();
  const { site, projects } = useContent();
  const index = projects.findIndex((p) => p.slug === slug);

  if (index === -1) {
    return (
      <>
        <Seo title="Project not found" path={`/project/${slug}`} />
        <section className="project">
          <p className="project__missing">
            Project not found. <Link to="/work">Back to work</Link>
          </p>
        </section>
      </>
    );
  }

  const project = projects[index];
  const total = projects.length;
  const prev = projects[(index - 1 + total) % total];
  const next = projects[(index + 1) % total];
  const cover = coverSrc(project);
  const base = (site?.seo?.siteUrl || '').replace(/\/+$/, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    image: base && cover ? base + cover : undefined,
    dateCreated: project.year,
    creator: { '@type': 'Organization', name: site?.name }
  };

  return (
    <>
      <Seo
        title={project.title}
        description={project.seoDescription || project.description}
        path={`/project/${project.slug}`}
        image={cover}
        type="article"
        jsonLd={jsonLd}
      />
      <section className="project">
        <Link to="/work" className="project__back">
          ← Work
        </Link>
        <div className="project__header">
          <h1 className="project__title">{project.title}</h1>
          <div className="project__meta">
            <div>{project.location}</div>
            <div>
              {project.category} — {project.year}
            </div>
          </div>
        </div>
        <ImageSlider key={project.slug} images={project.images ?? []} title={project.title} />
        <p className="project__description">{project.description}</p>
        <nav className="project__pager" aria-label="More projects">
          <Link to={`/project/${prev.slug}`} className="project__pager-link">
            <span className="project__pager-label">← Previous</span>
            <span className="project__pager-title">{prev.title}</span>
          </Link>
          <Link to={`/project/${next.slug}`} className="project__pager-link project__pager-link--next">
            <span className="project__pager-label">Next →</span>
            <span className="project__pager-title">{next.title}</span>
          </Link>
        </nav>
      </section>
    </>
  );
}
