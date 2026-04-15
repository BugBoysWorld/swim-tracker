import { useState, useRef } from 'react';
import { useStore } from '../../store.jsx';
import { formatTime } from '../../utils/placement';
import ConfirmDialog from '../ConfirmDialog';

export default function CompetitorTimesAdmin() {
  const { state, dispatch } = useStore();
  const { events, competitorTimes } = state;

  const [selectedEventId, setSelectedEventId] = useState('');
  const [fields, setFields] = useState(['']);
  const [errors, setErrors] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // { eventId, time }
  const inputRefs = useRef([]);

  const existingTimes = selectedEventId ? (competitorTimes[selectedEventId] || []) : [];

  function updateField(idx, val) {
    setFields((prev) => prev.map((f, i) => (i === idx ? val : f)));
    setErrors((prev) => prev.map((e, i) => (i === idx ? '' : e)));
  }

  function addField() {
    setFields((prev) => [...prev, '']);
    setErrors((prev) => [...prev, '']);
    setTimeout(() => {
      const last = inputRefs.current[inputRefs.current.length - 1];
      if (last) last.focus();
    }, 50);
  }

  function removeField(idx) {
    setFields((prev) => prev.filter((_, i) => i !== idx));
    setErrors((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (idx === fields.length - 1) {
        addField();
      } else {
        inputRefs.current[idx + 1]?.focus();
      }
    }
  }

  function handleSubmit() {
    if (!selectedEventId) return;
    const newErrors = fields.map((f) => {
      const n = parseFloat(f);
      if (!f.trim()) return 'Enter a time';
      if (isNaN(n) || n <= 0) return 'Invalid time';
      return '';
    });
    setErrors(newErrors);
    if (newErrors.some(Boolean)) return;

    const times = fields.map((f) => parseFloat(f));
    dispatch({ type: 'ADD_COMPETITOR_TIMES', eventId: selectedEventId, times });
    setFields(['']);
    setErrors([]);
  }

  return (
    <div className="pb-16">
      {/* Event selector */}
      <div className="section mt-16">
        <select
          className="select"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          <option value="">— Select an event —</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Existing times */}
          <div className="section mt-12">
            <div className="card">
              <div className="card-header">
                Competitor Times
                <span className="badge badge-gray">{existingTimes.length}</span>
              </div>
              {existingTimes.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
                  No times added yet.
                </div>
              ) : (
                <div className="times-wrap">
                  {existingTimes.map((t) => (
                    <div key={t} className="time-chip">
                      {formatTime(t)}s
                      <button
                        className="time-chip-delete"
                        onClick={() => setConfirmDelete({ eventId: selectedEventId, time: t })}
                        aria-label={`Delete ${t}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bulk entry */}
          <div className="section mt-12">
            <div className="card">
              <div className="card-header">Add Times (seconds)</div>
              <div className="admin-form">
                {fields.map((val, idx) => (
                  <div key={idx} className="bulk-entry-row">
                    <input
                      ref={(el) => (inputRefs.current[idx] = el)}
                      className={`input${errors[idx] ? ' input-error' : ''}`}
                      style={errors[idx] ? { borderColor: 'var(--danger)' } : {}}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      placeholder={`Time ${idx + 1} (e.g. 27.5)`}
                      value={val}
                      onChange={(e) => updateField(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                    />
                    {fields.length > 1 && (
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => removeField(idx)}
                        style={{ flexShrink: 0 }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {errors.some(Boolean) && (
                  <div style={{ color: 'var(--danger)', fontSize: 13 }}>Please fix invalid entries.</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" onClick={addField} style={{ flex: 1 }}>+ Add Row</button>
                  <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>Save Times</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this time?"
          body={`Remove ${formatTime(confirmDelete.time)}s from the competitor list? This will update placements immediately.`}
          confirmLabel="Delete"
          onConfirm={() => {
            dispatch({ type: 'DELETE_COMPETITOR_TIME', eventId: confirmDelete.eventId, time: confirmDelete.time });
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
