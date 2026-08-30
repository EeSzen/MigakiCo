import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  location_type: 'home' | 'onsite';
  address: string | null;
  bike_model: string;
  bike_plate: string;
  bike_cc: number | null;
  remarks: string | null;
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  created_at: string;
}

interface BookingService {
  service_id: string;
  id: string;
  services?: {
    name: string;
    price: number;
    duration_minutes: number;
  };
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'confirmed' | 'completed' | 'all'>('pending');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [services, setServices] = useState<Record<string, BookingService[]>>({});

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  async function fetchBookings() {
    try {
      setLoading(true);
      let query = supabase
        .from('bookings')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);

      // Fetch services for each booking
      if (data && data.length > 0) {
        const servicesByBooking: Record<string, BookingService[]> = {};

        for (const booking of data) {
          const { data: bookingServices, error: servicesError } = await supabase
            .from('booking_services')
            .select('id, service_id')
            .eq('booking_id', booking.id);

          if (!servicesError && bookingServices) {
            // Fetch service details for each service
            const servicesWithDetails: BookingService[] = [];
            for (const bs of bookingServices) {
              const { data: serviceData } = await supabase
                .from('services')
                .select('name, price, duration_minutes')
                .eq('id', bs.service_id)
                .maybeSingle();

              servicesWithDetails.push({
                id: bs.id,
                service_id: bs.service_id,
                services: serviceData || undefined,
              });
            }
            servicesByBooking[booking.id] = servicesWithDetails;
          }
        }

        setServices(servicesByBooking);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'rejected' | 'completed') {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status } : b
        )
      );
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  }

  function formatDateTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="admin-bookings">
      <h1>Bookings Queue</h1>

      {/* Filter Tabs */}
      <div className="booking-filters">
        {(['pending', 'confirmed', 'completed', 'all'] as const).map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="no-data">No bookings found.</p>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className={`booking-card status-${booking.status}`}
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="booking-header">
                <h3>{booking.customer_name}</h3>
                <span className={`status-badge ${booking.status}`}>{booking.status}</span>
              </div>

              <p className="booking-date">{formatDateTime(booking.scheduled_at)}</p>

              <div className="booking-info">
                <p><strong>Phone:</strong> {booking.customer_phone}</p>
                <p><strong>Bike:</strong> {booking.bike_model} ({booking.bike_cc}cc)</p>
                <p><strong>Plate:</strong> {booking.bike_plate}</p>
                {booking.location_type === 'onsite' && (
                  <p><strong>Address:</strong> {booking.address}</p>
                )}
                {booking.remarks && (
                  <p><strong>Remarks:</strong> {booking.remarks}</p>
                )}
              </div>

              {services[booking.id] && services[booking.id].length > 0 && (
                <div className="booking-services">
                  <strong>Services:</strong>
                  {services[booking.id].map((bs: BookingService) => (
                    <div key={bs.id} className="service-item">
                      <span>{bs.services?.name}</span>
                      <span>RM {bs.services?.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Booking Details</h2>

            <div className="booking-details">
              <p><strong>Name:</strong> {selectedBooking.customer_name}</p>
              <p><strong>Phone:</strong> {selectedBooking.customer_phone}</p>
              <p><strong>Date & Time:</strong> {formatDateTime(selectedBooking.scheduled_at)}</p>
              <p><strong>Bike:</strong> {selectedBooking.bike_model} ({selectedBooking.bike_cc}cc)</p>
              <p><strong>Plate:</strong> {selectedBooking.bike_plate}</p>
              <p><strong>Location:</strong> {selectedBooking.location_type === 'home' ? 'Customer Reservation' : 'On-site Visit'}</p>
              {selectedBooking.address && (
                <p><strong>Address:</strong> {selectedBooking.address}</p>
              )}
              {selectedBooking.remarks && (
                <p><strong>Remarks:</strong> {selectedBooking.remarks}</p>
              )}
              <p><strong>Status:</strong> {selectedBooking.status}</p>
            </div>

            {selectedBooking.status === 'pending' && (
              <div className="modal-actions">
                <button
                  className="btn-confirm"
                  onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                >
                  Confirm
                </button>
                <button
                  className="btn-reject"
                  onClick={() => updateBookingStatus(selectedBooking.id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            )}

            {selectedBooking.status === 'confirmed' && (
              <div className="modal-actions">
                <button
                  className="btn-complete"
                  onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                >
                  Mark Complete
                </button>
              </div>
            )}

            <button className="btn-close" onClick={() => setSelectedBooking(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
