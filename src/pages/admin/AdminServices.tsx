import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '60',
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_minutes: '60',
      is_active: true,
    });
    setEditingId(null);
  }

  function handleEdit(service: Service) {
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      is_active: service.is_active,
    });
    setEditingId(service.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        is_active: formData.is_active,
      };

      if (editingId) {
        // Update
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
      }

      fetchServices();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this service?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  }

  async function toggleActive(service: Service) {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  }

  return (
    <div className="admin-services">
      <div className="services-header">
        <h1>Services Management</h1>
        <button className="btn-primary" onClick={() => {
          resetForm();
          setShowForm(!showForm);
        }}>
          {showForm ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {showForm && (
        <form className="service-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Service Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Basic Wash"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Service details..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (RM)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="50.00"
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>

          <button type="submit" className="btn-primary">
            {editingId ? 'Update Service' : 'Add Service'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading services...</p>
      ) : services.length === 0 ? (
        <p className="no-data">No services yet. Create one to start taking bookings.</p>
      ) : (
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className={`service-card ${!service.is_active ? 'inactive' : ''}`}>
              <div className="service-header">
                <h3>{service.name}</h3>
                <span className={`active-badge ${service.is_active ? 'active' : 'inactive'}`}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {service.description && (
                <p className="description">{service.description}</p>
              )}

              <div className="service-details">
                <p><strong>Price:</strong> RM {service.price.toFixed(2)}</p>
                <p><strong>Duration:</strong> {service.duration_minutes} min</p>
              </div>

              <div className="service-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(service)}
                >
                  Edit
                </button>
                <button
                  className={`btn-toggle ${service.is_active ? 'deactivate' : 'activate'}`}
                  onClick={() => toggleActive(service)}
                >
                  {service.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(service.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
