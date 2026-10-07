/** True when the URL can open Spotify (https track/album/playlist or spotify: URI). */
export function isValidSpotifyUrl(url: string | null | undefined): boolean {
  const raw = url?.trim()
  if (!raw) return false
  try {
    if (raw.startsWith('spotify:')) {
      return raw.length > 'spotify:'.length
    }
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    const host = parsed.hostname.replace(/^www\./, '')
    return (
      host === 'open.spotify.com' ||
      host === 'spotify.link' ||
      host.endsWith('.spotify.com')
    )
  } catch {
    return false
  }
}

export function hasSpotifyMood(recipe: {
  spotifyTitle?: string | null
  spotifyArtist?: string | null
  spotifyUrl?: string | null
  spotifyCodeImage?: string | null
}): boolean {
  return Boolean(
    recipe.spotifyTitle?.trim() ||
      recipe.spotifyArtist?.trim() ||
      isValidSpotifyUrl(recipe.spotifyUrl) ||
      recipe.spotifyCodeImage?.trim(),
  )
}
