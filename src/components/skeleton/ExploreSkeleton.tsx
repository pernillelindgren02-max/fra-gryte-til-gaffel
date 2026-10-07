import { RecipeCardSkeleton, RecipeCardSkeletonGrid } from './RecipeCardSkeleton'
import { SkeletonBone } from './SkeletonBone'

/** Mirrors Explore’s featured + grid feed while recipes load. */
export function ExploreSkeleton() {
  return (
    <div className="explore-sections" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Laster oppskrifter…</span>
      <section className="explore-section explore-section--featured">
        <SkeletonBone
          className="explore-section__title"
          style={{ height: '1rem', width: '9rem', marginBottom: '0.7rem' }}
        />
        <div className="explore-featured">
          <RecipeCardSkeleton layout="featured" />
        </div>
        <RecipeCardSkeletonGrid count={4} className="explore-feed explore-feed--after-feature" />
      </section>
      <section className="explore-section explore-section--roomy">
        <SkeletonBone
          className="explore-section__title"
          style={{ height: '1rem', width: '11rem', marginBottom: '0.7rem' }}
        />
        <RecipeCardSkeletonGrid count={4} />
      </section>
    </div>
  )
}

/** Search / filter results grid skeleton. */
export function ExploreResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="explore-results" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Laster resultater…</span>
      <div className="explore-results__header">
        <SkeletonBone style={{ height: '1rem', width: '6rem' }} />
        <SkeletonBone style={{ height: '0.85rem', width: '5rem' }} />
      </div>
      <RecipeCardSkeletonGrid count={count} />
    </section>
  )
}
