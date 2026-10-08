import { Link } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import './BackToExplore.css'

type BackToExploreProps = {
  /** Show text label next to the arrow (default: arrow + short label). */
  withLabel?: boolean
  className?: string
}

/**
 * Consistent top-left control on secondary pages — always goes to Explore,
 * never browser history. Recipe detail keeps its own contextual back.
 */
export function BackToExplore({
  withLabel = true,
  className = '',
}: BackToExploreProps) {
  const { t } = useLocale()
  const label = t('nav.backToExplore')

  return (
    <Link
      to="/"
      className={`back-to-explore${className ? ` ${className}` : ''}`}
      aria-label={label}
    >
      <svg
        className="back-to-explore__arrow"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M15 5.5 8.5 12 15 18.5"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withLabel ? (
        <span className="back-to-explore__label">{label}</span>
      ) : null}
    </Link>
  )
}
