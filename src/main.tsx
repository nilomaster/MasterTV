import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTizenRemoteKeys } from './services/tizenService'

// Initialize Samsung Smart TV Tizen remote control keys
initTizenRemoteKeys();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
