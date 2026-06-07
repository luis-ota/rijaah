import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const rootEl = document.getElementById('root');

import App from './App.tsx';

import './index.css';

createRoot(rootEl!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
