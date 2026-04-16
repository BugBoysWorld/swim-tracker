const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'placement', label: 'Placement', icon: '🏅' },
  { id: 'admin',     label: 'Admin',     icon: '⚙️' },
  { id: 'help',      label: 'Help',      icon: '❓' },
];

export default function BottomNav({ current, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`nav-btn${current === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
