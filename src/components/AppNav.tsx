import {
  useEffect,
  useId,
  useRef,
  useState,
  type TouchEvent,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AppNav.css'

type NavItem = {
  to: string
  label: string
  match: (path: string) => boolean
}

const MAIN_ITEMS: NavItem[] = [
  { to: '/', label: 'Utforsk', match: (path) => path === '/' },
  {
    to: '/tips',
    label: 'Tips og triks',
    match: (path) => path.startsWith('/tips'),
  },
  {
    to: '/favoritter',
    label: 'Favoritter',
    match: (path) => path.startsWith('/favoritter'),
  },
  {
    to: '/handleliste',
    label: 'Handleliste',
    match: (path) => path.startsWith('/handleliste'),
  },
  {
    to: '/hjemme',
    label: 'Hjemme',
    match: (path) => path.startsWith('/hjemme'),
  },
]

function GryteIcon() {
  return (
    <svg
      className="app-nav__gryte-icon"
      viewBox="0 0 48 48"
      width="26"
      height="26"
      aria-hidden="true"
    >
      <circle cx="24" cy="10" r="2.2" fill="currentColor" />
      <path
        d="M12 16.5c0-1.2 5.2-2.8 12-2.8s12 1.6 12 2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M10 22c-3.2 0-4.8 2.2-4.8 4.2S7 30 10 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M38 22c3.2 0 4.8 2.2 4.8 4.2S41 30 38 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M11 20.5h26c0 2.2.2 4.5-.6 8.2-.8 3.8-2.4 8.3-5.2 10.2-1.6 1.1-4.2 1.6-7.2 1.6s-5.6-.5-7.2-1.6c-2.8-1.9-4.4-6.4-5.2-10.2-.8-3.7-.6-6-.6-8.2Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M16 24.5c1.2 5.5 3.4 9.5 8 9.5"
        fill="none"
        stroke="color-mix(in srgb, white 55%, transparent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AppNav() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const path = location.pathname
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStartY = useRef<number | null>(null)

  const accountLabel = user ? 'Konto' : 'Logg inn'
  const accountActive = path.startsWith('/konto')

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function onPanelTouchStart(event: TouchEvent) {
    touchStartY.current = event.touches[0]?.clientY ?? null
  }

  function onPanelTouchEnd(event: TouchEvent) {
    const start = touchStartY.current
    touchStartY.current = null
    if (start == null) return
    const end = event.changedTouches[0]?.clientY ?? start
    if (end - start > 70) setOpen(false)
  }

  return (
    <div className="app-nav">
      <button
        type="button"
        className={`app-nav__menu-btn${open ? ' app-nav__menu-btn--open' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={open ? 'Lukk meny' : 'Åpne meny'}
        onClick={() => setOpen((value) => !value)}
      >
        <GryteIcon />
      </button>

      {open && (
        <div className="app-nav__overlay" role="presentation">
          <button
            type="button"
            className="app-nav__backdrop"
            aria-label="Lukk meny"
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            className="app-nav__sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Hovedmeny"
            onTouchStart={onPanelTouchStart}
            onTouchEnd={onPanelTouchEnd}
          >
            <div className="app-nav__sheet-handle" aria-hidden="true" />
            <div className="app-nav__sheet-header">
              <p className="app-nav__sheet-brand">Fra gryte til gaffel</p>
              <button
                ref={closeRef}
                type="button"
                className="app-nav__close"
                aria-label="Lukk"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="app-nav__list" aria-label="Hovedmeny">
              {MAIN_ITEMS.map((item) => {
                const active = item.match(path)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`app-nav__item${active ? ' app-nav__item--active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              })}
              {!loading && (
                <Link
                  to="/konto"
                  className={`app-nav__item app-nav__item--account${
                    accountActive ? ' app-nav__item--active' : ''
                  }`}
                  aria-current={accountActive ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {accountLabel}
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
