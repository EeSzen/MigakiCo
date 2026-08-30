import './App.css';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { BookingPreview } from './components/BookingPreview';
import { Process } from './components/Process';
import { Gallery } from './components/Gallery';
import { Reviews } from './components/Reviews';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

function App() {
  const handleBooking = () => {
    // Navigate to booking preview or open modal
    const bookingSection = document.getElementById('booking-preview');
    bookingSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewServices = () => {
    const servicesSection = document.getElementById('services');
    servicesSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar onBookClick={handleBooking} />
      
      <main>
        <Hero onBookClick={handleBooking} onViewServices={handleViewServices} />
        <About />
        <Services onBookClick={handleBooking} />
        <div id="booking-preview">
          <BookingPreview />
        </div>
        <Process />
        <Gallery />
        <Reviews />
        <FAQ />
        <Footer onBookClick={handleBooking} />
      </main>
    </>
  );
}

export default App;
