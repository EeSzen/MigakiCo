import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Menu, X, UserCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminBookings from "./AdminBookings";
import AdminCalendar from "./AdminCalendar";
import AdminServices from "./AdminServices";
import AdminPhotos from "./AdminPhotos";
import "../../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userEmail, setUserEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email || "");
    }

    loadUser();
  }, []);

  // Close mobile sidebar whenever navigation occurs
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  const currentPath = location.pathname;

  return (
    <div className="admin-container">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile header */}
      <header className="admin-mobile-header">
        <button
          type="button"
          className="admin-menu-btn"
          aria-label="Open navigation menu"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} />
        </button>

        <div className="admin-mobile-title">
          <strong>MIGAKI</strong>
          <span>Admin Panel</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}
      >
        <div className="admin-brand">
          <div>
            <h2>MIGAKI</h2>
            <p>Admin Panel</p>
          </div>

          {/* Close button only visible on mobile */}
          <button
            type="button"
            className="admin-sidebar-close"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          <Link
            to="/admin/bookings"
            className={`nav-link ${
              currentPath.includes("bookings") ? "active" : ""
            }`}
          >
            <span>📅</span>
            <span>Bookings Queue</span>
          </Link>

          <Link
            to="/admin/calendar"
            className={`nav-link ${
              currentPath.includes("calendar") ? "active" : ""
            }`}
          >
            <span>📆</span>
            <span>Calendar</span>
          </Link>

          <Link
            to="/admin/services"
            className={`nav-link ${
              currentPath.includes("services") ? "active" : ""
            }`}
          >
            <span>🔧</span>
            <span>Services</span>
          </Link>

          <Link
            to="/admin/photos"
            className={`nav-link ${
              currentPath.includes("photos") ? "active" : ""
            }`}
          >
            <span>📸</span>
            <span>Photos</span>
          </Link>
        </nav>

        <div className="admin-footer">
          <div className="admin-profile">
            <UserCircle className="admin-profile-icon" size={36} />
            <div className="admin-profile-info">
              <span className="admin-profile-label">Admin</span>
              <span className="user-email">{userEmail}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route
            index
            element={
              <div className="admin-welcome">
                <h1>Welcome to Migaki Admin</h1>
                <p>Select a section from the sidebar to get started.</p>
              </div>
            }
          />

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
