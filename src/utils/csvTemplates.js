/**
 * CSV template download utilities.
 * Each function creates a sample CSV file and triggers a browser download.
 */

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download a competitor times CSV template.
 * Columns: Event, Time, Name, School
 * Event must match an existing event name exactly (case-insensitive).
 */
export function downloadCompetitorTimesTemplate() {
  const csv = [
    'Event,Time,Name,School',
    '50 Free Boys,24.50,Alex Johnson,Lincoln High',
    '50 Free Boys,25.10,Maria Lopez,Riverside Academy',
    '100 Free Boys,54.20,,',
  ].join('\n');
  triggerDownload(csv, 'competitor-times-template.csv');
}

/**
 * Download a swimmers CSV template.
 * Columns: Name
 */
export function downloadSwimmersTemplate() {
  const csv = [
    'Name',
    'Alex Johnson',
    'Maria Lopez',
    'Chris Park',
  ].join('\n');
  triggerDownload(csv, 'swimmers-template.csv');
}

/**
 * Download a swimmer times CSV template.
 * Columns: SwimmerName, EventName, Time
 * SwimmerName must match an existing swimmer exactly (case-insensitive).
 * EventName must match an existing event exactly (case-insensitive).
 */
export function downloadSwimmerTimesTemplate() {
  const csv = [
    'SwimmerName,EventName,Time',
    'Alex Johnson,50 Free Boys,24.80',
    'Alex Johnson,100 Free Boys,54.50',
    'Maria Lopez,50 Free Boys,25.30',
  ].join('\n');
  triggerDownload(csv, 'swimmer-times-template.csv');
}
