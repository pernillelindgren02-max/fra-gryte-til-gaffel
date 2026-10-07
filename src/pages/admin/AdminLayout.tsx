import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getLastAppPath, rememberAdminPath } from '../../lib/adminPath'
import './Admin.css'

const NAV = [
  { to: '/admin', end: true, label: 'Oversikt' },
  { to: '/admin/oppskrifter', label: 'Oppskrifter' },
  { to: '/admin/explore', label: 'Explore' },
  { to: '/admin/tips', label: 'Tips og triks' },
  { to: '/admin/onboarding', label: 'Onboarding' },
  { to: '/admin/innsikt', label: 'Innsikt' },
  { to: '/admin/tekster', label: 'Tekster' },
  { to: '/admin/design', label: 'Design' },
  { to: '/admin/brukere', label: 'Brukere' },
  { to: '/admin/varsler', label: 'Varsler' },
  { to: '/admin/innstillinger', label: 'Innstillinger' },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    rememberAdminPath(location.pathname + location.search)
  }, [location.pathname, location.search])

  function goToApp() {
    rememberAdminPath(location.pathname + location.search)
    navigate(getLastAppPath() || '/')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <p className="admin-sidebar__eyebrow">Privat</p>
          <p className="admin-sidebar__title">Kontrollsenter</p>
        </div>
        <nav className="admin-sidebar__nav" aria-label="Admin">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? 'admin-sidebar__link admin-sidebar__link--active'
                  : 'admin-sidebar__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="admin-sidebar__back"
          onClick={goToApp}
        >
          Tilbake til appen
        </button>
        <Link to="/" className="admin-sidebar__back-link">
          Eller åpne Utforsk
        </Link>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
