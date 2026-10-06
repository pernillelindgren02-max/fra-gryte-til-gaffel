import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AppNav.css'

function linkClass(active: boolean, extra = '') {
  return `app-nav__link${active ? ' app-nav__link--active' : ''}${extra ? ` ${extra}` : ''}`
}

export function AppNav() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const path = location.pathname

  return (
    <nav className="app-nav" aria-label="Hovedmeny">
      <Link to="/" className={linkClass(path === '/')}>
        Utforsk
      </Link>
      <Link
        to="/favoritter"
        className={linkClass(path.startsWith('/favoritter'))}
      >
        Favoritter
      </Link>
      <Link
        to="/handleliste"
        className={linkClass(path.startsWith('/handleliste'))}
      >
        Handleliste
      </Link>
      <Link to="/hjemme" className={linkClass(path.startsWith('/hjemme'))}>
        Gryte unna
      </Link>
      {!loading &&
        (user ? (
          <Link
            to="/konto"
            className={linkClass(path.startsWith('/konto'), 'app-nav__link--end')}
          >
            Konto
          </Link>
        ) : (
          <Link
            to="/konto"
            className={linkClass(
              path.startsWith('/konto'),
              'app-nav__link--accent app-nav__link--end',
            )}
          >
            Logg inn
          </Link>
        ))}
    </nav>
  )
}
