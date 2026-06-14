import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import { API_BASE, formatDate } from '../utils/helpers.js'

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ZAGREB_CENTER = [45.8150, 15.9820]

const NEIGHBORHOOD_COORDS = {
  'Gornji grad': [45.8150, 15.9760], 'Donji grad': [45.8104, 15.9776],
  'Maksimir': [45.8200, 16.0200], 'Trnje': [45.7980, 15.9850],
  'Trešnjevka': [45.8050, 15.9450], 'Črnomerec': [45.8250, 15.9350],
  'Stenjevec': [45.8150, 15.8900], 'Podsused': [45.8300, 15.8600],
  'Sesvete': [45.8350, 16.1050], 'Novi Zagreb': [45.7750, 15.9700],
  'Dubrava': [45.8350, 16.0600], 'Peščenica': [45.8000, 16.0200],
  'Jarun': [45.7900, 15.9300], 'Špansko': [45.8100, 15.9100],
  'Medveščak': [45.8280, 15.9850], 'Gornja Dubrava': [45.8400, 16.0750],
  'Donja Dubrava': [45.8150, 16.0650], 'Botinec': [45.7700, 15.9200],
}

const DEFAULT_SPREAD = [
  [45.8104, 15.9776], [45.8200, 16.0200], [45.7980, 15.9850],
  [45.8050, 15.9450], [45.8250, 15.9350], [45.8280, 15.9850],
  [45.8000, 16.0200], [45.7900, 15.9300], [45.8350, 16.0600],
]

const CAT_EMOJI = {
  glazba: '🎵', koncert: '🎵', sport: '⚽', yoga: '🧘',
  radionica: '🛠️', kultura: '🎭', hrana: '🍽️', priroda: '🌿',
  djeca: '👶', tech: '💻', volontiranje: '🤝', ostalo: '📌',
}

function getCategoryEmoji(cat) {
  if (!cat) return '📌'
  const key = cat.toLowerCase()
  for (const [k, v] of Object.entries(CAT_EMOJI)) {
    if (key.includes(k)) return v
  }
  return '📌'
}

function getCoordsForEvent(event, allEvents) {
  if (event.neighborhood) {
    for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
      if (event.neighborhood.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(event.neighborhood.toLowerCase())) {
        return [coords[0] + (Math.random() - 0.5) * 0.008, coords[1] + (Math.random() - 0.5) * 0.008]
      }
    }
  }
  const idx = allEvents.indexOf(event) % DEFAULT_SPREAD.length
  const base = DEFAULT_SPREAD[idx]
  return [base[0] + (Math.random() - 0.5) * 0.01, base[1] + (Math.random() - 0.5) * 0.01]
}

