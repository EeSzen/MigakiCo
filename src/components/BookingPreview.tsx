import { useState } from 'react';
import '../styles/BookingPreview.css';

export const BookingPreview: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      if (date.getDay() !== 0) { // Exclude Sundays
        days.push(date);
      }
    }
    return days;
  };

  const days = getNextDays();
  const timeSlots = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'];

  const handleBooking = () => {
    // Navigate to full booking flow
    window.location.href = '/booking';
  };

  return (
    <section className="booking-preview">
      <div className="booking-preview-container">
        <h2>Schedule Your Appointment</h2>
        <p className="section-subtitle">Availability at a glance.</p>

        <div className="booking-preview-card">
          <div className="booking-calendar">
            <h3>Select Date</h3>
            <div className="date-buttons">
              {days.slice(0, 7).map((date, index) => (
                <button
                  key={index}
                  className={`date-button ${selectedDate?.toDateString() === date.toDateString() ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="day">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="date">
                    {date.getDate()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div className="booking-times">
              <h3>Available Times</h3>
              <div className="time-slots">
                {timeSlots.map((time, index) => (
                  <button key={index} className="time-slot">
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="booking-cta" onClick={handleBooking}>
            Continue to Booking
          </button>
        </div>
      </div>
    </section>
  );
};
