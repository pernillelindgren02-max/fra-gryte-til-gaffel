import { useState } from 'react'
import './SafeImage.css'

const PLACEHOLDER = '/images/recipes/placeholder-dish.jpg'

type SafeImageProps = {
  src?: string | null
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/** Recipe image with branded neutral fallback when src is missing or fails. */
export function SafeImage({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
}: SafeImageProps) {
  const initial = src?.trim() ? src : PLACEHOLDER
  const [current, setCurrent] = useState(initial)
  const [failed, setFailed] = useState(false)

  if (failed && current === PLACEHOLDER) {
    return (
      <div
        className={`safe-image safe-image--blank ${className}`.trim()}
        aria-hidden={alt ? undefined : true}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
      />
    )
  }

  return (
    <img
      className={`safe-image ${className}`.trim()}
      src={current}
      alt={alt}
      loading={loading}
      onError={() => {
        if (current !== PLACEHOLDER) {
          setCurrent(PLACEHOLDER)
          return
        }
        setFailed(true)
      }}
    />
  )
}
