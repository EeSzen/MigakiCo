import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface DateOverride {
  id: string;
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
}

export default function AdminCalendar() {
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    is_available: true,
    start_time: '09:00',
    end_time: '17:00',
    note: '',
  });

  useEffect(() => {
    fetchOverrides();
  }, []);

  async function fetchOverrides() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('date_overrides')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setOverrides(data || []);
    } catch (error) {
      console.error('Error fetching overrides:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Check if override already exists for this date
      const existing = overrides.find((o) => o.date === formData.date);

      if (existing) {
        // Update
        const { error } = await supabase
          .from('date_overrides')
          .update({
            is_available: formData.is_available,
            start_time: formData.is_available ? formData.start_time : null,
            end_time: formData.is_available ? formData.end_time : null,
            note: formData.note,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('date_overrides')
          .insert([
            {
              date: formData.date,
              is_available: formData.is_available,
              start_time: formData.is_available ? formData.start_time : null,
              end_time: formData.is_available ? formData.end_time : null,
              note: formData.note,
            },
          ]);

        if (error) throw error;
      }

      fetchOverrides();
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        is_available: true,
        start_time: '09:00',
        end_time: '17:00',
        note: '',
      });
    } catch (error) {
      console.error('Error saving override:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this override?')) return;

    try {
      const { error } = await supabase
        .from('date_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchOverrides();
    } catch (error) {
      console.error('Error deleting override:', error);
    }
  }

  return (
    <div className="admin-calendar">
      <div className="calendar-header">
        <h1>Calendar Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Override'}
        </button>
      </div>

      {showForm && (
        <form className="override-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              />
              Available
            </label>
          </div>

          {formData.is_available && (
            <>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Note</label>
            <input
              type="text"
              placeholder="e.g., Holiday closed, Extended hours, etc."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary">
            Save Override
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading overrides...</p>
      ) : overrides.length === 0 ? (
        <p className="no-data">No date overrides yet. Add one to customize availability.</p>
      ) : (
        <div className="overrides-list">
          {overrides.map((override) => (
            <div key={override.id} className={`override-card ${override.is_available ? 'available' : 'unavailable'}`}>
              <div className="override-date">
                <strong>{new Date(override.date + 'T00:00:00').toLocaleDateString('en-MY', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}</strong>
              </div>

              <div className="override-details">
                {override.is_available ? (
                  <>
                    <p><strong>Available</strong></p>
                    <p>{override.start_time} - {override.end_time}</p>
                  </>
                ) : (
                  <p><strong>Unavailable</strong></p>
                )}
                {override.note && <p className="note">{override.note}</p>}
              </div>

              <button
                className="btn-delete"
                onClick={() => handleDelete(override.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
