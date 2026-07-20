import { Link } from 'react-router-dom';
import ResponsiveImage from './ResponsiveImage.jsx';
import './ProjectCard.css';

export default function ProjectCard({ project }) {
  return (
    <Link to={`/project/${project.slug}`} className="project-card">
      <div className="project-card__media">
        <ResponsiveImage image={project.images?.[0]} sizes="(min-width: 700px) 50vw, 100vw" />
      </div>
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
