import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // just import CSS, no assignment
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
