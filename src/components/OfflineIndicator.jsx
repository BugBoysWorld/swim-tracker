import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: '#F59E0B',
      color: '#1A202C',
      fontSize: 13,
      fontWeight: 600,
      textAlign: 'center',
      padding: '8px 16px',
      zIndex: 300,
      paddingTop: 'calc(8px + env(safe-area-inset-top))',
    }}>
      📶 Offline — all your data is saved locally
    </div>
  );
}