function createMarkerIcon(event, isActive = false) {
  const emoji = getCategoryEmoji(event.category)
  return L.divIcon({
    className: '',
    html: `<div class="custom-marker${isActive ? ' active-marker' : ''}"><span class="marker-inner">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

export default function MapPage() {
  const { user } = useAuth()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  const [allEvents, setAllEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [catFilter, setCatFilter] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [drawer, setDrawer] = useState(null)
  const [sidebarCount, setSidebarCount] = useState('Učitavanje...')

  // Body overflow for map fixed layout
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current) return
    const map = L.map(mapRef.current, { center: ZAGREB_CENTER, zoom: 13, zoomControl: false })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.on('click', () => { setDrawer(null); setActiveId(null) })
    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  async function loadData() {
    try {
      const [evRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/events${user?.id ? `?viewer_user_id=${user.id}` : ''}`),
        fetch(`${API_BASE}/categories`),
      ])
      const evs = evRes.ok ? await evRes.json() : []
      const cats = catRes.ok ? await catRes.json() : []
      setAllEvents(evs)
      setCategories(cats)
      placeMarkers(evs, evs)
      renderSidebar(evs)
    } catch {}
  }

  useEffect(() => { loadData() }, [user?.id])

  function placeMarkers(events, allEvs) {
    if (!mapInstanceRef.current) return
    markersRef.current.forEach(m => m.marker.remove())
    markersRef.current = []
    events.forEach(event => {
      const coords = getCoordsForEvent(event, allEvs || events)
      const marker = L.marker(coords, { icon: createMarkerIcon(event) })
      const { full } = formatDate(event.event_date)
      const loc = [event.neighborhood, event.city].filter(Boolean).join(', ')
      marker.bindPopup(`
        <div class="map-popup">
          <div class="popup-cat">${event.category || 'Ostalo'}</div>
          <div class="popup-title">${event.title}</div>
          <div class="popup-meta">
            <div class="popup-meta-row">📅 ${full}</div>
            <div class="popup-meta-row">📍 ${loc || 'Zagreb'}</div>
            ${event.address ? `<div class="popup-meta-row">🏠 ${event.address}</div>` : ''}
            <div class="popup-meta-row">👥 ${event.attendee_count || 0} prijavljenih</div>
          </div>
          <a class="popup-link" href="/events/${event.id}">Pogledaj detalje →</a>
        </div>`, { maxWidth: 240 })
      marker.on('click', ev => {
        L.DomEvent.stopPropagation(ev)
        setActiveId(event.id)
        setDrawer(event)
      })
      marker.addTo(mapInstanceRef.current)
      markersRef.current.push({ id: event.id, marker, coords })
    })
  }

  function renderSidebar(events) {
    const n = events.length
    setSidebarCount(`${n} ${n === 1 ? 'događaj' : 'događaja'} u Zagrebu`)
  }

  useEffect(() => {
    const filtered = catFilter
      ? allEvents.filter(e => (e.category || '').toLowerCase() === catFilter)
      : allEvents
    placeMarkers(filtered, allEvents)
    renderSidebar(filtered)
  }, [catFilter, allEvents])

  function flyToEvent(event) {
    const m = markersRef.current.find(m => m.id === event.id)
    if (m && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(m.coords, 15, { duration: 0.8 })
      setTimeout(() => m.marker.openPopup(), 850)
    }
  }

  const displayEvents = catFilter
    ? allEvents.filter(e => (e.category || '').toLowerCase() === catFilter)
    : allEvents

  return (
    <>
      <Header activePage="map" />

      <div className="map-shell">
        <aside className={`map-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-top">
            <h1 className="sidebar-title">Događaji na karti</h1>
            <p className="sidebar-subtitle">{sidebarCount}</p>
          </div>

          <div className="sidebar-filters">
            <div className="filter-group">
              <label className="filter-label">Kategorija</label>
              <div className="select-wrap">
                <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                  <option value="">Sve kategorije</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name.toLowerCase()}>{c.name}</option>
                  ))}
                </select>
                <svg className="select-arrow" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {displayEvents.length === 0 ? (
            <div className="sidebar-empty">
              <span className="sidebar-empty-icon">📭</span>
              <p>Nema događaja za odabrane filtere.</p>
            </div>
          ) : (
            <div className="sidebar-list">
              {displayEvents.map(e => {
                const { day, month } = formatDate(e.event_date)
                const loc = [e.neighborhood, e.city].filter(Boolean).join(', ')
                return (
                  <div
                    key={e.id}
                    className={`sidebar-item${activeId === e.id ? ' active' : ''}`}
                    onClick={() => {
                      setActiveId(e.id); setDrawer(e)
                      flyToEvent(e)
                      setSidebarOpen(false)
                    }}
                  >
                    <div className="sidebar-item-date">
                      <span className="si-day">{day}</span>
                      <span className="si-mon">{month}</span>
                    </div>
                    <div className="sidebar-item-info">
                      <span className="si-cat">{e.category || 'Ostalo'}</span>
                      <span className="si-title">{e.title}</span>
                      <span className="si-loc">📍 {loc || 'Zagreb'}</span>
                    </div>
                    <span className="si-attendees">👥 {e.attendee_count || 0}</span>
                  </div>
                )
              })}
            </div>
          )}
        </aside>

        <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Prikaži listu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Lista
          <span className="sidebar-toggle-count">{displayEvents.length}</span>
        </button>

        <div className="map-container" ref={mapRef}></div>
      </div>

      {/* EVENT DRAWER */}
      {drawer && (
        <div className={`event-drawer open`}>
          <div className="event-drawer-inner">
            <button className="drawer-close" onClick={() => { setDrawer(null); setActiveId(null) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="drawer-category">{drawer.category || 'Ostalo'}</div>
            <h2 className="drawer-title">{drawer.title}</h2>
            <div className="drawer-meta">
              <span className="drawer-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {formatDate(drawer.event_date).full}
              </span>
              <span className="drawer-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {[drawer.neighborhood, drawer.city].filter(Boolean).join(', ') || 'Zagreb'}
              </span>
              <span className="drawer-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
                {drawer.attendee_count || 0} prijavljenih
              </span>
            </div>
            <p className="drawer-desc">{drawer.description || 'Nema opisa.'}</p>
            <div className="drawer-actions">
              <a className="drawer-cta" href={`/events/${drawer.id}`}>Pogledaj detalje →</a>
              <a
                className="drawer-maps-btn"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [drawer.address, drawer.neighborhood, drawer.city].filter(Boolean).join(', ') || 'Zagreb'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Odvedi me tamo
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
