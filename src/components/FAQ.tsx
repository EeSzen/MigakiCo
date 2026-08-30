import { useState } from 'react';
import '../styles/FAQ.css';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'How do I book an appointment?',
    answer: 'Use the calendar on our website to select your preferred date and time. You\'ll enter your address (we serve the local area), bike details, and contact info. We\'ll confirm availability and send you a confirmation email with all the details.',
  },
  {
    id: '2',
    question: 'What\'s your service area?',
    answer: 'We\'re a mobile service and handle bikes within a 15-mile radius of downtown. We\'ll confirm service availability for your address during booking. For locations outside this radius, contact us to discuss options.',
  },
  {
    id: '3',
    question: 'Do you offer rush appointments?',
    answer: 'We keep our schedule intentionally open to maintain our quality standard. Rush appointments may be available depending on current bookings. Contact us directly to discuss urgent needs.',
  },
  {
    id: '4',
    question: 'What if I need to reschedule?',
    answer: 'You can reschedule up to 48 hours before your appointment through your account dashboard. Cancellations within 48 hours are subject to a 50% service fee.',
  },
  {
    id: '5',
    question: 'Do you provide ceramic coating?',
    answer: 'Yes. Our Ceramic Wax Coat provides 6 months of UV and environmental protection. We also offer ceramic paint coating for extended protection. Discuss options during booking.',
  },
  {
    id: '6',
    question: 'Can I get a loyalty program?',
    answer: 'Yes! Create a Migaki account after your first booking to earn points toward future services. Regular customers can also arrange quarterly maintenance packages at a discount.',
  },
];

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="faq">
      <div className="faq-container">
        <h2>Frequently Asked Questions</h2>
        <p className="section-subtitle">Answers to common questions about our service.</p>

        <div className="faq-list">
          {faqItems.map((item) => (
            <div
              key={item.id}
              className={`faq-item ${openId === item.id ? 'open' : ''}`}
            >
              <button
                className="faq-trigger"
                onClick={() => toggleOpen(item.id)}
                aria-expanded={openId === item.id}
              >
                <span className="faq-question">{item.question}</span>
                <span className="faq-icon">+</span>
              </button>

              {openId === item.id && (
                <div className="faq-content">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
