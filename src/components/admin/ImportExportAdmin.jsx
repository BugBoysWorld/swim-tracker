import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { useStore } from '../../store.jsx';
import {
  validateCompetitorTimesCSV,
  validateSwimmersCSV,
  validateSwimmerTimesCSV,
  validateBackupJSON,
} from '../../utils/importValidation';
import {
  downloadCompetitorTimesTemplate,
  downloadSwimmersTemplate,
  downloadSwimmerTimesTemplate,
} from '../../utils/csvTemplates';
import ConfirmDialog from '../ConfirmDialog';

function StatusMessage({ status }) {
  if (!status) return null;
  const isError = status.type === 'error';
  return (
    <div style={{
      marginTop: 8,
      padding: '10px 12px',
      borderRadius: 8,
      fontSize: 13,
      background: isError ? '#FEF2F2' : '#F0FDF4',
      color: isError ? 'var(--danger)' : '#166534',
      border: `1px solid ${isError ? '#FECACA' : '#BBF7D0'}`,
    }}>
      {status.message}
    </div>
  );
}

function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

export default function ImportExportAdmin() {
  const { state, dispatch } = useStore();
  const { events, swimmers } = state;

  // File input refs
  const backupImportRef = useRef(null);
  const compTimesRef = useRef(null);
  const swimmersRef = useRef(null);
  const swimmerTimesRef = useRef(null);

  // Per-card status messages
  const [compTimesStatus, setCompTimesStatus] = useState(null);
  const [swimmersStatus, setSwimmersStatus] = useState(null);
  const [swimmerTimesStatus, setSwimmerTimesStatus] = useState(null);
  const [backupImportStatus, setBackupImportStatus] = useState(null);

  // Backup import confirm
  const [pendingBackup, setPendingBackup] = useState(null);

  // ── Export backup ──────────────────────────────────────────────────
  function handleExport() {
    const date = new Intl.DateTimeFormat('en-CA').format(new Date());
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swim-tracker-backup-${date}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Import backup ──────────────────────────────────────────────────
  async function handleBackupFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const { ok, errors } = validateBackupJSON(parsed);
      if (!ok) {
        setBackupImportStatus({ type: 'error', message: `Invalid backup file:\n${errors.join('\n')}` });
        return;
      }
      setPendingBackup(parsed);
    } catch {
      setBackupImportStatus({ type: 'error', message: 'Could not read file. Make sure it is a valid JSON backup.' });
    }
  }

  function confirmBackupImport() {
    dispatch({ type: 'IMPORT_BACKUP', state: pendingBackup });
    setPendingBackup(null);
    setBackupImportStatus({ type: 'success', message: 'Backup imported successfully. All data has been restored.' });
  }

  // ── Import competitor times ────────────────────────────────────────
  async function handleCompTimesFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCompTimesStatus(null);
    try {
      const rows = await parseCsvFile(file);
      const { valid, errors } = validateCompetitorTimesCSV(rows, events);

      if (valid.length === 0) {
        setCompTimesStatus({
          type: 'error',
          message: `No valid rows found.${errors.length ? '\n' + errors.slice(0, 5).join('\n') : ''}`,
        });
        return;
      }

      // Group by eventId and dispatch
      const byEvent = {};
      for (const entry of valid) {
        if (!byEvent[entry.eventId]) byEvent[entry.eventId] = [];
        byEvent[entry.eventId].push({ time: entry.time, name: entry.name, school: entry.school });
      }
      for (const [eventId, times] of Object.entries(byEvent)) {
        dispatch({ type: 'ADD_COMPETITOR_TIMES', eventId, times });
      }

      const msg = `Imported ${valid.length} time${valid.length !== 1 ? 's' : ''} across ${Object.keys(byEvent).length} event${Object.keys(byEvent).length !== 1 ? 's' : ''}.${errors.length ? `\n${errors.length} row${errors.length !== 1 ? 's' : ''} skipped.` : ''}`;
      setCompTimesStatus({ type: 'success', message: msg });
    } catch {
      setCompTimesStatus({ type: 'error', message: 'Could not parse file. Make sure it is a valid CSV.' });
    }
  }

  // ── Import swimmers ────────────────────────────────────────────────
  async function handleSwimmersFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setSwimmersStatus(null);
    try {
      const rows = await parseCsvFile(file);
      const { valid, errors } = validateSwimmersCSV(rows);

      if (valid.length === 0) {
        setSwimmersStatus({
          type: 'error',
          message: `No valid rows found.${errors.length ? '\n' + errors.slice(0, 5).join('\n') : ''}`,
        });
        return;
      }

      dispatch({ type: 'BATCH_ADD_SWIMMERS', names: valid });

      const msg = `Imported ${valid.length} swimmer${valid.length !== 1 ? 's' : ''}.${errors.length ? `\n${errors.length} row${errors.length !== 1 ? 's' : ''} skipped.` : ''}`;
      setSwimmersStatus({ type: 'success', message: msg });
    } catch {
      setSwimmersStatus({ type: 'error', message: 'Could not parse file. Make sure it is a valid CSV.' });
    }
  }

  // ── Import swimmer times ───────────────────────────────────────────
  async function handleSwimmerTimesFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setSwimmerTimesStatus(null);
    try {
      const rows = await parseCsvFile(file);
      const { valid, errors } = validateSwimmerTimesCSV(rows, swimmers, events);

      if (valid.length === 0) {
        setSwimmerTimesStatus({
          type: 'error',
          message: `No valid rows found.${errors.length ? '\n' + errors.slice(0, 5).join('\n') : ''}`,
        });
        return;
      }

      dispatch({ type: 'BATCH_SET_SWIMMER_TIMES', entries: valid });

      const msg = `Imported ${valid.length} time${valid.length !== 1 ? 's' : ''}.${errors.length ? `\n${errors.length} row${errors.length !== 1 ? 's' : ''} skipped.` : ''}`;
      setSwimmerTimesStatus({ type: 'success', message: msg });
    } catch {
      setSwimmerTimesStatus({ type: 'error', message: 'Could not parse file. Make sure it is a valid CSV.' });
    }
  }

  return (
    <div className="pb-16">

      {/* Export Backup */}
      <div className="section mt-16">
        <div className="card">
          <div className="card-header">Export Backup</div>
          <div style={{ padding: '0 16px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Download all your data (events, swimmers, times) as a JSON file. Use this to back up your data or transfer it to another device.
            </p>
            <button className="btn btn-primary" onClick={handleExport}>
              Download Backup
            </button>
          </div>
        </div>
      </div>

      {/* Import Backup */}
      <div className="section mt-12">
        <div className="card">
          <div className="card-header">Import Backup</div>
          <div style={{ padding: '0 16px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Restore from a previously exported backup file. <strong>This will replace all current data.</strong>
            </p>
            <input
              ref={backupImportRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleBackupFile}
            />
            <button className="btn btn-ghost" onClick={() => backupImportRef.current?.click()}>
              Choose Backup File (.json)
            </button>
            <StatusMessage status={backupImportStatus} />
          </div>
        </div>
      </div>

      {/* Import Competitor Times */}
      <div className="section mt-12">
        <div className="card">
          <div className="card-header">Import Competitor Times</div>
          <div style={{ padding: '0 16px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Upload a CSV with columns: <strong>Event, Time, Name, School</strong>. Name and School are optional. Event must match an existing event name exactly.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                ref={compTimesRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleCompTimesFile}
              />
              <button className="btn btn-primary" onClick={() => compTimesRef.current?.click()}>
                Choose CSV File
              </button>
              <button className="btn btn-ghost" onClick={downloadCompetitorTimesTemplate}>
                Download Template
              </button>
            </div>
            <StatusMessage status={compTimesStatus} />
          </div>
        </div>
      </div>

      {/* Import Swimmers */}
      <div className="section mt-12">
        <div className="card">
          <div className="card-header">Import Swimmers</div>
          <div style={{ padding: '0 16px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Upload a CSV with a single column: <strong>Name</strong>. Duplicate names are ignored.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                ref={swimmersRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleSwimmersFile}
              />
              <button className="btn btn-primary" onClick={() => swimmersRef.current?.click()}>
                Choose CSV File
              </button>
              <button className="btn btn-ghost" onClick={downloadSwimmersTemplate}>
                Download Template
              </button>
            </div>
            <StatusMessage status={swimmersStatus} />
          </div>
        </div>
      </div>

      {/* Import Swimmer Times */}
      <div className="section mt-12">
        <div className="card">
          <div className="card-header">Import Swimmer Times</div>
          <div style={{ padding: '0 16px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Upload a CSV with columns: <strong>SwimmerName, EventName, Time</strong>. Swimmer and event names must already exist in the app.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                ref={swimmerTimesRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleSwimmerTimesFile}
              />
              <button className="btn btn-primary" onClick={() => swimmerTimesRef.current?.click()}>
                Choose CSV File
              </button>
              <button className="btn btn-ghost" onClick={downloadSwimmerTimesTemplate}>
                Download Template
              </button>
            </div>
            <StatusMessage status={swimmerTimesStatus} />
          </div>
        </div>
      </div>

      {/* Confirm backup import dialog */}
      {pendingBackup && (
        <ConfirmDialog
          title="Replace all data?"
          body="This will overwrite all your current events, swimmers, and times with the backup. This cannot be undone."
          confirmLabel="Import Backup"
          onConfirm={confirmBackupImport}
          onCancel={() => setPendingBackup(null)}
        />
      )}
    </div>
  );
}
