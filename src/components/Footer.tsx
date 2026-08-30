import '../styles/Footer.css';

interface FooterProps {
  onBookClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onBookClick }) => {
  return (
    <footer id="contact" className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>MIGAKI</h3>
            <p>Precision motorcycle detailing, quietly applied.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#hero">Home</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#gallery">Gallery</a></li>
              <li><a href="#process">Process</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Service Area</h4>
            <p>15-mile radius from downtown</p>
            <p className="service-zones">Primary zones: Downtown, Midtown, Riverside</p>
          </div>

          <div className="footer-section">
            <h4>Contact</h4>
            <p>
              <a href="tel:+15551234567">(555) 123-4567</a>
            </p>
            <p>
              <a href="mailto:book@migaki.co">book@migaki.co</a>
            </p>
            <div className="social-links">
              <a href="#instagram" title="Instagram">f</a>
              <a href="#facebook" title="Facebook">in</a>
            </div>
          </div>
        </div>

        <div className="footer-cta">
          <button className="cta-footer" onClick={onBookClick}>
            Ready to Shine?
          </button>
          <p className="footer-tagline">Book your appointment today</p>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Migaki Motorcycle Detailing. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
