import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AppNav.css'

export function AppNav() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const onAuth = location.pathname.startsWith('/konto')

  return (
    <nav className="app-nav" aria-label="Hovedmeny">
      <Link to="/" className="app-nav__link">
        Utforsk
      </Link>
      <Link to="/favoritter" className="app-nav__link">
        Favoritter
      </Link>
      <Link to="/handleliste" className="app-nav__link">
        Handleliste
      </Link>
      <Link to="/mapper" className="app-nav__link">
        Mapper
      </Link>
      {!loading &&
        (user ? (
          <Link
            to="/konto"
            className={`app-nav__link${onAuth ? ' app-nav__link--active' : ''}`}
          >
            Konto
          </Link>
        ) : (
          <Link to="/konto" className="app-nav__link app-nav__link--accent">
            Logg inn
          </Link>
        ))}
    </nav>
  )
}
