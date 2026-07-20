import ResponsiveImage from './ResponsiveImage.jsx';
import { useSlideshow } from '../hooks/useSlideshow.js';
import './HeroSlideshow.css';

export default function HeroSlideshow({ slides, intervalMs = 5000 }) {
  const index = useSlideshow(slides.length, intervalMs);

  return (
    <div className="hero">
      {slides.map((slide, i) => (
        <ResponsiveImage
          key={i}
          image={slide}
          sizes="100vw"
          className={`hero__slide${i === index ? ' is-active' : ''}`}
          loading={i === 0 ? 'eager' : 'lazy'}
          fetchPriority={i === 0 ? 'high' : undefined}
        />
      ))}
    </div>
  );
}
