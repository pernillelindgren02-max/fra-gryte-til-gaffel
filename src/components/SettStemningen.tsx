import { useState } from 'react'
import type { Recipe } from '../data/recipes'
import { trackEvent } from '../lib/analytics'
import { hasSpotifyMood, isValidSpotifyUrl } from '../lib/spotifyLink'
import './SettStemningen.css'

type SettStemningenProps = {
  recipe: Recipe
}

export function SettStemningen({ recipe }: SettStemningenProps) {
  const [codeFailed, setCodeFailed] = useState(false)

  if (!hasSpotifyMood(recipe)) return null

  const title = recipe.spotifyTitle?.trim() || null
  const artist = recipe.spotifyArtist?.trim() || null
  const url = recipe.spotifyUrl?.trim() || null
  const showButton = isValidSpotifyUrl(url)
  const codeSrc =
    !codeFailed && recipe.spotifyCodeImage?.trim()
      ? recipe.spotifyCodeImage.trim()
      : null

  if (!title && !artist && !showButton && !codeSrc) return null

  return (
    <section className="sett-stemning" aria-label="Sett stemningen">
      <div className="sett-stemning__inner">
        <div className="sett-stemning__copy">
          <p className="sett-stemning__eyebrow">
            <span className="sett-stemning__note" aria-hidden="true">
              ♪
            </span>
            Sett stemningen
          </p>
          {title ? <p className="sett-stemning__title">{title}</p> : null}
          {artist ? <p className="sett-stemning__artist">{artist}</p> : null}
          {showButton ? (
            <a
              className="sett-stemning__open"
              href={url!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent('recipe_spotify_open', {
                  recipeId: recipe.id,
                  source: 'recipe',
                })
              }
            >
              Åpne i Spotify
            </a>
          ) : null}
        </div>
        {codeSrc ? (
          <div className="sett-stemning__code">
            <img
              src={codeSrc}
              alt=""
              loading="lazy"
              onError={() => setCodeFailed(true)}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
