import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FeedbackSheet } from '../components/FeedbackSheet'
import { InlineError } from '../components/InlineError'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { useNotifications } from '../context/NotificationsContext'
import { useOnboarding } from '../context/OnboardingContext'
import { useSiteContent } from '../context/SiteContentContext'
import { useToast } from '../context/ToastContext'
import type { AppLocale } from '../i18n/types'
import { getLastAdminPath } from '../lib/adminPath'
import { USER_ERRORS, toUserSaveError } from '../lib/userErrors'
import './admin/Admin.css'
import './AuthPage.css'

export function AuthPage() {
  const { user, configured, loading, isAdmin, signIn, signUp, signOut } =
    useAuth()
  const { locale, setLocale, t } = useLocale()
  const { getCopy } = useSiteContent()
  const { openReplay } = useOnboarding()
  const {
    notifyNewRecipes,
    setNotifyNewRecipes,
    error: notifError,
    refresh: refreshNotif,
  } = useNotifications()
  const { showToast } = useToast()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [prefBusy, setPrefBusy] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from ?? '/favoritter'

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    const action = mode === 'login' ? signIn : signUp
    const message = await action(email.trim(), password)
    setBusy(false)
    if (message) {
      const calm = toUserSaveError(message, 'auth')
      // Keep short Norwegian auth hints (wrong password etc.) when already calm
      setError(
        message.length < 100 && !message.includes('{')
          ? message
          : calm === USER_ERRORS.save
            ? USER_ERRORS.load
            : calm,
      )
      return
    }
    if (mode === 'signup') {
      // If confirm-email is off, onAuthStateChange already logged us in.
      // Otherwise show tip and stay on login tab.
      setInfo(
        'Konto opprettet. Hvis e-postbekreftelse er på i Supabase, sjekk innboksen før du logger inn.',
      )
      setMode('login')
      setPassword('')
      return
    }
    navigate(from)
  }

  if (loading) {
    return (
      <div className="auth-page">
        <p>Laster konto…</p>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="auth-page">
        <h1 className="auth-page__title">Konto</h1>
        <p className="auth-page__lead">
          Supabase er ikke satt opp ennå. Lim inn{' '}
          <code>VITE_SUPABASE_URL</code> og{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> i <code>.env.local</code>,
          lagre, og start Vite på nytt for å bruke innlogging.
        </p>
        <button
          type="button"
          className="auth-page__link-btn"
          onClick={() => openReplay()}
        >
          Slik fungerer appen
        </button>
        <button
          type="button"
          className="auth-page__link-btn"
          onClick={() => setFeedbackOpen(true)}
        >
          Gi tilbakemelding
        </button>
        <FeedbackSheet
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          pagePath="/konto"
        />
        <Link to="/" className="auth-page__back">
          ← Tilbake til utforsk
        </Link>
      </div>
    )
  }

  function LanguagePicker() {
    return (
      <fieldset className="auth-page__lang">
        <legend className="auth-page__lang-legend">{t('auth.language')}</legend>
        <p className="auth-page__pref-hint">{t('auth.languageHint')}</p>
        <div className="auth-page__lang-options" role="radiogroup">
          {([
            { id: 'no', label: t('lang.norsk') },
            { id: 'en', label: t('lang.english') },
          ] as const).map((opt) => (
            <label key={opt.id} className="auth-page__lang-option">
              <input
                type="radio"
                name="app-locale"
                checked={locale === opt.id}
                onChange={() => void setLocale(opt.id as AppLocale)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (user) {
    return (
      <div className="auth-page">
        <h1 className="auth-page__title">{t('auth.title')}</h1>
        <p className="auth-page__lead">
          {t('auth.loggedInAs')} <strong>{user.email}</strong>
        </p>
        <LanguagePicker />
        <div className="auth-page__links">
          <Link to="/favoritter">{t('auth.myFavorites')}</Link>
          <button
            type="button"
            className="auth-page__link-btn"
            onClick={() => openReplay()}
          >
            {t('auth.howItWorks')}
          </button>
          <button
            type="button"
            className="auth-page__link-btn"
            onClick={() => setFeedbackOpen(true)}
          >
            {t('auth.feedback')}
          </button>
        </div>
        <FeedbackSheet
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          pagePath="/konto"
        />

        <label className="auth-page__pref">
          <input
            type="checkbox"
            checked={notifyNewRecipes}
            disabled={prefBusy}
            onChange={(event) => {
              void (async () => {
                setPrefBusy(true)
                const err = await setNotifyNewRecipes(event.target.checked)
                setPrefBusy(false)
                if (err) {
                  setError(err)
                  showToast(err)
                } else {
                  setError(null)
                  showToast(t('common.save'))
                }
              })()
            }}
          />
          <span>{t('auth.notifyRecipes')}</span>
        </label>
        <p className="auth-page__pref-hint">{t('auth.notifyHint')}</p>
        {notifError && (
          <InlineError
            compact
            message={notifError}
            onRetry={() => void refreshNotif()}
          />
        )}
        {error && !notifError && (
          <p className="auth-page__error">{error}</p>
        )}

        {isAdmin ? (
          <Link to={getLastAdminPath()} className="admin-back-chip">
            Tilbake til admin
          </Link>
        ) : null}
        <button
          type="button"
          className="auth-page__submit auth-page__submit--ghost"
          onClick={() => void signOut()}
        >
          {t('auth.logout')}
        </button>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">
        {mode === 'login' ? t('auth.login') : t('auth.signup')}
      </h1>
      <LanguagePicker />
      <p className="auth-page__lead">
        {getCopy(
          'favoritter.helper',
          'Lagre favoritter og mapper, pluss private notater på oppskrifter.',
        )}
      </p>

      <div className="auth-page__tabs" role="tablist">
        <button
          type="button"
          className={`auth-page__tab${mode === 'login' ? ' auth-page__tab--on' : ''}`}
          onClick={() => setMode('login')}
        >
          Logg inn
        </button>
        <button
          type="button"
          className={`auth-page__tab${mode === 'signup' ? ' auth-page__tab--on' : ''}`}
          onClick={() => setMode('signup')}
        >
          Registrer
        </button>
      </div>

      <form className="auth-page__form" onSubmit={onSubmit}>
        <label className="auth-page__label">
          E-post
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="auth-page__label">
          Passord
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="auth-page__error">{error}</p>}
        {info && <p className="auth-page__info">{info}</p>}
        <button type="submit" className="auth-page__submit" disabled={busy}>
          {busy
            ? 'Vent litt…'
            : mode === 'login'
              ? 'Logg inn'
              : 'Opprett konto'}
        </button>
      </form>

      <button
        type="button"
        className="auth-page__link-btn auth-page__link-btn--below"
        onClick={() => openReplay()}
      >
        Slik fungerer appen
      </button>
      <button
        type="button"
        className="auth-page__link-btn auth-page__link-btn--below"
        onClick={() => setFeedbackOpen(true)}
      >
        Gi tilbakemelding
      </button>
      <FeedbackSheet
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        pagePath="/konto"
      />
    </div>
  )
}
