import '../styles/Process.css';

interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

const steps: ProcessStep[] = [
  {
    number: 1,
    title: 'Assessment',
    description: 'We inspect your bike\'s current finish and discuss your goals.',
  },
  {
    number: 2,
    title: 'Wash & Prep',
    description: 'Thorough cleaning, decontamination, and surface preparation.',
  },
  {
    number: 3,
    title: 'Wax & Protect',
    description: 'Application of ceramic coating or wax for lasting protection and shine.',
  },
  {
    number: 4,
    title: 'Final Check',
    description: 'Quality inspection and before/after documentation.',
  },
];

export const Process: React.FC = () => {
  return (
    <section id="process" className="process">
      <div className="process-container">
        <h2>Our Process</h2>

        <div className="process-timeline">
          {steps.map((step, index) => (
            <div key={index} className="process-step">
              <div className="step-number">{String(step.number).padStart(2, '0')}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
