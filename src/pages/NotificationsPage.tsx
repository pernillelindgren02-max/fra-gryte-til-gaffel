import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import './NotificationsPage.css'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function NotificationsPage() {
  const { user, configured, loading: authLoading } = useAuth()
  const {
    items,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
  } = useNotifications()

  if (authLoading || loading) {
    return (
      <div className="varsler-page">
        <p className="varsler-page__muted">Laster varsler…</p>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="varsler-page">
        <h1 className="varsler-page__title">Varsler</h1>
        <p className="varsler-page__muted">
          Supabase er ikke konfigurert ennå.
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="varsler-page">
        <h1 className="varsler-page__title">Varsler</h1>
        <p className="varsler-page__muted">
          <Link to="/konto">Logg inn</Link> for å se varsler om nye
          oppskrifter.
        </p>
      </div>
    )
  }

  return (
    <div className="varsler-page">
      <header className="varsler-page__header">
        <div>
          <h1 className="varsler-page__title">Varsler</h1>
          <p className="varsler-page__lead">
            {unreadCount > 0
              ? `${unreadCount} ulest${unreadCount === 1 ? '' : 'e'}`
              : 'Ingen uleste'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="varsler-page__mark-all"
            onClick={() => void markAllRead()}
          >
            Merk alle som lest
          </button>
        )}
      </header>

      {error && <p className="varsler-page__error">{error}</p>}

      {items.length === 0 ? (
        <p className="varsler-page__empty">
          Ingen varsler ennå. Når nye oppskrifter publiseres og du har
          varsler på, dukker de opp her.
        </p>
      ) : (
        <ul className="varsler-list">
          {items.map((item) => {
            const unread = !item.read_at
            return (
              <li
                key={item.notification_id}
                className={`varsler-list__item${unread ? ' varsler-list__item--unread' : ''}`}
              >
                <button
                  type="button"
                  className="varsler-list__main"
                  onClick={() => {
                    if (unread) void markRead(item.notification_id)
                  }}
                >
                  <span className="varsler-list__title">{item.title}</span>
                  <span className="varsler-list__body">{item.body}</span>
                  <span className="varsler-list__meta">
                    {formatWhen(item.sent_at)}
                    {unread ? ' · Ulest' : ' · Lest'}
                  </span>
                </button>
                {item.recipe_id && (
                  <Link
                    to={`/oppskrift/${item.recipe_id}`}
                    className="varsler-list__link"
                    onClick={() => {
                      if (unread) void markRead(item.notification_id)
                    }}
                  >
                    Åpne oppskrift
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="varsler-page__hint">
        Skru varsler av/på under <Link to="/konto">Konto</Link>.
      </p>
    </div>
  )
}
