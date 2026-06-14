import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Header from '../components/Header.jsx'
import { API_BASE, formatDate, normalizeText, slugifyLocation } from '../utils/helpers.js'

const MONTHS_HR = ['sij','velj','ožu','tra','svi','lip','srp','kol','ruj','lis','stu','pro']

export default function EventsPublic() {
  const { user, authHeaders } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [location, setLocation] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sort, setSort] = useState('date-asc')
  const [activeQuickTab, setActiveQuickTab] = useState('all')
  const [activeCatChip, setActiveCatChip] = useState('all')

  async function fetchEvents() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (user?.id) params.set('viewer_user_id', user.id)
      const res = await fetch(`${API_BASE}/events?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const mapped = data.map(e => ({
        id: e.id,
        title: e.title,
        desc: e.description || '',
        category: normalizeText(e.category || ''),
        location: e.neighborhood || e.city || '',
        locationSlug: slugifyLocation(e.neighborhood || e.city || ''),
        date: e.event_date ? e.event_date.split('T')[0] : '',
        time: e.event_date ? (e.event_date.split('T')[1]?.slice(0,5) || '') : '',
        joinCount: e.attendee_count || 0,
        joined: e.is_joined || false,
        isOwner: user ? e.user_id === user.id : false,
        rawUserId: e.user_id,
      }))
      setEvents(mapped)
    } catch {
      showToast('Greška pri učitavanju događaja.', 'error')
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [user?.id])

  const applyFilters = useCallback(() => {
    const q = normalizeText(search)
    let results = events.filter(e => {
      if (q && !normalizeText(e.title).includes(q) && !normalizeText(e.location).includes(q) && !normalizeText(e.desc).includes(q)) return false
      if (category !== 'all' && e.category !== category) return false
      if (location !== 'all' && e.locationSlug !== location) return false
      if (dateFilter !== 'all') {
        const today = new Date(); today.setHours(0,0,0,0)
        const evDate = new Date(e.date); evDate.setHours(0,0,0,0)
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
        const dayOfWeek = today.getDay()
        const satDiff = (6 - dayOfWeek + 7) % 7
        const sat = new Date(today); sat.setDate(today.getDate() + satDiff)
        const sun = new Date(sat); sun.setDate(sat.getDate() + 1)
        const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)
        if (dateFilter === 'today' && evDate.getTime() !== today.getTime()) return false
        if (dateFilter === 'tomorrow' && evDate.getTime() !== tomorrow.getTime()) return false
        if (dateFilter === 'weekend' && (evDate < sat || evDate > sun)) return false
        if (dateFilter === 'week' && (evDate < today || evDate > weekEnd)) return false
        if (dateFilter === 'month' && evDate.getMonth() !== today.getMonth()) return false
      }
      return true
    })
    if (sort === 'date-asc') results.sort((a,b) => new Date(a.date) - new Date(b.date))
    else if (sort === 'date-desc') results.sort((a,b) => new Date(b.date) - new Date(a.date))
    else if (sort === 'popular') results.sort((a,b) => b.joinCount - a.joinCount)
    else if (sort === 'new') results.sort((a,b) => b.id - a.id)
    setFiltered(results)
    setLoading(false)
  }, [events, search, category, location, dateFilter, sort])

  useEffect(() => { applyFilters() }, [applyFilters])

  async function apiJoin(eventId) {
    if (!user?.id) { navigate('/login'); return }
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
      showToast(data.message || 'Uspješna prijava!', 'success')
      await fetchEvents()
    } catch { showToast('Server nedostupan.', 'error') }
  }

  async function apiLeave(eventId) {
    if (!user?.id) return
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/join`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
      showToast(data.message || 'Odjava uspješna.', 'success')
      await fetchEvents()
    } catch { showToast('Server nedostupan.', 'error') }
  }

  async function apiDelete(eventId) {
    if (!user?.id) return
    if (!confirm('Jesi li siguran da želiš obrisati ovaj događaj?')) return
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Greška.', 'error'); return }
      showToast(data.message || 'Obrisano.', 'success')
      await fetchEvents()
    } catch { showToast('Server nedostupan.', 'error') }
  }

  function resetFilters() {
    setSearch(''); setCategory('all'); setLocation('all')
    setDateFilter('all'); setSort('date-asc')
    setActiveCatChip('all'); setActiveQuickTab('all')
  }

  function EventCard({ e, index }) {
    const d = new Date(e.date)
    const day = isNaN(d) ? '–' : d.getDate()
    const month = isNaN(d) ? '–' : MONTHS_HR[d.getMonth()]
    const catLabel = e.category ? e.category.charAt(0).toUpperCase() + e.category.slice(1) : 'Ostalo'

    return (
      <article
        className="event-card fade-in"
        style={{ animationDelay: `${index * 0.04}s`, cursor: 'pointer' }}
        onClick={() => navigate(`/events/${e.id}`)}
      >
        <div className="event-card-body">
          <h3 className="event-card-title">{e.title}</h3>
          {e.desc && <p className="event-card-desc">{e.desc}</p>}
          <div className="event-card-meta">
            <span className="meta-tag category">📌 {catLabel}</span>
            <span className="meta-tag">📍 {e.location}</span>
            {e.time && <span className="meta-tag">🕐 {e.time}</span>}
          </div>
          <div className="event-card-footer">
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>👥 {e.joinCount} prijavljenih</span>
            <div className="event-card-actions" onClick={ev => ev.stopPropagation()}>
              {user ? (
                e.isOwner ? (
                  <>
                    <button className="card-btn card-btn-joined" disabled>Tvoj event</button>
                    <button className="card-btn card-btn-delete" onClick={() => apiDelete(e.id)}>Obriši</button>
                  </>
                ) : e.joined ? (
                  <>
                    <button className="card-btn card-btn-joined" disabled>Prijavljen</button>
                    <button className="card-btn card-btn-leave" onClick={() => apiLeave(e.id)}>Odjavi se</button>
                  </>
                ) : (
                  <>
                    <button className="card-btn card-btn-details" onClick={() => navigate(`/events/${e.id}`)}>Detalji</button>
                    <button className="card-btn card-btn-join" onClick={() => apiJoin(e.id)}>Pridruži se →</button>
                  </>
                )
              ) : (
                <>
                  <button className="card-btn card-btn-details" onClick={() => navigate(`/events/${e.id}`)}>Detalji</button>
                  <button className="card-btn card-btn-join" onClick={() => navigate('/login')}>Prijavi se →</button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="event-card-date" aria-hidden="true">
          <span className="date-day">{day}</span>
          <span className="date-month">{month}</span>
        </div>
      </article>
    )
  }

  const catChips = [
    { val: 'all', label: '🎯 Sve kategorije' },
    { val: 'glazba', label: '🎵 Glazba' },
    { val: 'sport', label: '⚽ Sport' },
    { val: 'kultura', label: '🎭 Kultura' },
    { val: 'edukacija', label: '📚 Edukacija' },
    { val: 'gastro', label: '🍽️ Gastro' },
    { val: 'zabava', label: '🎉 Zabava' },
    { val: 'wellness', label: '🧘 Wellness' },
    { val: 'zajednica', label: '🤝 Zajednica' },
  ]

  const quickTabs = [
    { val: 'all', label: 'Svi' },
    { val: 'today', label: 'Danas' },
    { val: 'tomorrow', label: 'Sutra' },
    { val: 'weekend', label: 'Vikend' },
    { val: 'week', label: 'Ovaj tjedan' },
  ]

  const countText = filtered.length === 1 ? '1 događaj' : `${filtered.length} događaja`

  return (
    <>
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="orb orb-1" aria-hidden="true"></div>
      <div className="orb orb-2" aria-hidden="true"></div>

      <Header activePage="events" />

      <div className="page-shell">
        {/* HERO */}
        <section className="discover-hero">
          <div className="discover-hero-text">
            <span className="discover-eyebrow">
              <span className="eyebrow-dot"></span>
              Zagreb · lokalna zajednica
            </span>
            <h1 className="discover-title">Pronađi što se događa<br /><em>u tvom kvartu</em></h1>
            <p className="discover-sub">Lokalni koncerti, sportske aktivnosti, radionice, kvizovi i još mnogo toga — sve na jednom mjestu.</p>
          </div>
          <div className="quick-tabs">
            {quickTabs.map(t => (
              <button
                key={t.val}
                className={`quick-tab${activeQuickTab === t.val ? ' active' : ''}`}
                onClick={() => { setActiveQuickTab(t.val); setDateFilter(t.val) }}
              >{t.label}</button>
            ))}
          </div>
        </section>

        {/* SEARCH */}
        <section className="search-section">
          <div className="search-bar">
            <div className="search-input-wrap">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text" className="search-input"
                placeholder="Pretraži događaj ili lokaciju..."
                autoComplete="off"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')} aria-label="Očisti">✕</button>
              )}
            </div>
            <select
              className="search-time-select"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="all">Svi datumi</option>
              <option value="today">Danas</option>
              <option value="tomorrow">Sutra</option>
              <option value="weekend">Ovaj vikend</option>
              <option value="week">Ovaj tjedan</option>
            </select>
            <button className="btn-search" onClick={applyFilters}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              Pretraži
            </button>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="categories-section">
          <div className="categories-scroll">
            {catChips.map(c => (
              <button
                key={c.val}
                className={`cat-chip${activeCatChip === c.val ? ' active' : ''}`}
                onClick={() => { setActiveCatChip(c.val); setCategory(c.val) }}
              >{c.label}</button>
            ))}
          </div>
        </section>

        <div className="content-grid">
          {/* SIDEBAR FILTERS */}
          <aside className="filters-sidebar">
            <div className="filters-card">
              <div className="filters-header">
                <h2 className="filters-title">Filteri</h2>
                <button className="filters-reset" onClick={resetFilters}>Resetiraj</button>
              </div>
              <div className="filter-group">
                <label className="filter-label">Kategorija</label>
                <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="all">Sve kategorije</option>
                  <option value="glazba">Glazba</option>
                  <option value="sport">Sport</option>
                  <option value="kultura">Kultura</option>
                  <option value="edukacija">Edukacija</option>
                  <option value="gastro">Gastro</option>
                  <option value="zabava">Zabava</option>
                  <option value="wellness">Wellness</option>
                  <option value="zajednica">Zajednica</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Kvart / lokacija</label>
                <select className="filter-select" value={location} onChange={e => setLocation(e.target.value)}>
                  <option value="all">Cijeli Zagreb</option>
                  <option value="centar">Centar</option>
                  <option value="trnje">Trnje</option>
                  <option value="maksimir">Maksimir</option>
                  <option value="dubrava">Dubrava</option>
                  <option value="sesvete">Sesvete</option>
                  <option value="novi-zagreb">Novi Zagreb</option>
                  <option value="crnomerec">Črnomerec</option>
                  <option value="medvescak">Medvešćak</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Datum</label>
                <select className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                  <option value="all">Svi datumi</option>
                  <option value="today">Danas</option>
                  <option value="tomorrow">Sutra</option>
                  <option value="weekend">Ovaj vikend</option>
                  <option value="week">Ovaj tjedan</option>
                  <option value="month">Ovaj mjesec</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Sortiraj po</label>
                <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="date-asc">Datum: najranije</option>
                  <option value="date-desc">Datum: najkasnije</option>
                  <option value="popular">Popularnost</option>
                  <option value="new">Najnovije dodano</option>
                </select>
              </div>
              <button className="btn-apply-filters" onClick={applyFilters}>Primijeni filtre</button>
            </div>

            <div className="sidebar-stats-card">
              <div className="sidebar-stat">
                <span className="sidebar-stat-val">{events.length || '–'}</span>
                <span className="sidebar-stat-lbl">događaja ukupno</span>
              </div>
              <div className="sidebar-stat-divider"></div>
              <div className="sidebar-stat">
                <span className="sidebar-stat-val">247</span>
                <span className="sidebar-stat-lbl">članova zajednice</span>
              </div>
            </div>

            <div className="sidebar-organize-card">
              <span className="sidebar-org-eyebrow">Organiziraj</span>
              <h3 className="sidebar-org-title">Imaš ideju za događaj?</h3>
              <p className="sidebar-org-copy">Dodaj vlastiti događaj i pozovi susjedstvo.</p>
              <a href="/add-event" className="btn-organize">Dodaj događaj →</a>
            </div>
          </aside>

          {/* MAIN */}
          <main className="events-main">
            <div className="events-panel-header">
              <div className="events-panel-left">
                <h2 className="events-panel-title">Aktualni događaji</h2>
                <span className="events-count-badge">
                  {loading ? 'Učitavanje...' : countText}
                </span>
              </div>
              <div className="events-panel-right">
                <button
                  className={`view-toggle${view === 'list' ? ' active' : ''}`}
                  onClick={() => setView('list')}
                  aria-label="Prikaz lista"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
                <button
                  className={`view-toggle${view === 'grid' ? ' active' : ''}`}
                  onClick={() => setView('grid')}
                  aria-label="Prikaz grid"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </button>
              </div>
            </div>

            <button className="mobile-filter-btn" onClick={() => setMobileFiltersOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filteri
            </button>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Učitavamo događaje...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3 className="empty-title">Nema događaja</h3>
                <p className="empty-copy">Nema događaja za odabrane filtre.<br />Pokušaj promijeniti kategoriju ili datum.</p>
                <button className="btn-reset-empty" onClick={resetFilters}>Prikaži sve događaje</button>
              </div>
            ) : (
              <div className={`events-list${view === 'grid' ? ' grid-view' : ''}`}>
                {filtered.map((e, i) => <EventCard key={e.id} e={e} index={i} />)}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTERS DRAWER */}
      {mobileFiltersOpen && (
        <div
          className="mobile-filters-overlay"
          onClick={ev => { if (!ev.target.closest('.mobile-filters-drawer')) setMobileFiltersOpen(false) }}
        >
          <div className="mobile-filters-drawer">
            <div className="mobile-filters-head">
              <span className="mobile-filters-title">Filteri</span>
              <button className="mobile-filters-close" onClick={() => setMobileFiltersOpen(false)}>✕</button>
            </div>
            <div className="mobile-filters-body">
              <div className="filter-group">
                <label className="filter-label">Kategorija</label>
                <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="all">Sve kategorije</option>
                  <option value="glazba">Glazba</option>
                  <option value="sport">Sport</option>
                  <option value="kultura">Kultura</option>
                  <option value="edukacija">Edukacija</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Datum</label>
                <select className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                  <option value="all">Svi datumi</option>
                  <option value="today">Danas</option>
                  <option value="tomorrow">Sutra</option>
                  <option value="weekend">Ovaj vikend</option>
                  <option value="week">Ovaj tjedan</option>
                </select>
              </div>
            </div>
            <div className="mobile-filters-foot">
              <button className="btn-apply-filters w-full" onClick={() => { applyFilters(); setMobileFiltersOpen(false) }}>Primijeni filtre</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
