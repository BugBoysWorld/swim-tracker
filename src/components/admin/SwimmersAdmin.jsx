import { useState } from 'react';
import { useStore } from '../../store.jsx';
import { formatTime } from '../../utils/placement';
import ConfirmDialog from '../ConfirmDialog';

function SwimmerRow({ swimmer, events, swimmerTimes, dispatch }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(swimmer.name);
  const [editError, setEditError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteTime, setConfirmDeleteTime] = useState(null);

  // Time entry state
  const [addingTimeEventId, setAddingTimeEventId] = useState('');
  const [addingTimeValue, setAddingTimeValue] = useState('');
  const [addingTimeError, setAddingTimeError] = useState('');

  const myTimes = swimmerTimes[swimmer.id] || {};

  function saveEdit() {
    const name = editName.trim();
    if (!name) { setEditError('Name cannot be empty.'); return; }
    dispatch({ type: 'EDIT_SWIMMER', swimmerId: swimmer.id, name });
    setEditing(false);
    setEditError('');
  }

  function addTime() {
    if (!addingTimeEventId) { setAddingTimeError('Select an event.'); return; }
    const n = parseFloat(addingTimeValue);
    if (isNaN(n) || n <= 0) { setAddingTimeError('Enter a valid positive time.'); return; }
    dispatch({ type: 'SET_SWIMMER_TIME', swimmerId: swimmer.id, eventId: addingTimeEventId, time: n });
    setAddingTimeEventId('');
    setAddingTimeValue('');
    setAddingTimeError('');
  }

  return (
    <div className="swimmer-admin-row">
      {/* Header row */}
      <div className="swimmer-admin-header">
        {editing ? (
          <div className="inline-edit">
            <input
              className="input"
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setEditError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setEditName(swimmer.name); }}>Cancel</button>
          </div>
        ) : (
          <>
            <div>
              <div className="swimmer-admin-name">{swimmer.name}</div>
              <div className="text-sm text-secondary">{Object.keys(myTimes).length} time{Object.keys(myTimes).length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setExpanded((p) => !p)}>
                {expanded ? 'Hide' : 'Times'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
            </div>
          </>
        )}
      </div>
      {editError && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 6 }}>{editError}</div>}

      {/* Times section */}
      {expanded && (
        <div className="mt-12">
          {events.length > 0 && (
            <div className="swimmer-times-section">
              {/* Existing times */}
              {events
                .filter((e) => myTimes[e.id] != null)
                .map((event) => (
                  <div key={event.id} className="swimmer-time-event-row">
                    <span style={{ flex: 1, fontSize: 14 }}>{event.name}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums', marginRight: 8 }}>
                      {formatTime(myTimes[event.id])}s
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirmDeleteTime({ eventId: event.id, name: event.name })}
                    >
                      ×
                    </button>
                  </div>
                ))}

              {/* Add time form */}
              <div style={{ padding: '10px 12px', borderTop: events.filter((e) => myTimes[e.id] != null).length > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <select
                    className="select"
                    style={{ flex: 2, minWidth: 0, fontSize: 13, padding: '8px 32px 8px 10px' }}
                    value={addingTimeEventId}
                    onChange={(e) => { setAddingTimeEventId(e.target.value); setAddingTimeError(''); }}
                  >
                    <option value="">Event…</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 80, fontSize: 13 }}
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    placeholder="Seconds"
                    value={addingTimeValue}
                    onChange={(e) => { setAddingTimeValue(e.target.value); setAddingTimeError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && addTime()}
                  />
                  <button className="btn btn-primary btn-sm" onClick={addTime}>Add</button>
                </div>
                {addingTimeError && (
                  <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{addingTimeError}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm swimmer delete */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${swimmer.name}?`}
          body="This will remove the swimmer and all their recorded times permanently."
          onConfirm={() => {
            dispatch({ type: 'DELETE_SWIMMER', swimmerId: swimmer.id });
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Confirm time delete */}
      {confirmDeleteTime && (
        <ConfirmDialog
          title="Delete this time?"
          body={`Remove ${swimmer.name}'s time for ${confirmDeleteTime.name}?`}
          onConfirm={() => {
            dispatch({ type: 'DELETE_SWIMMER_TIME', swimmerId: swimmer.id, eventId: confirmDeleteTime.eventId });
            setConfirmDeleteTime(null);
          }}
          onCancel={() => setConfirmDeleteTime(null)}
        />
      )}
    </div>
  );
}

export default function SwimmersAdmin() {
  const { state, dispatch } = useStore();
  const { swimmers, events, swimmerTimes } = state;

  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  function handleAdd() {
    const name = newName.trim();
    if (!name) { setError('Name cannot be empty.'); return; }
    if (swimmers.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setError('A swimmer with that name already exists.');
      return;
    }
    dispatch({ type: 'ADD_SWIMMER', name });
    setNewName('');
    setError('');
  }

  return (
    <div className="pb-16">
      {/* Add swimmer */}
      <div className="section mt-16">
        <div className="card">
          <div className="card-header">Add Swimmer</div>
          <div className="admin-form">
            <input
              className="input"
              placeholder="Swimmer name"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
            <button className="btn btn-primary btn-full" onClick={handleAdd}>Add Swimmer</button>
          </div>
        </div>
      </div>

      {/* Swimmer list */}
      <div className="section mt-12">
        <div className="card">
          <div className="card-header">
            My Swimmers
            <span className="badge badge-gray">{swimmers.length}</span>
          </div>
          {swimmers.length === 0 ? (
            <div style={{ padding: '20px 16px', color: 'var(--text-secondary)', fontSize: 14 }}>
              No swimmers added yet.
            </div>
          ) : (
            swimmers.map((swimmer) => (
              <SwimmerRow
                key={swimmer.id}
                swimmer={swimmer}
                events={events}
                swimmerTimes={swimmerTimes}
                dispatch={dispatch}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
