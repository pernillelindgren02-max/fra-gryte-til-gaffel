/**
 * Canonical consumer recipe URLs.
 * Prefer stable slug ids already used as `recipe.id` (e.g. apple-pie-oats).
 */
export const RECIPE_PATH_PREFIX = '/oppskrift'

export function recipePath(recipeId: string): string {
  const id = recipeId.trim()
  return `${RECIPE_PATH_PREFIX}/${encodeURIComponent(id)}`
}

/** Absolute-style deep link path for later native push (no origin). */
export function recipeDeepLink(recipeId: string): string {
  return recipePath(recipeId)
}

export type NotificationDeepLinkPayload = {
  recipe_id: string | null
  deep_link: string | null
}

/** Payload fields for later push / in-app open — not a delivery mechanism. */
export function buildNotificationDeepLinkPayload(
  recipeId: string | null | undefined,
): NotificationDeepLinkPayload {
  const id = recipeId?.trim() || null
  if (!id) return { recipe_id: null, deep_link: null }
  return { recipe_id: id, deep_link: recipeDeepLink(id) }
}

export function isRecipePath(pathname: string): boolean {
  return pathname.startsWith(`${RECIPE_PATH_PREFIX}/`)
}

export function backLabelForPath(path: string): string {
  if (path.startsWith('/favoritter/')) return '← Tilbake til mappe'
  if (path.startsWith('/favoritter')) return '← Tilbake til favoritter'
  if (path.startsWith('/handleliste')) return '← Tilbake til handleliste'
  if (path.startsWith('/hjemme')) return '← Tilbake til Hjemme'
  if (path.includes('?') || path === '/' || path.startsWith('/?')) {
    return '← Tilbake til Utforsk'
  }
  return '← Tilbake'
}
