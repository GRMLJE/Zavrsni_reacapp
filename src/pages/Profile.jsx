import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import Header from '../components/Header.jsx'
import { API_BASE, formatDate, MONTHS_HR, MONTHS_FULL } from '../utils/helpers.js'

function formatDateFull(dateStr) {
  if (!dateStr) return '–'
  const d = new Date(dateStr)
  return `${d.getDate()}. ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}.`
}

export default function Profile() {
  const { user, logout, authHeaders } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const [createdEvents, setCreatedEvents] = useState([])
  const [joinedEvents, setJoinedEvents] = useState([])
  const [activeTab, setActiveTab] = useState('created')
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(null)

  async function fetchCreated() {
    if (!user?.id) return []
    const res = await fetch(`${API_BASE}/events?user_id=${user.id}&viewer_user_id=${user.id}`)
    return res.ok ? await res.json() : []
  }

  async function fetchJoined() {
    if (!user?.id) return []
    const res = await fetch(`${API_BASE}/events?viewer_user_id=${user.id}`)
    if (!res.ok) return []
    const all = await res.json()
    return all.filter(e => e.is_joined && e.user_id !== user.id)
  }

  useEffect(() => {
    if (!user) return
    async function init() {
      const [cr, jo] = await Promise.all([fetchCreated(), fetchJoined()])
      setCreatedEvents(cr)
      setJoinedEvents(jo)
      setLoading(false)
    }
    init()
  }, [user?.id])

  async function confirmDelete() {
    if (!deleteModal) return
    const id = deleteModal
    setDeleteModal(null)
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
    showToast('Event je obrisan.', 'success')
    setCreatedEvents(prev => prev.filter(e => e.id !== id))
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const displayEvents = activeTab === 'created' ? createdEvents : joinedEvents

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Korisnik'
  const initial = name.charAt(0).toUpperCase()
  const since = user?.created_at ? `od ${formatDateFull(user.created_at)}` : 'KvartStory korisnik'

  if (!user) return (
    <>
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="orb orb-1" aria-hidden="true"></div>
      <div className="orb orb-2" aria-hidden="true"></div>
      <Header />
      <div className="not-auth">
        <div className="not-auth-icon">🔒</div>
        <h2 className="not-auth-title">Nisi prijavljen/a</h2>
        <p className="not-auth-copy">Moraš biti prijavljen/a da bi vidio/la svoj profil.</p>
        <div className="not-auth-actions">
          <Link to="/login" className="btn-primary-link">Prijava</Link>
          <Link to="/register" className="btn-secondary-link">Registracija</Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="orb orb-1" aria-hidden="true"></div>
      <div className="orb orb-2" aria-hidden="true"></div>

      <Header activePage="profile" />

      <div className="page-shell">
        {/* PROFILE HERO */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initial}</div>
            <div className="profile-avatar-ring"></div>
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-name">{name}</h1>
            <p className="profile-email">{user.email || '–'}</p>
            <div className="profile-meta-row">
              <span className="profile-meta-tag">{user.role === 'admin' ? 'Admin' : 'Korisnik'}</span>
              <span className="profile-meta-tag secondary">{since}</span>
            </div>
          </div>
          <button className="btn-logout-hero" onClick={handleLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Odjava
          </button>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-number">{createdEvents.length}</span>
            <span className="stat-label">Kreirana događaja</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{joinedEvents.length}</span>
            <span className="stat-label">Prijavljena događaja</span>
          </div>
          <div className="stat-card accent">
            <span className="stat-number">{createdEvents.length + joinedEvents.length}</span>
            <span className="stat-label">Ukupno aktivnosti</span>
          </div>
        </div>

        {/* SETTINGS */}
        <div className="settings-section">
          <h2 className="settings-title">Postavke</h2>
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">
                  {theme === 'dark' ? '🌙 Tamni način' : '☀️ Svijetli način'}
                </span>
                <span className="setting-desc">
                  {theme === 'dark' ? 'Prikazujem tamnu temu' : 'Prikazujem svijetlu temu'}
                </span>
              </div>
              <button
                className={`theme-toggle${theme === 'dark' ? ' dark' : ''}`}
                onClick={toggleTheme}
                aria-label="Promijeni temu"
              >
                <span className="theme-toggle-knob"></span>
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs-row">
          <button
            className={`tab-btn${activeTab === 'created' ? ' active' : ''}`}
            onClick={() => setActiveTab('created')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Moji događaji
            <span className="tab-count">{createdEvents.length}</span>
          </button>
          <button
            className={`tab-btn${activeTab === 'joined' ? ' active' : ''}`}
            onClick={() => setActiveTab('joined')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Prijavljeni
            <span className="tab-count">{joinedEvents.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="list-loading">
            <div className="spinner"></div>
            <p>Učitavanje događaja...</p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{activeTab === 'created' ? '🗓️' : '📭'}</div>
            <p className="empty-title">{activeTab === 'created' ? 'Nemaš kreiranih događaja' : 'Nisi prijavljen/a ni na jedan događaj'}</p>
            <p className="empty-copy">{activeTab === 'created' ? 'Organiziraj prvi događaj u svom kvartu!' : 'Pronađi događaje u svom kvartu i pridruži se!'}</p>
            {activeTab === 'created'
              ? <Link to="/add-event" className="btn-primary-link">Kreiraj događaj →</Link>
              : <Link to="/events" className="btn-primary-link">Discover →</Link>
            }
          </div>
        ) : (
          <div className="events-grid">
            {displayEvents.map((e, i) => {
              const { day, month } = formatDate(e.event_date)
              const isOwner = e.user_id === user.id
              return (
                <div key={e.id} className="event-card" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="event-card-date">
                    <span className="date-day">{day}</span>
                    <span className="date-month">{month}</span>
                  </div>
                  <div className="event-card-body">
                    <span className="event-card-title">{e.title}</span>
                    {e.description && <span className="event-card-desc">{e.description}</span>}
                    <div className="event-card-meta">
                      <span className="meta-tag cat">{e.category || 'Ostalo'}</span>
                      <span className="meta-tag">{e.neighborhood || '–'}</span>
                      <span className="meta-tag">{e.city || '–'}</span>
                    </div>
                    <div className="attendee-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {e.attendee_count || 0} prijavljenih
                    </div>
                  </div>
                  <div className="event-card-actions">
                    <Link className="btn-card-details" to={`/events/${e.id}`}>Detalji</Link>
                    {isOwner && (
                      <button className="btn-card-delete" onClick={() => setDeleteModal(e.id)}>Obriši</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="modal-overlay" onClick={e => { if (!e.target.closest('.modal')) setDeleteModal(null) }}>
          <div className="modal">
            <div className="modal-icon">🗑️</div>
            <h3 className="modal-title">Obriši događaj?</h3>
            <p className="modal-copy">Ova radnja je nepovratna. Svi prijavljeni korisnici bit će odjavljeni.</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setDeleteModal(null)}>Odustani</button>
              <button className="btn-modal-delete" onClick={confirmDelete}>Obriši</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
