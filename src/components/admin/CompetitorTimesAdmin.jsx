import { useState, useRef } from 'react';
import { useStore } from '../../store.jsx';
import { formatTime } from '../../utils/placement';
import ConfirmDialog from '../ConfirmDialog';

export default function CompetitorTimesAdmin() {
  const { state, dispatch } = useStore();
  const { events, competitorTimes } = state;

  const [selectedEventId, setSelectedEventId] = useState('');

  // Individual entry form
  const [singleTime, setSingleTime] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleSchool, setSingleSchool] = useState('');
  const [singleError, setSingleError] = useState('');

  // Bulk entry form
  const [fields, setFields] = useState(['']);
  const [errors, setErrors] = useState([]);
  const inputRefs = useRef([]);

  const [confirmDelete, setConfirmDelete] = useState(null); // { eventId, time }

  const existingEntries = selectedEventId ? (competitorTimes[selectedEventId] || []) : [];

  // ── Single entry ──────────────────────────────────────────────────
  function handleSingleSubmit() {
    if (!selectedEventId) return;
    const n = parseFloat(singleTime);
    if (!singleTime.trim() || isNaN(n) || n <= 0) {
      setSingleError('Enter a valid time');
      return;
    }
    setSingleError('');
    dispatch({
      type: 'ADD_COMPETITOR_TIMES',
      eventId: selectedEventId,
      times: [{ time: n, name: singleName.trim(), school: singleSchool.trim() }],
    });
    setSingleTime('');
    setSingleName('');
    setSingleSchool('');
  }

  // ── Bulk entry ────────────────────────────────────────────────────
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

  function handleBulkSubmit() {
    if (!selectedEventId) return;
    const newErrors = fields.map((f) => {
      const n = parseFloat(f);
      if (!f.trim()) return 'Enter a time';
      if (isNaN(n) || n <= 0) return 'Invalid time';
      return '';
    });
    setErrors(newErrors);
    if (newErrors.some(Boolean)) return;

    const times = fields.map((f) => ({ time: parseFloat(f), name: '', school: '' }));
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
                <span className="badge badge-gray">{existingEntries.length}</span>
              </div>
              {existingEntries.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
                  No times added yet.
                </div>
              ) : (
                <div className="times-wrap">
                  {existingEntries.map((entry) => (
                    <div key={entry.time} className="time-chip">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span>{formatTime(entry.time)}s</span>
                        {(entry.name || entry.school) && (
                          <span style={{ fontSize: 10, opacity: 0.75, lineHeight: 1.2 }}>
                            {[entry.name, entry.school].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                      <button
                        className="time-chip-delete"
                        onClick={() => setConfirmDelete({ eventId: selectedEventId, time: entry.time })}
                        aria-label={`Delete ${entry.time}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Individual entry with name + school */}
          <div className="section mt-12">
            <div className="card">
              <div className="card-header">Add Individual Time</div>
              <div className="admin-form">
                <input
                  className={`input${singleError ? ' input-error' : ''}`}
                  style={singleError ? { borderColor: 'var(--danger)' } : {}}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="Time (e.g. 27.5)"
                  value={singleTime}
                  onChange={(e) => { setSingleTime(e.target.value); setSingleError(''); }}
                />
                {singleError && (
                  <div style={{ color: 'var(--danger)', fontSize: 13 }}>{singleError}</div>
                )}
                <input
                  className="input"
                  type="text"
                  placeholder="Competitor name (optional)"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                />
                <input
                  className="input"
                  type="text"
                  placeholder="School / team (optional)"
                  value={singleSchool}
                  onChange={(e) => setSingleSchool(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleSingleSubmit}>Add Time</button>
              </div>
            </div>
          </div>

          {/* Bulk entry (times only, no name/school) */}
          <div className="section mt-12">
            <div className="card">
              <div className="card-header">Bulk Add Times (seconds)</div>
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
                  <button className="btn btn-primary" onClick={handleBulkSubmit} style={{ flex: 2 }}>Save Times</button>
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
