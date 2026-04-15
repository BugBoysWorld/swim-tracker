import { useState } from 'react';
import EventsAdmin from './EventsAdmin';
import CompetitorTimesAdmin from './CompetitorTimesAdmin';
import SwimmersAdmin from './SwimmersAdmin';

const TABS = [
  { id: 'events', label: 'Events' },
  { id: 'competitors', label: 'Comp. Times' },
  { id: 'swimmers', label: 'My Swimmers' },
];

export default function AdminView() {
  const [tab, setTab] = useState('events');

  return (
    <>
      <div className="header">
        <h1>⚙️ Admin</h1>
        <div className="header-sub">Manage events, times, and swimmers</div>
      </div>

      <div className="screen">
        <div className="section mt-16">
          <div className="segmented">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`seg-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'events' && <EventsAdmin />}
        {tab === 'competitors' && <CompetitorTimesAdmin />}
        {tab === 'swimmers' && <SwimmersAdmin />}
      </div>
    </>
  );
}
