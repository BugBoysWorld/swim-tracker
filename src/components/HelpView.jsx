export default function HelpView() {
  return (
    <>
      <div className="header">
        <h1>❓ Help</h1>
        <div className="header-sub">How to use Swim Tracker</div>
      </div>

      <div className="screen pb-16">

        <div className="section mt-16">
          <div className="card">
            <div className="card-header">Getting Started</div>
            <div className="help-body">
              <p>Swim Tracker helps coaches see where their swimmers rank against a competitor field — right at the meet.</p>
              <ol>
                <li>Add your events in <strong>Admin → Events</strong>.</li>
                <li>Add your swimmers in <strong>Admin → My Swimmers</strong>.</li>
                <li>Load competitor times for each event in <strong>Admin → Comp. Times</strong>.</li>
                <li>Record your swimmers&apos; times in <strong>Admin → My Swimmers</strong>.</li>
                <li>View live placements in <strong>Placement</strong> or on the <strong>Dashboard</strong>.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="section mt-12">
          <div className="card">
            <div className="card-header">Adding Events</div>
            <div className="help-body">
              <p>20 standard Boys/Girls events are pre-loaded (50/100/200/500 Free, 50/100 Back/Breast/Fly). You can also add custom events with any name.</p>
              <p>To delete an event, tap the trash icon next to it. This removes all competitor times and swimmer times for that event.</p>
            </div>
          </div>
        </div>

        <div className="section mt-12">
          <div className="card">
            <div className="card-header">Adding & Managing Swimmers</div>
            <div className="help-body">
              <p>Go to <strong>Admin → My Swimmers</strong> to add, rename, or remove swimmers.</p>
              <p>Tap a swimmer&apos;s name to expand their event time entry form. Enter their time in decimal seconds (e.g. <code>27.5</code> for 27.5 seconds).</p>
              <p>You can import a whole roster at once using a CSV file — see <strong>Admin → Import/Export → Import Swimmers</strong>.</p>
            </div>
          </div>
        </div>

        <div className="section mt-12">
          <div className="card">
            <div className="card-header">Loading Competitor Times</div>
            <div className="help-body">
              <p>Go to <strong>Admin → Comp. Times</strong>, select an event, then:</p>
              <ul>
                <li><strong>Individual entry</strong> — enter one time with an optional competitor name and school/team.</li>
                <li><strong>Bulk entry</strong> — paste multiple times (one per row) quickly.</li>
                <li><strong>CSV import</strong> — go to <strong>Admin → Import/Export → Import Competitor Times</strong> to upload a spreadsheet with columns: Event, Time, Name, School.</li>
              </ul>
              <p>All times are deduplicated. Deleting a time updates placements immediately.</p>
            </div>
          </div>
        </div>

        <div className="section mt-12">
          <div className="card">
            <div className="card-header">Reading the Placement View</div>
            <div className="help-body">
              <p>Go to <strong>Placement</strong>, select a swimmer, and tap any event to expand it.</p>
              <p>The view shows:</p>
              <ul>
                <li><strong>#1 time</strong> — the fastest competitor, always shown in gold.</li>
                <li><strong>Up to 3 faster times</strong> — the closest competitors ahead of your swimmer.</li>
                <li><strong>Your swimmer&apos;s time</strong> — highlighted in blue with a ▶ indicator.</li>
                <li><strong>Up to 3 slower times</strong> — the closest competitors behind your swimmer.</li>
              </ul>
              <p>If a competitor has a name or school attached, it appears next to their time.</p>
            </div>
          </div>
        </div>

        <div className="section mt-12">
          <div className="card">
            <div className="card-header">Importing &amp; Exporting Data</div>
            <div className="help-body">
              <p>Go to <strong>Admin → Import/Export</strong> to access all import and export features.</p>
              <p><strong>Export Backup</strong> — saves all your data as a <code>.json</code> file. Use this to back up before a meet or transfer to another device.</p>
              <p><strong>Import Backup</strong> — restores from a previously exported <code>.json</code> file. <em>This replaces all current data.</em></p>
              <p><strong>CSV imports</strong> — download a template for each import type to see the required column format:</p>
              <ul>
                <li><strong>Competitor Times</strong>: Event, Time, Name (optional), School (optional)</li>
                <li><strong>Swimmers</strong>: Name</li>
                <li><strong>Swimmer Times</strong>: SwimmerName, EventName, Time</li>
              </ul>
              <p>Event and swimmer names in CSV files must match existing names exactly (case-insensitive).</p>
            </div>
          </div>
        </div>

        <div className="section mt-12">
          <div className="card">
            <div className="card-header">Offline Use &amp; Installing the App</div>
            <div className="help-body">
              <p>All data is stored on your device — no internet connection is needed once the app has loaded. An amber banner appears at the top when you are offline.</p>
              <p><strong>Install on Android:</strong> Tap the install banner or use your browser menu → "Add to Home Screen."</p>
              <p><strong>Install on iPhone/iPad:</strong> Tap the Share button in Safari, then "Add to Home Screen." The installed app runs in standalone mode (no browser chrome).</p>
              <p>To reset all data, clear <code>swimTracker_v2</code> from your browser&apos;s localStorage (DevTools → Application → Local Storage).</p>
            </div>
          </div>
        </div>

        <div className="section mt-12" style={{ paddingBottom: 8 }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', padding: '8px 0' }}>
            Swim Tracker · swimtrack.timrjlove.com
          </div>
        </div>

      </div>
    </>
  );
}
