import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Header from '../components/Header.jsx'
import { API_BASE, MONTHS_HR } from '../utils/helpers.js'

const SelectArrow = () => (
  <svg className="select-arrow" viewBox="0 0 10 6" fill="none">
    <path d="M1 1l4 4 4-4" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export default function AddEvent() {
  const { user, authHeaders } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [cities, setCities] = useState([])
  const [neighborhoods, setNeighborhoods] = useState([])

  const [form, setForm] = useState({
    title: '', description: '', eventDate: '',
    categoryId: '', cityId: '', neighborhoodId: '', address: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const addressDebounceRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [catRes, citRes] = await Promise.all([
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/cities`),
        ])
        if (catRes.ok) setCategories(await catRes.json())
        if (citRes.ok) setCities(await citRes.json())
      } catch {}
    }
    loadDropdowns()
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNeighborhoods(cityId) {
    if (!cityId) { setNeighborhoods([]); return }
    try {
      const res = await fetch(`${API_BASE}/neighborhoods?city_id=${cityId}`)
      if (res.ok) setNeighborhoods(await res.json())
    } catch {}
  }

  function setField(field) {
    return e => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setErrors(er => ({ ...er, [field]: false }))
    }
  }

  function handleAddressInput(e) {
    const value = e.target.value
    setForm(f => ({ ...f, address: value }))
    setErrors(er => ({ ...er, address: false }))

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current)
    if (value.trim().length < 3) { setAddressSuggestions([]); setShowSuggestions(false); return }

    addressDebounceRef.current = setTimeout(() => fetchAddressSuggestions(value), 350)
  }

  async function fetchAddressSuggestions(query) {
    setAddressLoading(true)
    try {
      const params = new URLSearchParams({
        q: `${query}, Zagreb`,
        format: 'json',
        addressdetails: '1',
        limit: '6',
        countrycodes: 'hr',
      })
      const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
        headers: { 'Accept-Language': 'hr' },
      })
      if (!res.ok) return
      const data = await res.json()
      const suggestions = data
        .filter(item => item.address?.road || item.display_name)
        .map(item => {
          const road = item.address?.road || ''
          const houseNumber = item.address?.house_number || ''
          const label = road && houseNumber ? `${road} ${houseNumber}` : road || item.display_name
          return { label, full: item.display_name }
        })
      setAddressSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } catch {
      setAddressSuggestions([])
    } finally {
      setAddressLoading(false)
    }
  }

  function selectSuggestion(suggestion) {
    setForm(f => ({ ...f, address: suggestion.label }))
    setAddressSuggestions([])
    setShowSuggestions(false)
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = true
    if (!form.eventDate) e.eventDate = true
    if (!form.categoryId) e.categoryId = true
    if (!form.cityId) e.cityId = true
    if (!form.neighborhoodId) e.neighborhoodId = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          event_date: form.eventDate,
          category_id: parseInt(form.categoryId),
          neighborhood_id: parseInt(form.neighborhoodId),
          address: form.address.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Greška kod objave.', 'error'); return }
      setSuccess({ id: data.id, title: form.title.trim() })
    } catch {
      showToast('Ne mogu se spojiti na server.', 'error')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({ title: '', description: '', eventDate: '', categoryId: '', cityId: '', neighborhoodId: '', address: '' })
    setNeighborhoods([])
    setSuccess(null)
    setErrors({})
  }

  // Live preview values
  const prevDay = form.eventDate ? new Date(form.eventDate).getDate() : '–'
  const prevMonth = form.eventDate ? MONTHS_HR[new Date(form.eventDate).getMonth()] : '–'
  const prevTime = form.eventDate ? (() => {
    const d = new Date(form.eventDate)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  })() : '–'
  const prevCat = categories.find(c => String(c.id) === form.categoryId)?.name || 'Kategorija'
  const prevNeigh = neighborhoods.find(n => String(n.id) === form.neighborhoodId)?.name || ''
  const prevCity = cities.find(c => String(c.id) === form.cityId)?.name || ''
  const prevLoc = [prevNeigh, prevCity].filter(Boolean).join(', ') || 'Kvart, Grad'

  if (!user) return (
    <>
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="orb orb-1" aria-hidden="true"></div>
      <div className="orb orb-2" aria-hidden="true"></div>
      <Header activePage="add-event" />
      <div className="not-auth">
        <div className="not-auth-icon">🔒</div>
        <h2 className="not-auth-title">Prijavi se za kreiranje događaja</h2>
        <p className="not-auth-copy">Moraš biti prijavljen/a da bi mogao/la organizirati događaj u svom kvartu.</p>
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

      <Header activePage="add-event" />

      <div className="page-shell">
        <div className="page-layout">
          <main className="form-main">
            <div className="form-header">
              <Link to="/events" className="back-link">← Discover</Link>
              <div className="form-header-text">
                <h1 className="form-title">Organiziraj događaj</h1>
                <p className="form-subtitle">Povežite kvart — ispunite detalje i objavite događaj.</p>
              </div>
            </div>

            <form className="event-form" onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label className="field-label" htmlFor="title">
                  Naziv događaja <span className="required-star">*</span>
                </label>
                <input
                  type="text" id="title" className={`field-input${errors.title ? ' has-error' : ''}`}
                  placeholder="npr. Jutarnja yoga u parku"
                  maxLength={120} autoComplete="off"
                  value={form.title} onChange={setField('title')}
                />
                <span className="field-hint">Kratko i jasno — do 120 znakova</span>
                {errors.title && <span className="field-error">Naziv je obavezan.</span>}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="description">Opis</label>
                <textarea
                  id="description" className="field-input field-textarea"
                  placeholder="Kratki opis događaja, što posjetitelji mogu očekivati..."
                  rows={4}
                  value={form.description} onChange={setField('description')}
                />
                <span className="field-hint">Nije obavezno, ali pomaže privući posjetitelje</span>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="eventDate">
                  Datum i vrijeme <span className="required-star">*</span>
                </label>
                <input
                  type="datetime-local" id="eventDate"
                  className={`field-input${errors.eventDate ? ' has-error' : ''}`}
                  value={form.eventDate} onChange={setField('eventDate')}
                />
                {errors.eventDate && <span className="field-error">Datum je obavezan.</span>}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="categorySelect">
                  Kategorija <span className="required-star">*</span>
                </label>
                <div className="select-wrap">
                  <select
                    id="categorySelect"
                    className={`field-input field-select${errors.categoryId ? ' has-error' : ''}`}
                    value={form.categoryId}
                    onChange={setField('categoryId')}
                  >
                    <option value="">Odaberi kategoriju</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <SelectArrow />
                </div>
                {errors.categoryId && <span className="field-error">Kategorija je obavezna.</span>}
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label" htmlFor="citySelect">
                    Grad <span className="required-star">*</span>
                  </label>
                  <div className="select-wrap">
                    <select
                      id="citySelect"
                      className={`field-input field-select${errors.cityId ? ' has-error' : ''}`}
                      value={form.cityId}
                      onChange={e => {
                        setField('cityId')(e)
                        setForm(f => ({ ...f, neighborhoodId: '' }))
                        loadNeighborhoods(e.target.value)
                      }}
                    >
                      <option value="">Odaberi grad</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <SelectArrow />
                  </div>
                  {errors.cityId && <span className="field-error">Grad je obavezan.</span>}
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="neighborhoodSelect">
                    Kvart <span className="required-star">*</span>
                  </label>
                  <div className="select-wrap">
                    <select
                      id="neighborhoodSelect"
                      className={`field-input field-select${errors.neighborhoodId ? ' has-error' : ''}`}
                      value={form.neighborhoodId}
                      onChange={setField('neighborhoodId')}
                      disabled={!form.cityId || neighborhoods.length === 0}
                    >
                      <option value="">{form.cityId ? 'Odaberi kvart' : 'Prvo odaberi grad'}</option>
                      {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                    <SelectArrow />
                  </div>
                  {errors.neighborhoodId && <span className="field-error">Kvart je obavezan.</span>}
                </div>
              </div>

              <div className="field-group" ref={suggestionsRef} style={{ position: 'relative' }}>
                <label className="field-label" htmlFor="address">
                  Adresa mjesta
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text" id="address"
                    className="field-input"
                    placeholder="npr. Ilica 10, Jarun bb..."
                    autoComplete="off"
                    value={form.address}
                    onChange={handleAddressInput}
                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                  />
                  {addressLoading && (
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-faint)' }}>
                      Tražim...
                    </span>
                  )}
                </div>
                <span className="field-hint">Nije obavezno — pomaže sudionicima pronaći lokaciju</span>
                {showSuggestions && addressSuggestions.length > 0 && (
                  <ul className="address-suggestions">
                    {addressSuggestions.map((s, i) => (
                      <li key={i} className="address-suggestion-item" onMouseDown={() => selectSuggestion(s)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {s.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <span>{loading ? 'Objavljivanje...' : 'Objavi događaj'}</span>
              </button>
            </form>
          </main>

          <aside className="form-sidebar">
            <div className="preview-card">
              <div className="preview-label">Pregled</div>
              <div className="preview-body">
                <div className="preview-date-block">
                  <span className="preview-day">{prevDay}</span>
                  <span className="preview-month">{prevMonth}</span>
                </div>
                <div className="preview-info">
                  <span className="preview-category">{prevCat}</span>
                  <span className="preview-title">{form.title || 'Naziv događaja'}</span>
                  <span className="preview-location">{prevLoc}</span>
                  {form.address && <span className="preview-location" style={{ fontSize: '0.75rem', opacity: 0.7 }}>📍 {form.address}</span>}
                  <span className="preview-time">{prevTime}</span>
                </div>
              </div>
              <div className="preview-desc">{form.description || 'Opis će se prikazati ovdje...'}</div>
            </div>

            <div className="tips-card">
              <div className="tips-title">💡 Savjeti</div>
              <ul className="tips-list">
                <li>Odaberi jasan naziv koji opisuje aktivnost</li>
                <li>Dodaj adresu da sudionici lako pronađu mjesto</li>
                <li>Provjeri datum i kvart prije objave</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* SUCCESS OVERLAY */}
      {success && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="success-icon">🎉</div>
            <h2 className="success-title">Događaj objavljen!</h2>
            <p className="success-copy">"{success.title}" je uspješno objavljen!</p>
            <div className="success-actions">
              <Link to={`/events/${success.id}`} className="btn-primary-link">Pogledaj detalje</Link>
              <button className="btn-secondary-link" onClick={resetForm}>Dodaj još jedan</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
