import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Header from '../components/Header.jsx'
import { API_BASE, formatDate } from '../utils/helpers.js'

export default function Admin() {
  const { user, authHeaders } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'admin') { navigate('/'); return }
  }, [user, navigate])

  useEffect(() => {
    if (user?.role !== 'admin') return
    fetchEvents()
  }, [filter, user])

  async function fetchEvents() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/events?status=${filter}`, {
        headers: authHeaders(),
      })
      if (!res.ok) { showToast('Greška kod dohvaćanja događaja.', 'error'); return }
      setEvents(await res.json())
    } catch {
      showToast('Server nije dostupan.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(eventId, action) {
    setActionLoading(eventId + action)
    try {
      const res = await fetch(`${API_BASE}/admin/events/${eventId}/${action}`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
      showToast(data.message, 'success')
      setEvents(ev => ev.filter(e => e.id !== eventId))
    } catch {
      showToast('Server nije dostupan.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (!user || user.role !== 'admin') return null

  return (
    <>
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="orb orb-1" aria-hidden="true"></div>
      <div className="orb orb-2" aria-hidden="true"></div>

      <Header activePage="admin" />

      <div className="page-shell">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Admin panel
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Pregled i moderacija događaja
            </p>
          </div>

          <div className="admin-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: '0.45rem 1.1rem',
                  borderRadius: 8,
                  border: filter === s ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: filter === s ? 'var(--accent)' : 'transparent',
                  color: filter === s ? '#000' : 'var(--text)',
                  fontWeight: filter === s ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.15s',
                }}
              >
                {s === 'pending' ? 'Na čekanju' : s === 'approved' ? 'Odobreni' : 'Odbijeni'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Učitavanje...
            </div>
          ) : events.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem',
              color: 'var(--text-muted)', border: '1px dashed var(--border)',
              borderRadius: 12,
            }}>
              Nema događaja u ovoj kategoriji.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.map(ev => {
                const { full: dateStr } = formatDate(ev.event_date)
                return (
                  <div
                    key={ev.id}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{ev.title}</span>
                        <span style={{
                          fontSize: '0.7rem', padding: '0.15rem 0.55rem',
                          borderRadius: 20,
                          background: ev.status === 'pending' ? 'rgba(255,200,0,0.15)' : ev.status === 'approved' ? 'rgba(100,220,100,0.15)' : 'rgba(255,80,80,0.15)',
                          color: ev.status === 'pending' ? '#e6b800' : ev.status === 'approved' ? '#4caf50' : '#f44336',
                          border: `1px solid ${ev.status === 'pending' ? '#e6b800' : ev.status === 'approved' ? '#4caf50' : '#f44336'}`,
                          fontWeight: 600,
                        }}>
                          {ev.status === 'pending' ? 'Na čekanju' : ev.status === 'approved' ? 'Odobreno' : 'Odbijeno'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                        {dateStr} · {ev.category} · {ev.neighborhood}, {ev.city}
                        {ev.address && ` · ${ev.address}`}
                      </div>
                      {ev.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {ev.description.length > 200 ? ev.description.slice(0, 200) + '…' : ev.description}
                        </p>
                      )}
                    </div>

                    {filter === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          onClick={() => handleAction(ev.id, 'approve')}
                          disabled={!!actionLoading}
                          style={{
                            padding: '0.45rem 1.1rem', borderRadius: 8,
                            background: 'rgba(100,220,100,0.15)', border: '1px solid #4caf50',
                            color: '#4caf50', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem',
                            opacity: actionLoading === ev.id + 'approve' ? 0.6 : 1,
                          }}
                        >
                          {actionLoading === ev.id + 'approve' ? '...' : 'Odobri'}
                        </button>
                        <button
                          onClick={() => handleAction(ev.id, 'reject')}
                          disabled={!!actionLoading}
                          style={{
                            padding: '0.45rem 1.1rem', borderRadius: 8,
                            background: 'rgba(255,80,80,0.1)', border: '1px solid #f44336',
                            color: '#f44336', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem',
                            opacity: actionLoading === ev.id + 'reject' ? 0.6 : 1,
                          }}
                        >
                          {actionLoading === ev.id + 'reject' ? '...' : 'Odbij'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
