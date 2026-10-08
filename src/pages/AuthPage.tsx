import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BackToExplore } from '../components/BackToExplore'
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
import './AuthPage.css'

function AccountSection({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`auth-page__section${className ? ` ${className}` : ''}`}>
      <h2 className="auth-page__section-title">{title}</h2>
      {children}
    </section>
  )
}

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
      setInfo(
        'Konto opprettet. Hvis e-postbekreftelse er på i Supabase, sjekk innboksen før du logger inn.',
      )
      setMode('login')
      setPassword('')
      return
    }
    navigate(from)
  }

  function LanguagePicker({ compact = false }: { compact?: boolean }) {
    return (
      <div
        className={`auth-page__lang${compact ? ' auth-page__lang--compact' : ''}`}
        role="radiogroup"
        aria-label={t('auth.sectionLanguage')}
      >
        {([
          { id: 'no', label: t('lang.norsk') },
          { id: 'en', label: t('lang.english') },
        ] as const).map((opt) => (
          <label
            key={opt.id}
            className={`auth-page__lang-option${locale === opt.id ? ' auth-page__lang-option--on' : ''}`}
          >
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
    )
  }

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-page__loading">{t('auth.busy')}</p>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="auth-page">
        <BackToExplore />
        <header className="auth-page__header">
          <h1 className="auth-page__title">{t('auth.title')}</h1>
        </header>
        <p className="auth-page__lead">
          Supabase er ikke satt opp ennå. Lim inn{' '}
          <code>VITE_SUPABASE_URL</code> og{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> i <code>.env.local</code>,
          lagre, og start Vite på nytt for å bruke innlogging.
        </p>
        <AccountSection title={t('auth.sectionYourApp')}>
          <div className="auth-page__group">
            <button
              type="button"
              className="auth-page__row"
              onClick={() => openReplay()}
            >
              <span>{t('auth.howItWorks')}</span>
              <span className="auth-page__chevron" aria-hidden="true">
                ›
              </span>
            </button>
            <button
              type="button"
              className="auth-page__row"
              onClick={() => setFeedbackOpen(true)}
            >
              <span>{t('auth.feedback')}</span>
              <span className="auth-page__chevron" aria-hidden="true">
                ›
              </span>
            </button>
          </div>
        </AccountSection>
        <FeedbackSheet
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          pagePath="/konto"
        />
      </div>
    )
  }

  if (user) {
    return (
      <div className="auth-page">
        <BackToExplore />
        <header className="auth-page__header">
          <h1 className="auth-page__title">{t('auth.title')}</h1>
          {user.email ? (
            <p className="auth-page__email">{user.email}</p>
          ) : null}
        </header>

        <AccountSection title={t('auth.sectionLanguage')}>
          <LanguagePicker compact />
        </AccountSection>

        <AccountSection title={t('auth.sectionYourApp')}>
          <div className="auth-page__group">
            <Link to="/favoritter" className="auth-page__row">
              <span>{t('auth.myFavorites')}</span>
              <span className="auth-page__chevron" aria-hidden="true">
                ›
              </span>
            </Link>
            <button
              type="button"
              className="auth-page__row"
              onClick={() => openReplay()}
            >
              <span>{t('auth.howItWorks')}</span>
              <span className="auth-page__chevron" aria-hidden="true">
                ›
              </span>
            </button>
            <button
              type="button"
              className="auth-page__row"
              onClick={() => setFeedbackOpen(true)}
            >
              <span>{t('auth.feedback')}</span>
              <span className="auth-page__chevron" aria-hidden="true">
                ›
              </span>
            </button>
          </div>
        </AccountSection>

        <FeedbackSheet
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          pagePath="/konto"
        />

        <AccountSection title={t('auth.sectionNotifications')}>
          <div className="auth-page__group auth-page__group--pref">
            <label className="auth-page__pref-row">
              <span className="auth-page__pref-copy">
                <span className="auth-page__pref-label">
                  {t('auth.notifyRecipes')}
                </span>
                <span className="auth-page__pref-hint">
                  {t('auth.notifyHint')}
                </span>
              </span>
              <span className="auth-page__switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={notifyNewRecipes}
                  disabled={prefBusy}
                  aria-label={t('auth.notifyRecipes')}
                  onChange={(event) => {
                    void (async () => {
                      setPrefBusy(true)
                      const err = await setNotifyNewRecipes(
                        event.target.checked,
                      )
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
                <span className="auth-page__switch-track" aria-hidden="true" />
              </span>
            </label>
          </div>
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
        </AccountSection>

        {isAdmin ? (
          <AccountSection
            title={t('auth.sectionAdmin')}
            className="auth-page__section--admin"
          >
            <div className="auth-page__group auth-page__group--quiet">
              <Link to={getLastAdminPath()} className="auth-page__row auth-page__row--quiet">
                <span>{t('auth.backToAdmin')}</span>
                <span className="auth-page__chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </div>
          </AccountSection>
        ) : null}

        <div className="auth-page__account-actions">
          <button
            type="button"
            className="auth-page__logout"
            onClick={() => void signOut()}
          >
            {t('auth.logout')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <BackToExplore />
      <header className="auth-page__header">
        <h1 className="auth-page__title">
          {mode === 'login' ? t('auth.login') : t('auth.signup')}
        </h1>
      </header>

      <AccountSection title={t('auth.sectionLanguage')}>
        <LanguagePicker compact />
      </AccountSection>

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
          {t('auth.login')}
        </button>
        <button
          type="button"
          className={`auth-page__tab${mode === 'signup' ? ' auth-page__tab--on' : ''}`}
          onClick={() => setMode('signup')}
        >
          {t('auth.signup')}
        </button>
      </div>

      <form className="auth-page__form" onSubmit={onSubmit}>
        <label className="auth-page__label">
          {t('auth.email')}
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="auth-page__label">
          {t('auth.password')}
          <input
            type="password"
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
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
            ? t('auth.busy')
            : mode === 'login'
              ? t('auth.submitLogin')
              : t('auth.submitSignup')}
        </button>
      </form>

      <AccountSection title={t('auth.sectionYourApp')}>
        <div className="auth-page__group">
          <button
            type="button"
            className="auth-page__row"
            onClick={() => openReplay()}
          >
            <span>{t('auth.howItWorks')}</span>
            <span className="auth-page__chevron" aria-hidden="true">
              ›
            </span>
          </button>
          <button
            type="button"
            className="auth-page__row"
            onClick={() => setFeedbackOpen(true)}
          >
            <span>{t('auth.feedback')}</span>
            <span className="auth-page__chevron" aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      </AccountSection>
      <FeedbackSheet
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        pagePath="/konto"
      />
    </div>
  )
}
