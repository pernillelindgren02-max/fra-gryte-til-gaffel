import { useEffect, useState } from 'react'
import {
  fetchAdminSettings,
  saveAdminSetting,
} from '../../lib/siteContentApi'
import './Admin.css'

export function AdminSettingsPage() {
  const [migrationConfirmed, setMigrationConfirmed] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const settings = await fetchAdminSettings()
        if (!active) return
        setMigrationConfirmed(Boolean(settings.migration_confirmed))
        setShowBanner(
          settings.show_cloud_fallback_banner === undefined
            ? true
            : Boolean(settings.show_cloud_fallback_banner),
        )
      } catch (err) {
        if (active) setMessage(err instanceof Error ? err.message : String(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function onSave() {
    if (!window.confirm('Lagre innstillinger?')) return
    setSaving(true)
    try {
      await saveAdminSetting('migration_confirmed', migrationConfirmed)
      await saveAdminSetting('show_cloud_fallback_banner', showBanner)
      setMessage('Innstillinger lagret.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
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
          <p className="admin__eyebrow">Innstillinger</p>
          <h1 className="admin__title">Admin-innstillinger</h1>
        </div>
        <button
          type="button"
          className="admin__btn"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? 'Lagrer…' : 'Lagre'}
        </button>
      </header>

      {message && <p className="admin__message">{message}</p>}

      <label className="admin-form__check">
        <input
          type="checkbox"
          checked={migrationConfirmed}
          onChange={(e) => setMigrationConfirmed(e.target.checked)}
        />
        Migrering bekreftet (lokale oppskrifter beholdes som fallback uansett)
      </label>

      <label className="admin-form__check">
        <input
          type="checkbox"
          checked={showBanner}
          onChange={(e) => setShowBanner(e.target.checked)}
        />
        Vis sky-fallback-banner i Explore når lasting feiler (lokalt i
        innstillinger — banner styres også av fetch-feil)
      </label>

      <p className="admin__muted">
        Lokale data i <code>src/data/recipes.ts</code> slettes ikke. Appen
        faller tilbake dit hvis databasen er tom eller utilgjengelig.
      </p>
    </div>
  )
}
