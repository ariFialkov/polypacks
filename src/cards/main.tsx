import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '../styles.css';
import './index.css';
import { CardIndex } from './CardIndex';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CardIndex />
  </React.StrictMode>,
);
