import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { recipePath } from '../lib/recipeLinks'

type RecipeLinkProps = {
  recipeId: string
  className?: string
  children: ReactNode
  onClick?: () => void
}

/** Internal recipe link that remembers the source route for Back. */
export function RecipeLink({
  recipeId,
  className,
  children,
  onClick,
}: RecipeLinkProps) {
  const location = useLocation()
  const from = `${location.pathname}${location.search}`

  return (
    <Link
      to={recipePath(recipeId)}
      state={{ from }}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
