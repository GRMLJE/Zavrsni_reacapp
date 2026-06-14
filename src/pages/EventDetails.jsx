import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Header from '../components/Header.jsx'
import { API_BASE, formatDate } from '../utils/helpers.js'

export default function EventDetails() {
  const { id } = useParams()
  const { user, authHeaders } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  async function fetchEvent() {
    try {
      const params = new URLSearchParams()
      if (user?.id) params.set('viewer_user_id', user.id)

      // Try dedicated endpoint first
      const res = await fetch(`${API_BASE}/events/${id}?${params}`)
      if (res.ok) {
        return await res.json()
      }

      // Fallback: find in full events list
      const listRes = await fetch(`${API_BASE}/events?${params}`)
      if (listRes.ok) {
        const all = await listRes.json()
        const found = all.find(e => String(e.id) === String(id))
        return found || null
      }
      return null
    } catch {
      return null
    }
  }

  async function fetchSimilar(ev) {
    try {
      const params = new URLSearchParams()
      if (user?.id) params.set('viewer_user_id', user.id)
      const res = await fetch(`${API_BASE}/events?${params}`)
      const all = await res.json()
      return all
        .filter(e => e.id !== ev.id && (e.category || '').toLowerCase() === (ev.category || '').toLowerCase())
        .slice(0, 3)
    } catch {
      return []
    }
  }

  useEffect(() => {
    if (!id || isNaN(parseInt(id))) { setLoading(false); setNotFound(true); return }
    async function init() {
      const ev = await fetchEvent()
      setLoading(false)
      if (!ev) { setNotFound(true); return }
      setEvent(ev)
      document.title = `${ev.title} — KvartStory`
      const sim = await fetchSimilar(ev)
      setSimilar(sim)
    }
    init()
  }, [id, user?.id])

  async function handleJoin() {
    if (!user) { navigate('/login'); return }
    const res = await fetch(`${API_BASE}/events/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
    showToast(data.message || 'Uspješno si se prijavio/la!', 'success')
    const updated = await fetchEvent()
    if (updated) setEvent(updated)
  }

  async function handleLeave() {
    if (!user) return
    const res = await fetch(`${API_BASE}/events/${id}/join`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
    showToast(data.message || 'Odjava uspješna.', 'success')
    const updated = await fetchEvent()
    if (updated) setEvent(updated)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link kopiran!', 'success'))
  }

  if (loading) return (
    <>
      <Header activePage="events" />
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Učitavamo detalje događaja...</p>
      </div>
    </>
  )

  if (notFound) return (
    <>
      <Header activePage="events" />
      <div className="page-shell">
        <div className="not-found">
          <div className="not-found-icon">🔍</div>
          <h2 className="not-found-title">Događaj nije pronađen</h2>
          <p className="not-found-copy">Ovaj događaj ne postoji ili je obrisan.</p>
          <Link to="/events" className="btn-back">← Natrag na Discover</Link>
        </div>
      </div>
    </>
  )

  const { day, month, full, time } = formatDate(event.event_date)
  const isOwner = user ? event.user_id === user.id : false
  const joined = event.is_joined || false
  const orgName = event.organizer_name || 'Organizator'
  const location = [event.neighborhood, event.city].filter(Boolean).join(', ')

  function getMapsUrl() {
    const query = [event.address, event.neighborhood, event.city].filter(Boolean).join(', ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  function descParagraphs() {
    if (!event.description) return null
    return event.description.split('\n').map(p => p.trim()).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
  }

  return (
    <>
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="orb orb-1" aria-hidden="true"></div>
      <div className="orb orb-2" aria-hidden="true"></div>

      <Header activePage="events" />

      <div className="page-shell">
        <nav className="breadcrumb" aria-label="Navigacija">
          <Link to="/events" className="breadcrumb-link">← Discover</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{event.title}</span>
        </nav>

        <div className="details-layout fade-in">
          <main className="details-main">
            <div className="event-hero">
              <div className="event-hero-meta">
                <span className="hero-category-tag">📌 {event.category || 'Ostalo'}</span>
                <span className="hero-location-tag">📍 {event.neighborhood || event.city || '–'}</span>
              </div>
              <h1 className="event-hero-title">{event.title}</h1>
              <div className="event-hero-sub">
                <span className="hero-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {full}
                </span>
                <span className="hero-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {time || '–'}
                </span>
                <span className="hero-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {location || '–'}
                </span>
                <span className="hero-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {event.attendee_count || 0} prijavljenih
                </span>
              </div>
            </div>

            <div className="section-divider"></div>

            <section className="details-section">
              <h2 className="details-section-title">O događaju</h2>
              <div className="details-description">
                {descParagraphs() || <p style={{ color: 'var(--text-faint)' }}>Nema opisa za ovaj događaj.</p>}
              </div>
            </section>

            <div className="section-divider"></div>

            <section className="details-section">
              <h2 className="details-section-title">Organizator</h2>
              <div className="organizer-card">
                <div className="organizer-avatar">{orgName.charAt(0).toUpperCase()}</div>
                <div className="organizer-info">
                  <span className="organizer-name">{orgName}</span>
                  <span className="organizer-label">Organizator događaja</span>
                </div>
                <span className="organizer-badge">Organizator</span>
              </div>
            </section>

            <div className="section-divider"></div>

            <section className="details-section">
              <h2 className="details-section-title">Lokacija</h2>
              <div className="location-card">
                <div className="location-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div className="location-info">
                  <span className="location-neighborhood">{event.neighborhood || '–'}</span>
                  <span className="location-city">{event.city || '–'}</span>
                  {event.address && (
                    <span className="location-address" style={{ fontSize: '0.85rem', color: 'var(--text-faint)', marginTop: 2 }}>
                      {event.address}
                    </span>
                  )}
                </div>
                <a
                  href={getMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-maps"
                  title="Otvori u Google Maps"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  Odvedi me tamo
                </a>
              </div>
            </section>
          </main>

          <aside className="details-sidebar">
            <div className="join-card">
              <div className="join-card-date-row">
                <div className="join-date-block">
                  <span className="join-date-day">{day}</span>
                  <span className="join-date-month">{month}</span>
                </div>
                <div className="join-date-info">
                  <span className="join-date-full">{full}</span>
                  <span className="join-time">{time || 'Cijeli dan'}</span>
                </div>
              </div>
              <div className="join-card-divider"></div>
              <div className="join-meta-row">
                <div className="join-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {location || '–'}
                </div>
                <div className="join-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {event.attendee_count || 0} prijavljenih
                </div>
              </div>
              <div className="join-card-divider"></div>
              <div id="joinCTA">
                {!user ? (
                  <>
                    <Link to="/login" className="btn-login-to-join">Prijavi se za sudjelovanje</Link>
                    <p className="join-hint">Trebaš račun da bi se mogao/la pridružiti događajima.</p>
                  </>
                ) : isOwner ? (
                  <div className="owner-badge">✓ Ovo je tvoj događaj</div>
                ) : joined ? (
                  <>
                    <div className="joined-badge">✓ Prijavljen/a si</div>
                    <button className="btn-leave" onClick={handleLeave}>Odjavi se</button>
                  </>
                ) : (
                  <>
                    <button className="btn-join-primary" onClick={handleJoin}>Pridruži se →</button>
                    <p className="join-hint">Besplatno sudjelovanje. Nema naplate.</p>
                  </>
                )}
              </div>
            </div>

            <div className="share-card">
              <span className="share-label">Podijeli događaj</span>
              <div className="share-buttons">
                <button className="share-btn" onClick={copyLink}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Kopiraj link
                </button>
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="similar-section">
            <div className="similar-header">
              <h2 className="similar-title">Slični događaji</h2>
              <Link to="/events" className="similar-all">Prikaži sve →</Link>
            </div>
            <div className="similar-grid">
              {similar.map(e => {
                const { full } = formatDate(e.event_date)
                return (
                  <Link key={e.id} className="similar-card fade-in" to={`/events/${e.id}`}>
                    <span className="similar-card-cat">{e.category || 'Ostalo'}</span>
                    <span className="similar-card-title">{e.title}</span>
                    <div className="similar-card-meta">
                      <span>📍 {e.neighborhood || e.city || '–'}</span>
                      <span>📅 {full}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
