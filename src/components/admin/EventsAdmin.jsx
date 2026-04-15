import { useState } from 'react';
import { useStore } from '../../store.jsx';
import ConfirmDialog from '../ConfirmDialog';

export default function EventsAdmin() {
  const { state, dispatch } = useStore();
  const { events, competitorTimes } = state;

  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

  function handleAdd() {
    const name = newName.trim();
    if (!name) { setError('Event name cannot be empty.'); return; }
    if (events.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
      setError('An event with that name already exists.');
      return;
    }
    dispatch({ type: 'ADD_EVENT', name });
    setNewName('');
    setError('');
  }

  function handleDelete(event) {
    setConfirmDelete(event);
  }

  function confirmDeleteEvent() {
    dispatch({ type: 'DELETE_EVENT', eventId: confirmDelete.id });
    setConfirmDelete(null);
  }

  return (
    <div className="pb-16">
      {/* Add form */}
      <div className="section mt-16">
        <div className="card">
          <div className="card-header">Add Custom Event</div>
          <div className="admin-form">
            <input
              className="input"
              placeholder="Event name (e.g. Boys 200 IM)"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            <button className="btn btn-primary btn-full" onClick={handleAdd}>Add Event</button>
          </div>
        </div>
      </div>

      {/* Event list */}
      <div className="section mt-12">
        <div className="card">
          <div className="card-header">
            All Events
            <span className="badge badge-gray">{events.length}</span>
          </div>
          {events.map((event) => {
            const count = (competitorTimes[event.id] || []).length;
            return (
              <div key={event.id} className="card-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>{event.name}</div>
                  <div className="text-sm text-secondary">{count} competitor time{count !== 1 ? 's' : ''}</div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(event)}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          body="This will permanently remove this event and all associated competitor times and swimmer times."
          onConfirm={confirmDeleteEvent}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
