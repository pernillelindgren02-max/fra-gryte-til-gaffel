import { SkeletonBone } from './SkeletonBone'

type RecipeCardSkeletonProps = {
  layout?: 'grid' | 'featured'
}

export function RecipeCardSkeleton({
  layout = 'grid',
}: RecipeCardSkeletonProps) {
  const featured = layout === 'featured'
  return (
    <div
      className={`sk-card${featured ? ' sk-card--featured' : ''}`}
      aria-hidden="true"
    >
      <SkeletonBone className="sk-card__media" media />
      <div className="sk-card__body">
        <SkeletonBone className="sk-card__title" />
        <SkeletonBone className="sk-card__meta" />
      </div>
    </div>
  )
}

type RecipeCardSkeletonGridProps = {
  count?: number
  layout?: 'grid' | 'featured'
  className?: string
  as?: 'ul' | 'div'
}

export function RecipeCardSkeletonGrid({
  count = 6,
  layout = 'grid',
  className = 'explore-feed',
  as = 'ul',
}: RecipeCardSkeletonGridProps) {
  const items = Array.from({ length: count }, (_, index) => (
    <li key={index}>
      <RecipeCardSkeleton layout={layout} />
    </li>
  ))

  if (as === 'div') {
    return (
      <div className={className} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <RecipeCardSkeleton key={index} layout={layout} />
        ))}
      </div>
    )
  }

  return (
    <ul className={className} aria-hidden="true">
      {items}
    </ul>
  )
}
