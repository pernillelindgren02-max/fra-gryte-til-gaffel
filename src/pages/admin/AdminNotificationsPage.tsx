import './Admin.css'

export function AdminNotificationsPage() {
  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="admin__eyebrow">Varsler</p>
          <h1 className="admin__title">Kommende funksjon</h1>
        </div>
      </header>
      <p className="admin__muted">
        Her kan du senere varsle brukere når nye oppskrifter publiseres. Ingen
        push sendes ennå. Oppskrifter har et felt «Varsle ved publisering»
        (stub) klar for senere.
      </p>
      <ul className="admin__muted">
        <li>Ingen FCM / web-push koblet</li>
        <li>Ingen e-postutsending</li>
        <li>Kun forberedelse i databasen</li>
      </ul>
    </div>
  )
}
