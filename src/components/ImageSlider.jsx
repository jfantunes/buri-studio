import { memo, useState } from 'react';
import ResponsiveImage from './ResponsiveImage.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import './ImageSlider.css';

function fixedAlt(image, fallback) {
  if (!image || typeof image !== 'object') return fallback || '';
  if (!image.alt || typeof image.alt !== 'object') return image.alt || fallback || '';
  return image.alt.en || image.alt.pt || fallback || '';
}

const ImageTrack = memo(function ImageTrack({ images, index, altFallback }) {
  return (
    <div className="slider__track" style={{ transform: `translateX(-${index * 100}%)` }}>
      {images.map((image, i) => (
        <div className="slider__slide" key={i}>
          <ResponsiveImage
            image={image}
            sizes="(min-width: 1100px) 1040px, 100vw"
            alt={fixedAlt(image, altFallback)}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : undefined}
          />
        </div>
      ))}
    </div>
  );
});

export default function ImageSlider({ images, altFallback }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const total = images.length;
  if (total === 0) return null;

  const go = (i) => setIndex(((i % total) + total) % total);

  return (
    <div className="slider">
      <div className="slider__viewport">
        <ImageTrack images={images} index={index} altFallback={altFallback} />
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            className="slider__arrow slider__arrow--prev"
            onClick={() => go(index - 1)}
            aria-label={t('slider.previousImage')}
          >
            ←
          </button>
          <button
            type="button"
            className="slider__arrow slider__arrow--next"
            onClick={() => go(index + 1)}
            aria-label={t('slider.nextImage')}
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
                aria-label={t('slider.goToImage').replace('%s', i + 1)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
