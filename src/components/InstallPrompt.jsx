import { useState, useEffect } from 'react';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Android / Chrome: capture the install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show the manual tip once if not already installed and not already seen
    if (isIOS() && !isStandalone() && !sessionStorage.getItem('iosTipSeen')) {
      setShowIOSTip(true);
    }

    // Hide after install
    const installed = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setDismissed(true);
  }

  function dismissIOSTip() {
    sessionStorage.setItem('iosTipSeen', '1');
    setShowIOSTip(false);
  }

  if (dismissed) return null;

  // Android install button
  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        style={{
          display: 'block',
          width: 'calc(100% - 32px)',
          margin: '8px 16px 0',
          padding: '10px 16px',
          background: 'transparent',
          border: '1.5px solid rgba(255,255,255,0.5)',
          borderRadius: 8,
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        📲 Add to home screen
      </button>
    );
  }

  // iOS tip
  if (showIOSTip) {
    return (
      <div style={{
        margin: '8px 16px 0',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <span style={{ color: 'white', fontSize: 12, lineHeight: 1.4 }}>
          📲 Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to install
        </span>
        <button
          onClick={dismissIOSTip}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 18,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return null;
}
