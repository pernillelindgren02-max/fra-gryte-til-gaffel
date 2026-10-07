import { SkeletonBone } from './SkeletonBone'

export function RecipeDetailSkeleton() {
  return (
    <div className="sk-detail" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Laster oppskrift…</span>
      <div className="sk-detail__top">
        <SkeletonBone className="sk-detail__back" />
        <SkeletonBone className="sk-detail__save" round />
      </div>
      <SkeletonBone className="sk-detail__hero" media />
      <div className="sk-detail__header">
        <SkeletonBone className="sk-detail__title" />
        <SkeletonBone className="sk-detail__blurb" />
        <SkeletonBone className="sk-detail__blurb-2" />
        <SkeletonBone className="sk-detail__facts" />
        <SkeletonBone className="sk-detail__portions" />
        <SkeletonBone className="sk-detail__cta" />
      </div>
      <section className="sk-detail__section">
        <SkeletonBone className="sk-detail__section-title" />
        <SkeletonBone className="sk-detail__row" />
        <SkeletonBone className="sk-detail__row" />
        <SkeletonBone className="sk-detail__row" />
        <SkeletonBone className="sk-detail__row" />
      </section>
      <section className="sk-detail__section">
        <SkeletonBone className="sk-detail__section-title" />
        <SkeletonBone className="sk-detail__step" />
        <SkeletonBone className="sk-detail__step" />
        <SkeletonBone className="sk-detail__step" />
      </section>
    </div>
  )
}
