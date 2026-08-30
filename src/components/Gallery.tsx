import { useState } from 'react';
import '../styles/Gallery.css';

interface GalleryImage {
  id: string;
  before: string;
  after: string;
  bike: string;
}

// Placeholder gallery items - will be populated with real before/after images
const galleryItems: GalleryImage[] = [
  {
    id: '1',
    before: 'https://via.placeholder.com/400x300/1A1A1B/9BA0AB?text=Before',
    after: 'https://via.placeholder.com/400x300/1A1A1B/F0F4F5?text=After',
    bike: 'Custom Harley-Davidson',
  },
  {
    id: '2',
    before: 'https://via.placeholder.com/400x300/1A1A1B/9BA0AB?text=Before',
    after: 'https://via.placeholder.com/400x300/1A1A1B/F0F4F5?text=After',
    bike: 'Sport Bike Detail',
  },
  {
    id: '3',
    before: 'https://via.placeholder.com/400x300/1A1A1B/9BA0AB?text=Before',
    after: 'https://via.placeholder.com/400x300/1A1A1B/F0F4F5?text=After',
    bike: 'Vintage Restoration',
  },
  {
    id: '4',
    before: 'https://via.placeholder.com/400x300/1A1A1B/9BA0AB?text=Before',
    after: 'https://via.placeholder.com/400x300/1A1A1B/F0F4F5?text=After',
    bike: 'Adventure Bike Polish',
  },
];

export const Gallery: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const current = galleryItems[selectedIndex];

  return (
    <section id="gallery" className="gallery">
      <div className="gallery-container">
        <h2>Before & After</h2>
        <p className="section-subtitle">See the Migaki difference in detail.</p>

        <div className="gallery-viewer">
          <div className="comparison-slider">
            <div className="before-image">
              <img src={current.before} alt={`Before - ${current.bike}`} />
              <span className="label">Before</span>
            </div>
            <div className="after-image">
              <img src={current.after} alt={`After - ${current.bike}`} />
              <span className="label">After</span>
            </div>
          </div>

          <div className="gallery-info">
            <h3>{current.bike}</h3>
          </div>

          <div className="gallery-controls">
            <button
              className="gallery-button prev"
              onClick={handlePrevious}
              aria-label="Previous"
            >
              ←
            </button>

            <div className="gallery-counter">
              <span>{String(selectedIndex + 1).padStart(2, '0')}</span>
              <span>/</span>
              <span>{String(galleryItems.length).padStart(2, '0')}</span>
            </div>

            <button
              className="gallery-button next"
              onClick={handleNext}
              aria-label="Next"
            >
              →
            </button>
          </div>

          <div className="gallery-dots">
            {galleryItems.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === selectedIndex ? 'active' : ''}`}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Go to image ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
