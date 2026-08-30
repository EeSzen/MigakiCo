import '../styles/Reviews.css';

interface Review {
  id: string;
  author: string;
  bike: string;
  text: string;
  rating: number;
}

const reviews: Review[] = [
  {
    id: '1',
    author: 'James M.',
    bike: 'Harley-Davidson Street 750',
    text: 'Finally found someone who actually cares about the details. My bike looks showroom-ready, and the service was at my home at my convenience. Outstanding work.',
    rating: 5,
  },
  {
    id: '2',
    author: 'Sarah K.',
    bike: 'Kawasaki Ninja 400',
    text: 'The precision here is no joke. No rushing, no shortcuts. They treated my bike like it mattered, because it does. Worth every penny.',
    rating: 5,
  },
  {
    id: '3',
    author: 'Michael R.',
    bike: 'Royal Enfield Classic 350',
    text: 'Migaki took a tired-looking classic and made it shine again. The before and after is incredible. Booking my next appointment right now.',
    rating: 5,
  },
  {
    id: '4',
    author: 'Lisa T.',
    bike: 'Yamaha MT-07',
    text: 'Appointment-only means no random walk-ins, no noise. Just focused professionals who deliver exceptional results. Highly recommend.',
    rating: 5,
  },
];

export const Reviews: React.FC = () => {
  return (
    <section id="reviews" className="reviews">
      <div className="reviews-container">
        <h2>Customer Reviews</h2>
        <p className="section-subtitle">Real riders, real results.</p>

        <div className="reviews-grid">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-rating">
                {[...Array(review.rating)].map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>

              <p className="review-text">"{review.text}"</p>

              <div className="review-author">
                <strong>{review.author}</strong>
                <span className="review-bike">{review.bike}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
