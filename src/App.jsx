import { useState } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import PlacementView from './components/PlacementView';
import AdminView from './components/admin/AdminView';

export default function App() {
  const [view, setView] = useState('dashboard');
  // Carries context when navigating from Dashboard → Placement
  const [placementContext, setPlacementContext] = useState({ swimmerId: '', eventId: null });

  function navigatePlacement({ swimmerId, eventId }) {
    setPlacementContext({ swimmerId, eventId: eventId || null });
    setView('placement');
  }

  function handleNavChange(newView) {
    setView(newView);
  }

  return (
    <div className="app">
      {view === 'dashboard' && <Dashboard onNavigatePlacement={navigatePlacement} />}
      {view === 'placement' && (
        <PlacementView
          key={`${placementContext.swimmerId}-${placementContext.eventId}`}
          initialSwimmerId={placementContext.swimmerId}
          initialEventId={placementContext.eventId}
        />
      )}
      {view === 'admin' && <AdminView />}

      <BottomNav current={view} onChange={handleNavChange} />
    </div>
  );
}
