import '../styles/Services.css';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  category: 'service' | 'bundle';
  featured?: boolean;
}

const services: Service[] = [
  {
    id: 'wash',
    name: 'Precision Wash',
    price: 89,
    duration: 60,
    category: 'service',
    features: [
      'Two-bucket wash system',
      'pH-neutral shampoo',
      'Decontamination rinse',
      'Water spot prevention',
    ],
  },
  {
    id: 'wax',
    name: 'Ceramic Wax Coat',
    price: 149,
    duration: 90,
    category: 'service',
    features: [
      'Paint decontamination',
      'Machine polish (if needed)',
      'Ceramic coating application',
      '6-month protection',
      'Beading guarantee',
    ],
  },
  {
    id: 'helmet',
    name: 'Helmet Restoration',
    price: 59,
    duration: 45,
    category: 'service',
    features: [
      'Deep clean (interior & exterior)',
      'Visor polish',
      'Strap conditioning',
      'Odor elimination',
    ],
  },
  {
    id: 'detail-bundle',
    name: 'Full Detail Bundle',
    price: 269,
    duration: 180,
    category: 'bundle',
    featured: true,
    features: [
      'Precision wash + ceramic wax',
      'Helmet restoration included',
      'Wheel & tire detailing',
      'Final inspection',
      'Save $28',
    ],
  },
  {
    id: 'maintenance-bundle',
    name: 'Quarterly Maintenance',
    price: 199,
    duration: 120,
    category: 'bundle',
    features: [
      'Precision wash',
      'Touch-up wax layer',
      'Helmet refresh',
      'Quarterly booking',
    ],
  },
];

interface ServicesProps {
  onBookClick?: (service: Service) => void;
}

export const Services: React.FC<ServicesProps> = ({ onBookClick }) => {
  return (
    <section id="services" className="services">
      <div className="services-container">
        <div className="services-header">
          <h2>Services & Packages</h2>
          <p className="section-subtitle">Tailored to your bike and your timeline.</p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div
              key={service.id}
              className={`service-card ${service.featured ? 'featured' : ''}`}
            >
              {service.featured && <div className="featured-badge">Recommended</div>}

              <div className="service-header">
                <h3>{service.name}</h3>
                <div className="service-meta">
                  <span className="duration">{service.duration} min</span>
                </div>
              </div>

              <div className="service-price">
                ${service.price}
              </div>

              <ul className="service-features">
                {service.features.map((feature, index) => (
                  <li key={index}>
                    <span className="check-mark">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className="service-cta"
                onClick={() => onBookClick?.(service)}
              >
                Book Service
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
