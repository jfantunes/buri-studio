import { useState } from 'react';
import ResponsiveImage from './ResponsiveImage.jsx';
import './ImageSlider.css';

export default function ImageSlider({ images, title }) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  if (total === 0) return null;

  const go = (i) => setIndex(((i % total) + total) % total);

  return (
    <div className="slider">
      <div className="slider__viewport">
        <div className="slider__track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((image, i) => (
            <div className="slider__slide" key={i}>
              <ResponsiveImage
                image={image}
                sizes="(min-width: 1100px) 1040px, 100vw"
                alt={typeof image === 'object' ? image.alt : title}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
              />
            </div>
          ))}
        </div>
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            className="slider__arrow slider__arrow--prev"
            onClick={() => go(index - 1)}
            aria-label="Previous image"
          >
            ←
          </button>
          <button
            type="button"
            className="slider__arrow slider__arrow--next"
            onClick={() => go(index + 1)}
            aria-label="Next image"
          >
            →
          </button>
          <div className="slider__dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`slider__dot${i === index ? ' is-active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
