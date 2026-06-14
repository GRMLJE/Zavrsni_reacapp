import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { API_BASE } from '../utils/helpers.js'

const DiamondSVG = () => (
  <svg viewBox="0 0 14 14" fill="none">
    <path d="M7 2L12 7L7 12L2 7Z" stroke="#C0DD97" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

export default function Login() {
  const { login } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!email.trim()) e.email = 'Email je obavezan.'
    if (!password) e.password = 'Lozinka je obavezna.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Greška kod prijave.', 'error')
        return
      }
      login(data.user, data.token)
      showToast(`Dobrodošao, ${data.user.first_name}!`, 'success')
      setTimeout(() => navigate('/dashboard'), 1200)
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
              Dobrodošao<br /><em>natrag.</em>
            </p>
            <p className="auth-quote-sub">
              Prijavi se i nastavi pratiti događaje u svom kvartu.
            </p>
          </div>
        </div>

        <div className="auth-right anim-slide-up">
          <div className="auth-card">
            <div className="auth-card-header">
              <h1 className="auth-card-title">Prijava</h1>
              <p className="auth-card-sub">
                Nemaš račun? <Link to="/register">Registriraj se</Link>
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="ivan@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })) }}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="field-error show">{errors.email}</span>}
              </div>

              <div className="field">
                <label htmlFor="password">Lozinka</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Upiši lozinku"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })) }}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="field-error show">{errors.password}</span>}
              </div>

              <button type="submit" className={`btn-auth${loading ? ' loading' : ''}`} disabled={loading}>
                <span className="btn-text">Prijavi se</span>
                {loading && <div className="spinner-inline"></div>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
