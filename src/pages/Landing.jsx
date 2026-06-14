import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import { API_BASE, animateNumber } from '../utils/helpers.js'

export default function Landing() {
  const { user } = useAuth()
  const [statEvents, setStatEvents] = useState('–')
  const [statCities, setStatCities] = useState('–')
  const stepsRef = useRef(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const [evRes, citRes] = await Promise.all([
          fetch(`${API_BASE}/events`),
          fetch(`${API_BASE}/cities`),
        ])
        if (evRes.ok) {
          const ev = await evRes.json()
          animateNumber(setStatEvents, ev.length)
        } else {
          setStatEvents('0')
        }
        if (citRes.ok) {
          const ct = await citRes.json()
          animateNumber(setStatCities, ct.length)
        } else {
          setStatCities('1')
        }
      } catch {
        setStatEvents('0')
        setStatCities('1')
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const targets = document.querySelectorAll('.step-card, .feature-item')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translateY(0)'
          obs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    targets.forEach((el, i) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(20px)'
      el.style.transition = `opacity 0.45s ease ${i * 80}ms, transform 0.45s ease ${i * 80}ms`
      obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="orb orb-1" aria-hidden="true"></div>
      <div className="orb orb-2" aria-hidden="true"></div>
      <div className="orb orb-3" aria-hidden="true"></div>

      <Header activePage="landing" />

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge anim-slide-down">
            <span className="hero-badge-dot"></span>
            Platforma za lokalne zajednice
          </div>
          <h1 className="hero-title anim-slide-up anim-d1">
            Povežite se s<br />
            <em>kvartom koji volite</em>
          </h1>
          <p className="hero-subtitle anim-slide-up anim-d2">
            Otkrijte događaje u svom susjedstvu, pridružite se lokalnim aktivnostima
            i organizirajte vlastite susrete. Sve na jednom mjestu.
          </p>
          <div className="hero-cta anim-slide-up anim-d3">
            <Link to="/events" className="btn-hero-primary">
              Istraži događaje
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
              </svg>
            </Link>
            {user ? (
              <Link to="/add-event" className="btn-hero-secondary">Dodaj događaj →</Link>
            ) : (
              <Link to="/register" className="btn-hero-secondary">Kreiraj račun</Link>
            )}
          </div>
          <div className="hero-stats anim-slide-up anim-d4">
            <div className="hero-stat">
              <span className="hero-stat-num">{statEvents}</span>
              <span className="hero-stat-label">Aktivnih događaja</span>
            </div>
            <div className="hero-stat-sep"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">{statCities}</span>
              <span className="hero-stat-label">Gradova</span>
            </div>
            <div className="hero-stat-sep"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">100%</span>
              <span className="hero-stat-label">Besplatno</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="float-card float-card-1">
            <div className="float-card-date">
              <span className="fc-day">14</span>
              <span className="fc-mon">svi</span>
            </div>
            <div className="float-card-info">
              <span className="fc-cat">Glazba</span>
              <span className="fc-title">Koncert u parku</span>
              <span className="fc-loc">📍 Maksimir, Zagreb</span>
            </div>
          </div>
          <div className="float-card float-card-2">
            <div className="float-card-date">
              <span className="fc-day">21</span>
              <span className="fc-mon">svi</span>
            </div>
            <div className="float-card-info">
              <span className="fc-cat">Sport</span>
              <span className="fc-title">Jutarnja yoga</span>
              <span className="fc-loc">📍 Jarun, Zagreb</span>
            </div>
          </div>
          <div className="float-card float-card-3">
            <div className="float-card-date">
              <span className="fc-day">28</span>
              <span className="fc-mon">svi</span>
            </div>
            <div className="float-card-info">
              <span className="fc-cat">Radionica</span>
              <span className="fc-title">Urbano vrtlarstvo</span>
              <span className="fc-loc">📍 Trnje, Zagreb</span>
            </div>
          </div>
          <div className="float-badge join-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Prijavljen/a!
          </div>
          <div className="float-badge attendee-badge">👥 24 prijavljenih</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how-section">
        <div className="section-inner">
          <div className="section-label">Kako funkcionira</div>
          <h2 className="section-title">Tri koraka do zajednice</h2>
          <div className="steps-grid" ref={stepsRef}>
            <div className="step-card">
              <div className="step-num">01</div>
              <div className="step-icon">🔍</div>
              <h3 className="step-title">Otkrij</h3>
              <p className="step-copy">Pregledaj događaje filtrirane po gradu, kvartu i kategoriji. Pronađi što te zanima u tvojoj blizini.</p>
            </div>
            <div className="step-card">
              <div className="step-num">02</div>
              <div className="step-icon">✅</div>
              <h3 className="step-title">Pridruži se</h3>
              <p className="step-copy">Jednim klikom se prijavi na događaj. Organizator vidi broj sudionika, ti nemaš obaveza.</p>
            </div>
            <div className="step-card">
              <div className="step-num">03</div>
              <div className="step-icon">🎉</div>
              <h3 className="step-title">Organiziraj</h3>
              <p className="step-copy">Stvori vlastiti događaj za kvart — ispuni formu, postavi datum i objavi. Gotovo za minutu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section features-section">
        <div className="section-inner features-inner">
          <div className="features-text">
            <div className="section-label">Zašto KvartStory</div>
            <h2 className="section-title left">Sve što ti treba za lokalne eventi</h2>
            <ul className="features-list">
              <li className="feature-item">
                <span className="feature-icon">📍</span>
                <div>
                  <strong>Lokalni fokus</strong>
                  <p>Filtriraj po gradu, kvartu i kategoriji. Nema nepotrebnih događaja s druge strane grada.</p>
                </div>
              </li>
              <li className="feature-item">
                <span className="feature-icon">⚡</span>
                <div>
                  <strong>Instant prijava</strong>
                  <p>Join/leave jednim klikom. Bez formulara, bez naplate, bez komplikacija.</p>
                </div>
              </li>
              <li className="feature-item">
                <span className="feature-icon">🗓️</span>
                <div>
                  <strong>Organiziraj za minutu</strong>
                  <p>Forma za kreiranje događaja s live previewom — vidiš kako će izgledati dok popunjavaš.</p>
                </div>
              </li>
              <li className="feature-item">
                <span className="feature-icon">👤</span>
                <div>
                  <strong>Profil i povijest</strong>
                  <p>Prati koje si eventi kreirao/la i na koje si se prijavio/la, sve na jednom mjestu.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="features-visual">
            <div className="fv-card">
              <div className="fv-header">
                <span className="fv-dot red"></span>
                <span className="fv-dot yellow"></span>
                <span className="fv-dot green"></span>
                <span className="fv-title">Discover — Zagreb</span>
              </div>
              <div className="fv-filters">
                <span className="fv-filter active">Svi kvartovi</span>
                <span className="fv-filter">Maksimir</span>
                <span className="fv-filter">Jarun</span>
                <span className="fv-filter">Trnje</span>
              </div>
              <div className="fv-list">
                <div className="fv-event">
                  <div className="fv-event-date"><span>14</span><span>svi</span></div>
                  <div className="fv-event-body">
                    <span className="fv-event-title">Koncert u parku</span>
                    <div className="fv-event-tags"><span className="fv-tag">Glazba</span><span className="fv-tag">Maksimir</span></div>
                  </div>
                  <span className="fv-join joined">✓</span>
                </div>
                <div className="fv-event">
                  <div className="fv-event-date"><span>21</span><span>svi</span></div>
                  <div className="fv-event-body">
                    <span className="fv-event-title">Jutarnja yoga</span>
                    <div className="fv-event-tags"><span className="fv-tag">Sport</span><span className="fv-tag">Jarun</span></div>
                  </div>
                  <span className="fv-join">+</span>
                </div>
                <div className="fv-event">
                  <div className="fv-event-date"><span>28</span><span>svi</span></div>
                  <div className="fv-event-body">
                    <span className="fv-event-title">Urbano vrtlarstvo</span>
                    <div className="fv-event-tags"><span className="fv-tag">Radionica</span><span className="fv-tag">Trnje</span></div>
                  </div>
                  <span className="fv-join">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Spreman/a za kvartove?</h2>
          <p className="cta-copy">Besplatna registracija. Nema naplate. Počni za 30 sekundi.</p>
          <div className="cta-buttons">
            {user ? (
              <Link to="/events" className="btn-cta-primary">Istraži događaje</Link>
            ) : (
              <Link to="/register" className="btn-cta-primary">Kreiraj račun besplatno</Link>
            )}
            <Link to="/events" className="btn-cta-secondary">Samo pregledaj →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <Link to="/" className="logo">
                <span className="logo-mark small">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span>
                <span className="logo-text">KvartStory</span>
              </Link>
              <p className="footer-brand-copy">Platforma koja povezuje ljude kroz lokalne događaje u njihovim kvartovima.</p>
              <div className="footer-badge">
                <span className="footer-badge-dot"></span>
                Besplatno za sve
              </div>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <span className="footer-col-title">Platforma</span>
                <Link to="/events" className="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Discover
                </Link>
                <Link to="/add-event" className="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  Organiziraj
                </Link>
                <Link to="/profile" className="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profil
                </Link>
              </div>
              <div className="footer-col">
                <span className="footer-col-title">Račun</span>
                <Link to="/login" className="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Prijava
                </Link>
                <Link to="/register" className="footer-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  Registracija
                </Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© 2026 KvartStory. Sva prava pridržana.</p>
            <div className="footer-bottom-right">
              <span className="footer-made">Napravljeno s ❤️ za lokalne zajednice</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
