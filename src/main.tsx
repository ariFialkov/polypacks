import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import App from './App';
import './styles.css';

// Offline support is a bonus: hosts that frame the game in a sandbox or serve it from a file
// cannot register a service worker, and the game must still start.
try {
  if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) registerSW({ immediate: true });
} catch {
  /* no offline cache here */
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
