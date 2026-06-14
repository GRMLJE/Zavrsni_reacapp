import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext.jsx'
import { API_BASE } from '../utils/helpers.js'

const DiamondSVG = () => (
  <svg viewBox="0 0 14 14" fill="none">
    <path d="M7 2L12 7L7 12L2 7Z" stroke="#C0DD97" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

export default function Register() {
  const showToast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setErrors(er => ({ ...er, [field]: '' }))
    }
  }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Ime je obavezno.'
    if (!form.lastName.trim()) e.lastName = 'Prezime je obavezno.'
    if (!form.email.trim()) e.email = 'Email je obavezan.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Neispravan format emaila.'
    if (!form.password) e.password = 'Lozinka je obavezna.'
    else if (form.password.length < 6) e.password = 'Minimalno 6 znakova.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Greška kod registracije.', 'error')
        return
      }
      showToast('Račun kreiran! Preusmjeravanje...', 'success')
      setTimeout(() => navigate('/login'), 1600)
    } catch {
      showToast('Server nije dostupan.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-grid"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <div className="auth-page">
        <div className="auth-left anim-slide-right">
          <div className="auth-left-bg"></div>
          <Link to="/" className="logo">
            <div className="logo-mark"><DiamondSVG /></div>
            <span className="logo-text">KvartStory</span>
          </Link>
          <div className="auth-left-content">
            <p className="auth-quote">
              Budi dio<br /><em>lokalne priče.</em>
            </p>
            <p className="auth-quote-sub">
              Registriraj se i počni pratiti i objavljati događaje u svom kvartu.
            </p>
          </div>
        </div>

        <div className="auth-right anim-slide-up">
          <div className="auth-card">
            <div className="auth-card-header">
              <h1 className="auth-card-title">Registracija</h1>
              <p className="auth-card-sub">
                Već imaš račun? <Link to="/login">Prijavi se</Link>
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="firstName">Ime</label>
                  <input
                    type="text" id="firstName" placeholder="Ivan"
                    autoComplete="given-name"
                    value={form.firstName} onChange={set('firstName')}
                    className={errors.firstName ? 'error' : ''}
                  />
                  {errors.firstName && <span className="field-error show">{errors.firstName}</span>}
                </div>
                <div className="field">
                  <label htmlFor="lastName">Prezime</label>
                  <input
                    type="text" id="lastName" placeholder="Horvat"
                    autoComplete="family-name"
                    value={form.lastName} onChange={set('lastName')}
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && <span className="field-error show">{errors.lastName}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  type="email" id="email" placeholder="ivan@example.com"
                  autoComplete="email"
                  value={form.email} onChange={set('email')}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="field-error show">{errors.email}</span>}
              </div>

              <div className="field">
                <label htmlFor="password">Lozinka</label>
                <input
                  type="password" id="password" placeholder="Minimalno 6 znakova"
                  autoComplete="new-password"
                  value={form.password} onChange={set('password')}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="field-error show">{errors.password}</span>}
              </div>

              <button type="submit" className={`btn-auth${loading ? ' loading' : ''}`} disabled={loading}>
                <span className="btn-text">Kreiraj račun</span>
                {loading && <div className="spinner-inline"></div>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
