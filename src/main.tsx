import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import AppNew from './AppNew.tsx'
import 'leaflet/dist/leaflet.css';
import './utils/fixLeafletIcons';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
</StrictMode>,
)
