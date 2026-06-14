import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Tailwind base utilities
import './tailwind.css'

// map.css first so its html/body rules get overridden by later files
import '@css/map.css'
import '@css/landing.css'
import '@css/auth.css'
import '@css/events-public.css'
import '@css/event-details.css'
import '@css/add-event.css'
import '@css/profile.css'
import '@css/index.css'
import '@css/theme.css'
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
