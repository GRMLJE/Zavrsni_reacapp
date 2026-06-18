import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const HomeSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const CloseSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const HamburgerSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

export default function Header({ activePage }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const displayName = user?.first_name || user?.name || 'Korisnik'
  const initial = displayName.charAt(0).toUpperCase()

  function handleLogout() {
    logout()
    navigate('/login')
    setDrawerOpen(false)
  }

  function closeDrawer(e) {
    if (!e.target.closest('.mobile-drawer-inner')) setDrawerOpen(false)
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-mark">
              <HomeSVG />
            </span>
            <span className="logo-text">KvartStory</span>
          </Link>

          <button
            className="mobile-menu-btn"
            style={{ display: 'flex' }}
            aria-label="Izbornik"
            onClick={() => setDrawerOpen(o => !o)}
          >
            {drawerOpen ? <CloseSVG /> : <HamburgerSVG />}
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="mobile-drawer open" onClick={closeDrawer}>
          <div className="mobile-drawer-inner">
            <Link to="/events" className={`mobile-nav-item${activePage === 'events' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
              Discover
            </Link>
            <Link to="/map" className={`mobile-nav-item${activePage === 'map' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
              Karta
            </Link>
            <Link to="/add-event" className={`mobile-nav-item${activePage === 'add-event' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
              Organiziraj
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={`mobile-nav-item${activePage === 'admin' ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
                Admin
              </Link>
            )}
            <div className="mobile-drawer-actions">
              {user ? (
                <>
                  <Link to="/profile" className="btn-header-secondary w-full" onClick={() => setDrawerOpen(false)}>
                    <span className="user-avatar">{initial}</span>
                    <span>{displayName}</span>
                  </Link>
                  <button className="btn-header-danger w-full" onClick={handleLogout}>Odjava</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-header-secondary w-full" onClick={() => setDrawerOpen(false)}>Prijava</Link>
                  <Link to="/register" className="btn-header-primary w-full" onClick={() => setDrawerOpen(false)}>Počni besplatno</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
