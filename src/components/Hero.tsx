import '../styles/Hero.css';

interface HeroProps {
  onBookClick?: () => void;
  onViewServices?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookClick, onViewServices }) => {
  return (
    <section id="hero" className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content">
        <h1 className="hero-headline">
          Refined Care for Bikes of Distinction
        </h1>
        
        <p className="hero-subheadline">
          Precision detailing, quietly applied. Appointment-only service for the discerning motorcycle owner.
        </p>

        <div className="hero-ctas">
          <button className="cta-primary" onClick={onBookClick}>
            Book Now
          </button>
          <button className="cta-secondary" onClick={onViewServices}>
            View Services
          </button>
        </div>
      </div>

      <div className="hero-scroll-hint">
        <span>Scroll</span>
        <div className="scroll-indicator">
          <div className="scroll-dot"></div>
        </div>
      </div>
    </section>
  );
};
