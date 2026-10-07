import { useEffect, useState } from 'react'
import { fetchAppCopy, saveAppCopy } from '../../lib/siteContentApi'
import { COPY_FIELDS, DEFAULT_COPY, type AppCopyMap } from '../../lib/siteDefaults'
import { useSiteContent } from '../../context/SiteContentContext'
import './Admin.css'

export function AdminCopyPage() {
  const { refresh } = useSiteContent()
  const [copy, setCopy] = useState<AppCopyMap>({ ...DEFAULT_COPY })
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void (async () => {
      const next = await fetchAppCopy()
      if (active) {
        setCopy(next)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function onSave() {
    if (
      !window.confirm(
        'Lagre tekstendringer? De vises i appen for alle brukere.',
      )
    ) {
      return
    }
    setSaving(true)
    try {
      await saveAppCopy(copy)
      await refresh()
      setMessage('Tekster lagret.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function resetDefaults() {
    if (!window.confirm('Tilbakestille alle felter til standardtekst?')) return
    setCopy({ ...DEFAULT_COPY })
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__muted">Laster…</p>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Tekster</p>
          <h1 className="admin__title">App-tekster</h1>
        </div>
        <div className="admin__header-actions">
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={resetDefaults}
          >
            Standard
          </button>
          <button
            type="button"
            className="admin__btn"
            disabled={saving}
            onClick={() => void onSave()}
          >
            {saving ? 'Lagrer…' : 'Lagre'}
          </button>
        </div>
      </header>

      {message && <p className="admin__message">{message}</p>}

      <div className="admin-form">
        {COPY_FIELDS.map((field) => (
          <label key={field.key} className="admin-form__field">
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea
                rows={3}
                value={copy[field.key] ?? ''}
                onChange={(e) =>
                  setCopy((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            ) : (
              <input
                value={copy[field.key] ?? ''}
                onChange={(e) =>
                  setCopy((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            )}
          </label>
        ))}
      </div>
    </div>
  )
}
