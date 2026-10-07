import { SkeletonBone } from './SkeletonBone'
import { RecipeCardSkeletonGrid } from './RecipeCardSkeleton'

export function FolderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Laster mapper…</span>
      <ul className="folder-library sk-folder">
        <li>
          <SkeletonBone className="sk-folder__tile sk-folder__tile--heart" />
        </li>
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <SkeletonBone className="sk-folder__tile" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function FolderRecipesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Laster oppskrifter…</span>
      <RecipeCardSkeletonGrid count={count} className="account-list__grid" />
    </div>
  )
}
