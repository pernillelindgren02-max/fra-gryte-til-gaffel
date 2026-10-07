import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteTipArticle,
  fetchAllTipsAdmin,
  updateTipArticle,
} from '../../lib/tipsApi'
import type { TipArticleListItem } from '../../lib/tipsTypes'
import { toUserSaveError } from '../../lib/userErrors'
import './Admin.css'

export function AdminTipsPage() {
  const [items, setItems] = useState<TipArticleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      const rows = await fetchAllTipsAdmin()
      setItems(rows)
      setMessage(null)
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function setStatus(item: TipArticleListItem, status: 'draft' | 'published') {
    setBusy(true)
    try {
      await updateTipArticle(item.id, { status })
      setMessage(status === 'published' ? 'Publisert.' : 'Satt som utkast.')
      await reload()
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(item: TipArticleListItem) {
    if (!window.confirm(`Slette «${item.title}» for godt?`)) return
    setBusy(true)
    try {
      await deleteTipArticle(item.id)
      setMessage('Artikkel slettet.')
      await reload()
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__muted">Laster tips…</p>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Tips og triks</p>
          <h1 className="admin__title">Artikler</h1>
        </div>
        <div className="admin__header-actions">
          <Link to="/admin/tips/new" className="admin__btn">
            Ny artikkel
          </Link>
        </div>
      </header>

      <p className="admin__muted">
        Feltguide-artikler med modulære blokker. Utkast er usynlige for
        brukere. Forhåndsvis fra redigeringssiden.
      </p>

      {message ? <p className="admin__message">{message}</p> : null}

      {items.length === 0 ? (
        <p className="admin__muted">
          Ingen artikler ennå. Kjør <code>supabase/tips-og-triks.sql</code> for
          seed, eller opprett en ny.
        </p>
      ) : (
        <ul className="admin-list">
          {items.map((item) => (
            <li key={item.id} className="admin-list__item">
              <div>
                <p className="admin-list__name">{item.title}</p>
                <p className="admin-list__meta">
                  {item.category?.name ?? 'Uten kategori'} ·{' '}
                  {item.status === 'published' ? 'Publisert' : 'Utkast'}
                  {item.is_featured ? ' · Fremhevet' : ''} · #{item.sort_order}
                </p>
              </div>
              <div className="admin-list__actions">
                <Link
                  to={`/admin/tips/${item.id}`}
                  className="admin__btn admin__btn--ghost"
                >
                  Rediger
                </Link>
                {item.status === 'published' ? (
                  <button
                    type="button"
                    className="admin__btn admin__btn--ghost"
                    disabled={busy}
                    onClick={() => void setStatus(item, 'draft')}
                  >
                    Avpubliser
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin__btn admin__btn--ghost"
                    disabled={busy}
                    onClick={() => void setStatus(item, 'published')}
                  >
                    Publiser
                  </button>
                )}
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  disabled={busy}
                  onClick={() => void onDelete(item)}
                >
                  Slett
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
