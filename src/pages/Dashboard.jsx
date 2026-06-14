import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Header from '../components/Header.jsx'
import { API_BASE } from '../utils/helpers.js'

const MONTHS_HR = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec']

function formatDate(dateStr) {
  if (!dateStr) return { day: '?', month: '?' }
  const d = new Date(dateStr)
  return { day: d.getDate(), month: MONTHS_HR[d.getMonth()] }
}

export default function Dashboard() {
  const { user, authHeaders } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ title: '', description: '', event_date: '', categoryId: '', cityId: '', neighborhoodId: '' })
  const [cities, setCities] = useState([])
  const [neighborhoods, setNeighborhoods] = useState([])
  const [categories, setCategories] = useState([])

  const [filterCity, setFilterCity] = useState('')
  const [filterNeighborhood, setFilterNeighborhood] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCities, setFilterCities] = useState([])
  const [filterNeighborhoods, setFilterNeighborhoods] = useState([])

  async function fetchEvents(extraParams = {}) {
    setLoading(true)
    const params = new URLSearchParams()
    if (user?.id) params.append('viewer_user_id', user.id)
    Object.entries(extraParams).forEach(([k, v]) => { if (v) params.append(k, v) })
    try {
      const res = await fetch(`${API_BASE}/events${params.toString() ? `?${params}` : ''}`)
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      showToast('Greška kod učitavanja.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function init() {
      const [catRes, citRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/cities`),
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (citRes.ok) {
        const c = await citRes.json()
        setCities(c)
        setFilterCities(c)
      }
      await fetchEvents()
    }
    init()
  }, [user?.id])

  async function loadNeighborhoods(cityId) {
    if (!cityId) { setNeighborhoods([]); return }
    const res = await fetch(`${API_BASE}/neighborhoods?city_id=${cityId}`)
    if (res.ok) setNeighborhoods(await res.json())
  }

  async function loadFilterNeighborhoods(cityId) {
    if (!cityId) { setFilterNeighborhoods([]); return }
    const res = await fetch(`${API_BASE}/neighborhoods?city_id=${cityId}`)
    if (res.ok) setFilterNeighborhoods(await res.json())
  }

  async function handleJoin(eventId) {
    if (!user?.id) { navigate('/login'); return }
    const res = await fetch(`${API_BASE}/events/${eventId}/join`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
    showToast(data.message || 'Prijava uspješna.', 'success')
    await fetchEvents({ city_id: filterCity, neighborhood_id: filterNeighborhood, category_id: filterCategory })
  }

  async function handleLeave(eventId) {
    if (!user?.id) return
    const res = await fetch(`${API_BASE}/events/${eventId}/join`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
    showToast(data.message || 'Odjava uspješna.', 'success')
    await fetchEvents({ city_id: filterCity, neighborhood_id: filterNeighborhood, category_id: filterCategory })
  }

  async function handleDelete(eventId) {
    if (!user?.id) return
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
    showToast(data.message || 'Event obrisan.', 'success')
    await fetchEvents({ city_id: filterCity, neighborhood_id: filterNeighborhood, category_id: filterCategory })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user?.id) { showToast('Prijavi se kako bi mogao dodavati događaje.', 'error'); navigate('/login'); return }
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        event_date: form.event_date,
        category_id: form.categoryId,
        neighborhood_id: form.neighborhoodId,
      }),
    })
    if (res.ok) {
      showToast('Event uspješno dodan!', 'success')
      setForm({ title: '', description: '', event_date: '', categoryId: '', cityId: '', neighborhoodId: '' })
      setNeighborhoods([])
      await fetchEvents()
    } else {
      const err = await res.json()
      showToast(err.error || 'Greška kod dodavanja.', 'error')
    }
  }

  const countText = events.length === 1 ? '1 događaj' : `${events.length} događaja`

  return (
    <>
      <div className="bg-grid"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <Header activePage="dashboard" />

      <div className="layout-shell">
        <div className="layout">
          <aside className="sidebar">
            <div className="panel">
              <div className="panel-label">Novi event</div>
              <div className="panel-title">Objavi nešto u svom kvartu.</div>
              <p className="panel-copy">Dodaj događaj kroz kratku formu i odmah će se pojaviti na listi zajednice.</p>

              <form id="eventForm" onSubmit={handleSubmit}>
                <div className="field">
                  <label>Naziv</label>
                  <input type="text" placeholder="Naziv eventa" required
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Opis</label>
                  <textarea placeholder="Kratki opis..."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Datum</label>
                  <input type="date" required
                    value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Grad</label>
                  <select required value={form.cityId} onChange={e => {
                    setForm(f => ({ ...f, cityId: e.target.value, neighborhoodId: '' }))
                    loadNeighborhoods(e.target.value)
                  }}>
                    <option value="">Odaberi grad</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Kvart</label>
                  <select required value={form.neighborhoodId} onChange={e => setForm(f => ({ ...f, neighborhoodId: e.target.value }))}
                    disabled={neighborhoods.length === 0}>
                    <option value="">Odaberi kvart</option>
                    {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Kategorija</label>
                  <select required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">Odaberi kategoriju</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary">
                  <span className="btn-icon">+</span> Dodaj event
                </button>
              </form>
            </div>

            <div className="panel panel-filters">
              <div className="panel-label">Filtriraj</div>
              <div className="panel-title panel-title-small">Pronađi događaje po lokaciji i kategoriji.</div>
              <div className="field">
                <label>Grad</label>
                <select value={filterCity} onChange={e => {
                  setFilterCity(e.target.value)
                  setFilterNeighborhood('')
                  loadFilterNeighborhoods(e.target.value)
                }}>
                  <option value="">Svi gradovi</option>
                  {filterCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Kvart</label>
                <select value={filterNeighborhood} onChange={e => setFilterNeighborhood(e.target.value)}>
                  <option value="">Svi kvartovi</option>
                  {filterNeighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Aktivnost</label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">Sve aktivnosti</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button className="btn-secondary" onClick={() => fetchEvents({ city_id: filterCity, neighborhood_id: filterNeighborhood, category_id: filterCategory })}>
                Primijeni filtere
              </button>
            </div>
          </aside>

          <main className="events-main">
            <div className="events-panel">
              <div className="events-header">
                <div>
                  <div className="events-eyebrow">Prijavljeni pregled</div>
                  <h1>Događaji zajednice</h1>
                </div>
                <span className="event-count">{loading ? '...' : countText}</span>
              </div>

              <div className="events-grid">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Učitavanje događaja...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">○</div>
                    <p>Nema događaja za odabrane filtere.</p>
                  </div>
                ) : events.map((event, i) => {
                  const { day, month } = formatDate(event.event_date)
                  const isOwner = user && event.user_id === user.id
                  return (
                    <div key={event.id} className="event-card" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="event-card-body">
                        <div className="event-card-title">{event.title}</div>
                        {event.description && <div className="event-card-desc">{event.description}</div>}
                        <div className="event-card-meta">
                          <span className="meta-tag category">{event.category}</span>
                          <span className="meta-tag">{event.neighborhood}</span>
                          <span className="meta-tag">{event.city}</span>
                        </div>
                        <div className="event-card-footer">
                          <span className="meta-tag">{event.attendee_count || 0} dolazi</span>
                          <div className="event-card-actions">
                            {!user?.id ? (
                              <span className="meta-tag">Prijava potrebna</span>
                            ) : isOwner ? (
                              <button className="card-action-btn delete" onClick={() => handleDelete(event.id)}>Obriši event</button>
                            ) : event.is_joined ? (
                              <button className="card-action-btn leave" onClick={() => handleLeave(event.id)}>Odustani</button>
                            ) : (
                              <button className="card-action-btn join" onClick={() => handleJoin(event.id)}>Dolazim</button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="event-card-date">
                        <span className="date-day">{day}</span>
                        <span className="date-month">{month}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
