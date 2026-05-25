import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const BASE = '/kuku-oukoku';

if (typeof window !== 'undefined') {
  const p = window.location.pathname;
  if (p === BASE) {
    window.history.replaceState(null, '', BASE + '/');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
