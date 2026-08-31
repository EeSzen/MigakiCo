import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  customer_name: string;
  bike_model: string;
  scheduled_at: string;
}

interface BookingPhoto {
  id: string;
  booking_id: string;
  url: string;
  type: 'before' | 'after';
  uploaded_at: string;
}

export default function AdminPhotos() {
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [photos, setPhotos] = useState<BookingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  async function fetchCompletedBookings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('id, customer_name, bike_model, scheduled_at')
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setCompletedBookings(data || []);
    } catch (error) {
      console.error('Error fetching completed bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPhotosForBooking(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from('booking_photos')
        .select('*')
        .eq('booking_id', bookingId)
        .order('type', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedBooking || !e.target.files) return;

    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${selectedBooking.id}_${photoType}_${timestamp}_${file.name}`;
      const filepath = `booking_photos/${filename}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filepath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filepath);

      // Insert photo record
      const { error: insertError } = await supabase
        .from('booking_photos')
        .insert([
          {
            booking_id: selectedBooking.id,
            url: publicUrl,
            type: photoType,
          },
        ]);

      if (insertError) throw insertError;

      // Refresh photos
      fetchPhotosForBooking(selectedBooking.id);

      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(photoId: string) {
    if (!window.confirm('Delete this photo?')) return;

    try {
      const { error } = await supabase
        .from('booking_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      if (selectedBooking) {
        fetchPhotosForBooking(selectedBooking.id);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }

  return (
    <div className="admin-photos">
      <h1>Photo Management</h1>

      <div className="photos-container">
        {/* Completed Bookings List */}
        <div className="bookings-sidebar">
          <h2>Completed Bookings</h2>
          {loading ? (
            <p>Loading...</p>
          ) : completedBookings.length === 0 ? (
            <p className="no-data">No completed bookings yet.</p>
          ) : (
            <div className="bookings-list">
              {completedBookings.map((booking) => (
                <button
                  key={booking.id}
                  className={`booking-item ${selectedBooking?.id === booking.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedBooking(booking);
                    fetchPhotosForBooking(booking.id);
                  }}
                >
                  <div className="booking-info">
                    <p className="name">{booking.customer_name}</p>
                    <p className="model">{booking.bike_model}</p>
                  </div>
                  <p className="date">
                    {new Date(booking.scheduled_at).toLocaleDateString('en-MY')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Photo Upload & Display */}
        {selectedBooking && (
          <div className="photos-main">
            <h2>Photos for {selectedBooking.customer_name}</h2>

            {/* Upload Form */}
            <div className="upload-form">
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as 'before' | 'after')}
              >
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>

              <label className="file-input-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                {uploading ? 'Uploading...' : 'Choose Photo'}
              </label>
            </div>

            {/* Photos Grid */}
            {photos.length === 0 ? (
              <p className="no-data">No photos yet. Upload before/after images.</p>
            ) : (
              <div className="photos-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className={`photo-card type-${photo.type}`}>
                    <div className="photo-type-label">{photo.type.toUpperCase()}</div>
                    <img src={photo.url} alt={`${photo.type} photo`} />
                    <div className="photo-date">
                      {new Date(photo.uploaded_at).toLocaleString('en-MY')}
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => deletePhoto(photo.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedBooking && !loading && (
          <div className="photos-main">
            <p className="no-data">Select a completed booking to manage photos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
