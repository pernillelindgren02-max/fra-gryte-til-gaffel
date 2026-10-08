import { useLocale } from '../context/LocaleContext'
import type { AppLocale } from '../i18n/types'
import './LanguageChoiceSheet.css'

/**
 * First-time language choice — simple, non-intrusive, before onboarding.
 */
export function LanguageChoiceSheet() {
  const { needsLanguageChoice, setLocale, t, markLanguageChosen } = useLocale()

  if (!needsLanguageChoice) return null

  async function choose(locale: AppLocale) {
    await setLocale(locale)
    markLanguageChosen()
  }

  return (
    <div className="lang-choice" role="dialog" aria-modal="true">
      <div className="lang-choice__card">
        <h1 className="lang-choice__title">{t('lang.chooseTitle')}</h1>
        <p className="lang-choice__lead">{t('lang.chooseLead')}</p>
        <div className="lang-choice__actions">
          <button
            type="button"
            className="lang-choice__btn"
            onClick={() => void choose('no')}
          >
            {t('lang.norsk')}
          </button>
          <button
            type="button"
            className="lang-choice__btn lang-choice__btn--secondary"
            onClick={() => void choose('en')}
          >
            {t('lang.english')}
          </button>
        </div>
      </div>
    </div>
  )
}
