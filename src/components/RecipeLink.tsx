import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { freezeExploreScroll } from '../lib/exploreSession'
import { recipePath } from '../lib/recipeLinks'

type RecipeLinkProps = {
  recipeId: string
  className?: string
  children: ReactNode
  onClick?: () => void
  /** Optional entry source for analytics (search / explore / pantry…). */
  entrySource?: string | null
}

/** Internal recipe link that remembers the source route for Back. */
export function RecipeLink({
  recipeId,
  className,
  children,
  onClick,
  entrySource = null,
}: RecipeLinkProps) {
  const location = useLocation()
  const from = `${location.pathname}${location.search}`

  return (
    <Link
      to={recipePath(recipeId)}
      state={{ from, entry: entrySource ?? undefined }}
      className={className}
      onClick={() => {
        // Lock Explore scroll before the recipe page forces scroll-to-top.
        if (location.pathname === '/') {
          freezeExploreScroll(window.scrollY)
        }
        onClick?.()
      }}
    >
      {children}
    </Link>
  )
}
