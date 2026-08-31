import '../styles/About.css';

interface ValueProp {
  title: string;
  description: string;
  icon?: string;
}

const valueProps: ValueProp[] = [
  {
    title: 'Home-based, On Your Schedule',
    description: 'We come to you. No dealership waiting rooms, no compromise on convenience. Book the time that works for your life.',
  },
  {
    title: 'Appointment-Only, Unhurried',
    description: 'Every bike gets our full attention. No rush jobs. No production-line shortcuts. Just precision care, one bike at a time.',
  },
  {
    title: 'Products Chosen for Finish, Not Shortcuts',
    description: 'We select every product for durability and depth of shine. Your bike\'s finish matters. Ours does too.',
  },
];

export const About: React.FC = () => {
  return (
    <section id="about" className="about">
      <div className="about-container">
        <div className="about-header">
          <h2>The Migaki Approach</h2>
          <p className="section-subtitle">Precision, quietly applied.</p>
        </div>

        <div className="value-props-grid">
          {valueProps.map((prop, index) => (
            <div key={index} className="value-prop-card">
              <div className="value-prop-number">{String(index + 1).padStart(2, '0')}</div>
              <h3>{prop.title}</h3>
              <p>{prop.description}</p>
              <div className="value-prop-border"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
