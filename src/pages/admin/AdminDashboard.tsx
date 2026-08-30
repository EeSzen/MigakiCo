import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminBookings from './AdminBookings';
import AdminCalendar from './AdminCalendar';
import AdminServices from './AdminServices';
import AdminPhotos from './AdminPhotos';
import '../../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || '');
    }

    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  }

  const currentPath = location.pathname;

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>MIGAKI</h2>
          <p>Admin Panel</p>
        </div>

        <nav className="admin-nav">
          <Link
            to="/admin/bookings"
            className={`nav-link ${currentPath.includes('bookings') ? 'active' : ''}`}
          >
            📅 Bookings Queue
          </Link>
          <Link
            to="/admin/calendar"
            className={`nav-link ${currentPath.includes('calendar') ? 'active' : ''}`}
          >
            📆 Calendar
          </Link>
          <Link
            to="/admin/services"
            className={`nav-link ${currentPath.includes('services') ? 'active' : ''}`}
          >
            🔧 Services
          </Link>
          <Link
            to="/admin/photos"
            className={`nav-link ${currentPath.includes('photos') ? 'active' : ''}`}
          >
            📸 Photos
          </Link>
        </nav>

        <div className="admin-footer">
          <p className="user-email">{userEmail}</p>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route index element={<div className="admin-welcome"><h1>Welcome to Migaki Admin</h1><p>Select a section from the sidebar to get started.</p></div>} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route
            path="*"
            element={
              <div className="admin-welcome">
                <h1>Welcome to Migaki Admin</h1>
                <p>Select a section from the sidebar to get started.</p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
