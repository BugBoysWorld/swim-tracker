import { useState } from 'react';
import { useStore } from '../store.jsx';
import { calculatePlacement, formatTime } from '../utils/placement';

function PlacementDetail({ swimmerTime, competitorTimes }) {
  const result = calculatePlacement(swimmerTime, competitorTimes);

  if (!result) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
        No competitor times loaded for this event.
      </div>
    );
  }

  const { rank, total, displayFaster, displaySlower, showTopSeparator, topTime, sorted } = result;

  const fasterStartRank = sorted.filter((t) => t < displayFaster[0]).length + 1;

  return (
    <div>
      <div className="placement-rank">
        <div className="rank-number">#{rank}</div>
        <div className="rank-of">of {total} competitors</div>
      </div>

      <div className="time-list">
        {/* Always show #1 if not already in displayFaster */}
        {showTopSeparator && (
          <>
            <div className="time-row top-row">
              <span className="time-rank">#1</span>
              <span className="time-value">{formatTime(topTime)}s</span>
            </div>
            <div className="separator-row">
              <div className="separator-line" />
              <span>···</span>
              <div className="separator-line" />
            </div>
          </>
        )}

        {/* Up to 3 faster times */}
        {displayFaster.map((t, i) => {
          const r = fasterStartRank + i;
          return (
            <div key={t} className={`time-row${r === 1 ? ' top-row' : ''}`}>
              <span className="time-rank">#{r}</span>
              <span className="time-value">{formatTime(t)}s</span>
            </div>
          );
        })}

        {/* Swimmer row */}
        <div className="time-row swimmer-row">
          <span className="time-rank">#{rank}</span>
          <span className="time-value">
            {formatTime(swimmerTime)}s
            <span style={{ fontSize: 12, marginLeft: 8, fontWeight: 500, opacity: .8 }}>▶ You</span>
          </span>
        </div>

        {/* Up to 3 slower times */}
        {displaySlower.map((t, i) => (
          <div key={t} className="time-row">
            <span className="time-rank">#{rank + 1 + i}</span>
            <span className="time-value">{formatTime(t)}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlacementView({ initialSwimmerId, initialEventId }) {
  const { state } = useStore();
  const { events, swimmers, swimmerTimes, competitorTimes } = state;

  const [selectedSwimmerId, setSelectedSwimmerId] = useState(initialSwimmerId || '');
  const [expandedEventId, setExpandedEventId] = useState(initialEventId || null);

  const swimmer = swimmers.find((s) => s.id === selectedSwimmerId);
  const myTimes = swimmer ? swimmerTimes[swimmer.id] || {} : {};
  const myEvents = events.filter((e) => myTimes[e.id] != null);

  function toggleEvent(eventId) {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  }

  return (
    <>
      <div className="header">
        <h1>🏅 Placement</h1>
        <div className="header-sub">Compare swimmer times vs competitors</div>
      </div>

      <div className="screen">
        {/* Swimmer selector */}
        <div className="section mt-16">
          <select
            className="select"
            value={selectedSwimmerId}
            onChange={(e) => {
              setSelectedSwimmerId(e.target.value);
              setExpandedEventId(null);
            }}
          >
            <option value="">— Select a swimmer —</option>
            {swimmers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Events */}
        {!swimmer ? (
          <div className="empty mt-16">
            <div className="empty-icon">🏅</div>
            <div className="empty-title">Select a Swimmer</div>
            <div className="empty-sub">Choose a swimmer above to see their placement across events.</div>
          </div>
        ) : myEvents.length === 0 ? (
          <div className="empty mt-16">
            <div className="empty-icon">🕐</div>
            <div className="empty-title">No Times Recorded</div>
            <div className="empty-sub">{swimmer.name} has no event times yet. Add times in Admin → My Swimmers.</div>
          </div>
        ) : (
          <div className="section mt-12 pb-16">
            <div className="card">
              {myEvents.map((event) => {
                const isOpen = expandedEventId === event.id;
                const swimmerTime = myTimes[event.id];
                const compTimes = competitorTimes[event.id] || [];
                const result = compTimes.length > 0 ? calculatePlacement(swimmerTime, compTimes) : null;

                return (
                  <div key={event.id}>
                    <div
                      className="event-expand-row"
                      onClick={() => toggleEvent(event.id)}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{event.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {formatTime(swimmerTime)}s
                          {result ? ` · #${result.rank} of ${result.total}` : ' · No competitor data'}
                        </div>
                      </div>
                      <span className={`chevron${isOpen ? ' open' : ''}`}>⌄</span>
                    </div>
                    {isOpen && (
                      <div className="event-expand-detail">
                        <PlacementDetail swimmerTime={swimmerTime} competitorTimes={compTimes} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
