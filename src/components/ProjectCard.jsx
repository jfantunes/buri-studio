import { memo } from 'react';
import { Link } from 'react-router-dom';
import ResponsiveImage from './ResponsiveImage.jsx';
import './ProjectCard.css';

function fixedAlt(image, fallback) {
  if (!image || typeof image !== 'object') return fallback || '';
  if (!image.alt || typeof image.alt !== 'object') return image.alt || fallback || '';
  return image.alt.en || image.alt.pt || fallback || '';
}

const ProjectCardMedia = memo(function ProjectCardMedia({ image, altFallback }) {
  return (
    <div className="project-card__media">
      <ResponsiveImage image={image} sizes="(min-width: 700px) 50vw, 100vw" alt={fixedAlt(image, altFallback)} />
    </div>
  );
});

export default function ProjectCard({ project, coverImage, altFallback }) {
  return (
    <Link to={`/project/${project.slug}`} className="project-card">
      <ProjectCardMedia image={coverImage} altFallback={altFallback} />
      <div className="project-card__row">
        <span className="project-card__title">{project.title}</span>
        <span className="project-card__location">{project.location}</span>
      </div>
      <div className="project-card__meta">
        {project.category} — {project.year}
      </div>
    </Link>
  );
}
