import { useStore } from '../store.jsx';
import { calculatePlacement, formatTime } from '../utils/placement';

export default function Dashboard({ onNavigatePlacement }) {
  const { state } = useStore();
  const { events, swimmers, competitorTimes, swimmerTimes } = state;

  const eventsWithTimes = events.filter((e) => (competitorTimes[e.id] || []).length > 0).length;

  function getPlacementLabel(swimmerId, eventId) {
    const swimmerTime = swimmerTimes[swimmerId]?.[eventId];
    const compTimes = competitorTimes[eventId] || [];
    if (!swimmerTime || compTimes.length === 0) return null;
    const result = calculatePlacement(swimmerTime, compTimes);
    if (!result) return null;
    return `#${result.rank} of ${result.total}`;
  }

  return (
    <>
      <div className="header">
        <h1>🏊 Swim Tracker</h1>
        <div className="header-sub">Competitive Placement Dashboard</div>
      </div>

      <div className="screen">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{swimmers.length}</div>
            <div className="stat-label">Swimmers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{eventsWithTimes}</div>
            <div className="stat-label">Loaded</div>
          </div>
        </div>

        {/* Swimmer list */}
        <div className="section mt-12 pb-16">
          {swimmers.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🏊</div>
              <div className="empty-title">No Swimmers Yet</div>
              <div className="empty-sub">Add swimmers in Admin → My Swimmers to get started.</div>
            </div>
          ) : (
            swimmers.map((swimmer) => {
              const times = swimmerTimes[swimmer.id] || {};
              const eventIds = Object.keys(times);
              return (
                <div key={swimmer.id} className="swimmer-card">
                  <div
                    className="swimmer-name-row"
                    onClick={() => onNavigatePlacement({ swimmerId: swimmer.id })}
                  >
                    <span className="swimmer-name">{swimmer.name}</span>
                    <span className="text-secondary text-sm">{eventIds.length} event{eventIds.length !== 1 ? 's' : ''} →</span>
                  </div>
                  {eventIds.length === 0 ? (
                    <div className="swimmer-event-row" style={{ cursor: 'default', color: 'var(--text-light)', fontSize: 13 }}>
                      No times recorded
                    </div>
                  ) : (
                    events
                      .filter((e) => times[e.id] != null)
                      .map((event) => {
                        const label = getPlacementLabel(swimmer.id, event.id);
                        return (
                          <div
                            key={event.id}
                            className="swimmer-event-row"
                            onClick={() => onNavigatePlacement({ swimmerId: swimmer.id, eventId: event.id })}
                          >
                            <span className="swimmer-event-name">{event.name}</span>
                            <div className="swimmer-event-meta">
                              <span className="swimmer-time">{formatTime(times[event.id])}s</span>
                              {label && <span className="placement-chip">{label}</span>}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
