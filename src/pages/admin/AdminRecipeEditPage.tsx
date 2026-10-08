import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  emptyDraftRecipe,
  fetchAdminRecipe,
  removeRecipeImage,
  slugifyId,
  supabasePublicUrl,
  uploadRecipeImage,
  uploadSpotifyCodeImage,
  upsertRecipeRow,
} from '../../lib/adminRecipes'
import { mapRecipeToRow, mapRowToRecipe } from '../../lib/recipeMapper'
import {
  type CampingStoveSuitability,
  type DishwashingLevel,
  type Ingredient,
  type IngredientUnit,
  type MealType,
  type PreparationLevel,
  type PriceLevel,
  type Recipe,
  type StorageNeed,
  type WaterNeed,
} from '../../data/recipes'
import { useRecipes } from '../../context/RecipesContext'
import { recipeImageUrl } from '../../data/recipes'
import {
  suggestEnglishDescription,
  suggestEnglishIngredient,
  suggestEnglishTitle,
} from '../../i18n/autoEnglish'
import './Admin.css'
import { toUserSaveError } from '../../lib/userErrors'

type ContentLangTab = 'no' | 'en'

function EnSourceBadge({ isOverride }: { isOverride: boolean }) {
  return (
    <span
      className={
        isOverride
          ? 'admin-en-badge admin-en-badge--override'
          : 'admin-en-badge admin-en-badge--auto'
      }
    >
      {isOverride ? 'Manual override' : 'Automatic / default'}
    </span>
  )
}

const UNITS: IngredientUnit[] = [
  'g',
  'kg',
  'ml',
  'dl',
  'l',
  'stk',
  'ss',
  'ts',
  null,
]

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function AdminRecipeEditPage() {
  const { id: routeId } = useParams<{ id: string }>()
  const isNew = !routeId || routeId === 'new'
  const navigate = useNavigate()
  const { refresh: refreshPublished } = useRecipes()
  const [draft, setDraft] = useState<Recipe>(emptyDraftRecipe())
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [spotifyCodePath, setSpotifyCodePath] = useState<string | null>(null)
  const [published, setPublishedFlag] = useState(false)
  const [notifyOnPublish, setNotifyOnPublish] = useState(false)
  const [tagsText, setTagsText] = useState('')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [idLocked, setIdLocked] = useState(!isNew)
  const [contentLang, setContentLang] = useState<ContentLangTab>('no')

  useEffect(() => {
    if (isNew) return
    let active = true
    void (async () => {
      try {
        const row = await fetchAdminRecipe(routeId!)
        if (!active) return
        if (!row) {
          setMessage('Fant ikke oppskriften.')
          setLoading(false)
          return
        }
        const recipe = mapRowToRecipe(row, supabasePublicUrl())
        setDraft(recipe)
        setImagePath(row.image_path)
        setSpotifyCodePath(row.spotify_code_image ?? null)
        setPublishedFlag(row.is_published)
        setNotifyOnPublish(Boolean(row.notify_on_publish))
        setTagsText(recipe.practicalTags.join(', '))
        setIdLocked(true)
      } catch (err) {
        if (active) {
          setMessage(toUserSaveError(err, "admin"))
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [isNew, routeId])

  function updateField<K extends keyof Recipe>(key: K, value: Recipe[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function updateIngredient(index: number, next: Ingredient) {
    setDraft((prev) => {
      const ingredients = [...prev.ingredients]
      ingredients[index] = next
      return { ...prev, ingredients }
    })
  }

  async function onUpload(file: File | null) {
    if (!file) return
    const id = draft.id.trim() || slugifyId(draft.name)
    if (!id) {
      setMessage('Gi oppskriften et id/navn før bildeopplasting.')
      return
    }
    setSaving(true)
    try {
      const path = await uploadRecipeImage(id, file)
      setImagePath(path)
      setDraft((prev) => ({
        ...prev,
        id: prev.id || id,
        image: recipeImageUrl(path, supabasePublicUrl()),
      }))
      setMessage('Bilde lastet opp.')
    } catch (err) {
      setMessage(toUserSaveError(err, "admin"))
    } finally {
      setSaving(false)
    }
  }

  async function onClearImage() {
    if (
      !window.confirm(
        'Fjerne bildet? Filen slettes fra Storage hvis den finnes.',
      )
    ) {
      return
    }
    setSaving(true)
    try {
      if (imagePath) await removeRecipeImage(imagePath)
      setImagePath(null)
      setDraft((prev) => ({
        ...prev,
        image: '/images/recipes/placeholder-dish.jpg',
      }))
    } catch (err) {
      setMessage(toUserSaveError(err, "admin"))
    } finally {
      setSaving(false)
    }
  }

  async function onUploadSpotifyCode(file: File | null) {
    if (!file) return
    const id = draft.id.trim() || slugifyId(draft.name)
    if (!id) {
      setMessage('Gi oppskriften et id/navn før bildeopplasting.')
      return
    }
    setSaving(true)
    try {
      const path = await uploadSpotifyCodeImage(id, file)
      setSpotifyCodePath(path)
      setDraft((prev) => ({
        ...prev,
        spotifyCodeImage: recipeImageUrl(path, supabasePublicUrl()),
      }))
      setMessage('Spotify-kode lastet opp.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function onClearSpotifyCode() {
    setSaving(true)
    try {
      if (spotifyCodePath) await removeRecipeImage(spotifyCodePath)
      setSpotifyCodePath(null)
      setDraft((prev) => ({ ...prev, spotifyCodeImage: null }))
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
    } finally {
      setSaving(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const id = (draft.id.trim() || slugifyId(draft.name)).trim()
    if (!id || !draft.name.trim()) {
      setMessage('Id og navn er påkrevd.')
      return
    }
    if (
      published &&
      !window.confirm(
        'Lagre som publisert? Oppskriften blir synlig for vanlige brukere.',
      )
    ) {
      return
    }
    const practicalTags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const nameNo = (draft.nameNo || draft.name).trim()
    const shortNo = (
      draft.shortDescriptionNo || draft.shortDescription
    ).trim()
    const nameEnAuto =
      draft.nameEnAuto?.trim() || suggestEnglishTitle(id, nameNo)
    const shortEnAuto =
      draft.shortDescriptionEnAuto?.trim() ||
      suggestEnglishDescription(id, shortNo)
    const nameEnOverride =
      Boolean(draft.nameEnOverride) && Boolean((draft.nameEn || '').trim())
    const shortEnOverride =
      Boolean(draft.shortDescriptionEnOverride) &&
      Boolean((draft.shortDescriptionEn || '').trim())
    const stepsNo =
      draft.stepsNo?.length > 0
        ? draft.stepsNo.map((s) => s.trim()).filter(Boolean)
        : draft.steps.map((s) => s.trim()).filter(Boolean)
    const recipe: Recipe = {
      ...draft,
      id,
      name: nameNo,
      nameNo,
      nameEn: nameEnOverride ? (draft.nameEn || '').trim() : '',
      nameEnAuto,
      nameEnOverride,
      shortDescription: shortNo,
      shortDescriptionNo: shortNo,
      shortDescriptionEn: shortEnOverride
        ? (draft.shortDescriptionEn || '').trim()
        : '',
      shortDescriptionEnAuto: shortEnAuto,
      shortDescriptionEnOverride: shortEnOverride,
      servings: draft.servings > 0 ? draft.servings : 2,
      ingredients: draft.ingredients
        .filter((i) => (i.nameNo || i.name).trim())
        .map((i) => {
          const n = (i.nameNo || i.name).trim()
          const ingId = (i.id || n).trim()
          const nameEnAutoIng =
            i.nameEnAuto?.trim() || suggestEnglishIngredient(ingId, n)
          const nameEnOverrideIng =
            Boolean(i.nameEnOverride) && Boolean((i.nameEn || '').trim())
          return {
            ...i,
            id: ingId,
            nameNo: n,
            nameEn: nameEnOverrideIng ? (i.nameEn || '').trim() : '',
            nameEnAuto: nameEnAutoIng,
            nameEnOverride: nameEnOverrideIng,
            name: n,
          }
        }),
      steps: stepsNo,
      stepsNo,
      stepsEn: (draft.stepsEn || []).map((s) => s.trim()).filter(Boolean),
      practicalTags,
      spotifyTitle: draft.spotifyTitle?.trim() || null,
      spotifyArtist: draft.spotifyArtist?.trim() || null,
      spotifyUrl: draft.spotifyUrl?.trim() || null,
      spotifyCodeImage: spotifyCodePath
        ? recipeImageUrl(spotifyCodePath, supabasePublicUrl())
        : draft.spotifyCodeImage?.trim() || null,
    }
    setSaving(true)
    try {
      const row = mapRecipeToRow(recipe, {
        image_path: imagePath,
        is_published: published,
        notify_on_publish: notifyOnPublish,
      })
      // Prefer stored storage path for code image when available.
      if (spotifyCodePath) {
        row.spotify_code_image = spotifyCodePath
      }
      await upsertRecipeRow(row)
      await refreshPublished()
      setMessage('Lagret.')
      if (isNew) navigate(`/admin/oppskrifter/${id}`, { replace: true })
      if (published && notifyOnPublish) {
        // Never auto-send — open composer so admin can edit + confirm Send.
        navigate(`/admin/varsler?recipe=${encodeURIComponent(id)}`)
      }
    } catch (err) {
      setMessage(toUserSaveError(err, "admin"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__muted">Laster…</p>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <Link to="/admin/oppskrifter" className="admin__link">
            ← Alle oppskrifter
          </Link>
          <h1 className="admin__title">
            {isNew ? 'Ny oppskrift' : 'Rediger oppskrift'}
          </h1>
        </div>
        {!isNew && (
          <Link
            to={`/admin/oppskrifter/${routeId}/forhandsvis`}
            className="admin__btn admin__btn--ghost"
          >
            Forhåndsvis
          </Link>
        )}
      </header>

      {message && <p className="admin__message">{message}</p>}

      <form className="admin-form" onSubmit={onSubmit}>
        <label className="admin-form__field">
          <span>Id (slug)</span>
          <input
            value={draft.id}
            disabled={idLocked}
            onChange={(e) => updateField('id', e.target.value)}
            placeholder="pokebowl-laks"
            required={isNew}
          />
        </label>

        <fieldset className="admin-form__block">
          <legend>Språk / Language</legend>
          <div className="admin-filter-tabs" role="tablist" aria-label="Language">
            <button
              type="button"
              role="tab"
              aria-selected={contentLang === 'no'}
              className={
                contentLang === 'no'
                  ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
                  : 'admin-filter-tabs__btn'
              }
              onClick={() => setContentLang('no')}
            >
              Norsk
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={contentLang === 'en'}
              className={
                contentLang === 'en'
                  ? 'admin-filter-tabs__btn admin-filter-tabs__btn--active'
                  : 'admin-filter-tabs__btn'
              }
              onClick={() => setContentLang('en')}
            >
              English
            </button>
          </div>
          <p className="admin__muted">
            {contentLang === 'no'
              ? 'Norsk er hovedinnhold og lagres alltid.'
              : 'English: automatic/default first. Saving a custom value marks Manual override. Clear restores automatic English.'}
          </p>

          {contentLang === 'no' ? (
            <>
              <label className="admin-form__field">
                <span>Navn (NO)</span>
                <input
                  value={draft.nameNo || draft.name}
                  onChange={(e) => {
                    const name = e.target.value
                    const auto = suggestEnglishTitle(
                      draft.id || slugifyId(name),
                      name,
                    )
                    setDraft((prev) => ({
                      ...prev,
                      name,
                      nameNo: name,
                      nameEnAuto: auto,
                      id:
                        isNew && !idLocked
                          ? slugifyId(name)
                          : prev.id,
                    }))
                  }}
                  required
                />
              </label>
              <label className="admin-form__field">
                <span>Kort beskrivelse (NO)</span>
                <textarea
                  rows={3}
                  value={draft.shortDescriptionNo || draft.shortDescription}
                  onChange={(e) => {
                    const text = e.target.value
                    const auto = suggestEnglishDescription(
                      draft.id,
                      text,
                    )
                    setDraft((prev) => ({
                      ...prev,
                      shortDescription: text,
                      shortDescriptionNo: text,
                      shortDescriptionEnAuto: auto,
                    }))
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <label className="admin-form__field">
                <span className="admin-form__label-row">
                  Title (EN)
                  <EnSourceBadge isOverride={draft.nameEnOverride} />
                </span>
                <input
                  value={
                    draft.nameEnOverride
                      ? draft.nameEn || ''
                      : draft.nameEnAuto ||
                        suggestEnglishTitle(
                          draft.id,
                          draft.nameNo || draft.name,
                        )
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    setDraft((prev) => ({
                      ...prev,
                      nameEn: value,
                      nameEnOverride: true,
                      nameEnAuto:
                        prev.nameEnAuto ||
                        suggestEnglishTitle(
                          prev.id,
                          prev.nameNo || prev.name,
                        ),
                    }))
                  }}
                  placeholder={
                    draft.nameEnAuto ||
                    suggestEnglishTitle(
                      draft.id,
                      draft.nameNo || draft.name,
                    ) ||
                    'Automatic English title'
                  }
                />
                {draft.nameEnOverride && (
                  <button
                    type="button"
                    className="admin__btn admin__btn--ghost admin-form__clear-en"
                    onClick={() => {
                      const auto =
                        draft.nameEnAuto ||
                        suggestEnglishTitle(
                          draft.id,
                          draft.nameNo || draft.name,
                        )
                      setDraft((prev) => ({
                        ...prev,
                        nameEn: '',
                        nameEnOverride: false,
                        nameEnAuto: auto,
                      }))
                    }}
                  >
                    Clear override — restore automatic
                  </button>
                )}
              </label>
              <label className="admin-form__field">
                <span className="admin-form__label-row">
                  Short description (EN)
                  <EnSourceBadge
                    isOverride={draft.shortDescriptionEnOverride}
                  />
                </span>
                <textarea
                  rows={3}
                  value={
                    draft.shortDescriptionEnOverride
                      ? draft.shortDescriptionEn || ''
                      : draft.shortDescriptionEnAuto ||
                        suggestEnglishDescription(
                          draft.id,
                          draft.shortDescriptionNo ||
                            draft.shortDescription,
                        )
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    setDraft((prev) => ({
                      ...prev,
                      shortDescriptionEn: value,
                      shortDescriptionEnOverride: true,
                      shortDescriptionEnAuto:
                        prev.shortDescriptionEnAuto ||
                        suggestEnglishDescription(
                          prev.id,
                          prev.shortDescriptionNo ||
                            prev.shortDescription,
                        ),
                    }))
                  }}
                  placeholder={
                    draft.shortDescriptionEnAuto ||
                    'Automatic English when available — otherwise Norwegian fallback'
                  }
                />
                {draft.shortDescriptionEnOverride && (
                  <button
                    type="button"
                    className="admin__btn admin__btn--ghost admin-form__clear-en"
                    onClick={() => {
                      const auto =
                        draft.shortDescriptionEnAuto ||
                        suggestEnglishDescription(
                          draft.id,
                          draft.shortDescriptionNo ||
                            draft.shortDescription,
                        )
                      setDraft((prev) => ({
                        ...prev,
                        shortDescriptionEn: '',
                        shortDescriptionEnOverride: false,
                        shortDescriptionEnAuto: auto,
                      }))
                    }}
                  >
                    Clear override — restore automatic
                  </button>
                )}
              </label>
            </>
          )}
        </fieldset>

        <div className="admin-form__grid">
          <label className="admin-form__field">
            <span>Tid (min)</span>
            <input
              type="number"
              min={1}
              value={draft.timeMinutes}
              onChange={(e) =>
                updateField('timeMinutes', Number(e.target.value) || 1)
              }
            />
          </label>
          <label className="admin-form__field">
            <span>Porsjoner</span>
            <input
              type="number"
              min={1}
              value={draft.servings}
              onChange={(e) =>
                updateField('servings', Number(e.target.value) || 1)
              }
            />
          </label>
          <label className="admin-form__field">
            <span>Måltid</span>
            <select
              value={draft.mealType}
              onChange={(e) =>
                updateField('mealType', e.target.value as MealType)
              }
            >
              <option value="breakfast">Frokost</option>
              <option value="lunch">Lunsj</option>
              <option value="dinner">Middag</option>
            </select>
          </label>
          <label className="admin-form__field">
            <span>Forberedelse</span>
            <select
              value={draft.preparationLevel}
              onChange={(e) =>
                updateField(
                  'preparationLevel',
                  e.target.value as PreparationLevel,
                )
              }
            >
              <option value="noCutting">Uten kutting</option>
              <option value="someCutting">Litt kutting</option>
              <option value="morePrep">Mer prep</option>
            </select>
          </label>
          <label className="admin-form__field">
            <span>Oppbevaring</span>
            <select
              value={draft.storageNeed}
              onChange={(e) =>
                updateField('storageNeed', e.target.value as StorageNeed)
              }
            >
              <option value="noCooling">Uten kjøling</option>
              <option value="fewHoursOk">Noen timer OK</option>
              <option value="needsCooling">Trenger kjøling</option>
            </select>
          </label>
          <label className="admin-form__field">
            <span>Pris</span>
            <select
              value={draft.priceLevel}
              onChange={(e) =>
                updateField('priceLevel', e.target.value as PriceLevel)
              }
            >
              <option value="cheap">Billig</option>
              <option value="medium">Middels</option>
              <option value="luxury">Litt ekstra</option>
            </select>
          </label>
          <label className="admin-form__field">
            <span>Oppvask</span>
            <select
              value={draft.dishwashingLevel}
              onChange={(e) =>
                updateField(
                  'dishwashingLevel',
                  e.target.value as DishwashingLevel,
                )
              }
            >
              <option value="almostNothing">Nesten ingen</option>
              <option value="little">Litt</option>
              <option value="extra">Ekstra</option>
            </select>
          </label>
          <label className="admin-form__field">
            <span>Primus / kokeplate</span>
            <select
              value={draft.campingStoveSuitability}
              onChange={(e) =>
                updateField(
                  'campingStoveSuitability',
                  e.target.value as CampingStoveSuitability,
                )
              }
            >
              <option value="perfect">Perfekt</option>
              <option value="adaptable">Tilpassbar</option>
              <option value="indoorBest">Best inne</option>
            </select>
          </label>
          <label className="admin-form__field">
            <span>Vann</span>
            <select
              value={draft.waterNeed}
              onChange={(e) =>
                updateField('waterNeed', e.target.value as WaterNeed)
              }
            >
              <option value="almostNone">Nesten ingen</option>
              <option value="some">Litt</option>
              <option value="lots">Mye</option>
            </select>
          </label>
        </div>

        <fieldset className="admin-form__block">
          <legend>Bilde</legend>
          <img className="admin-form__preview" src={draft.image} alt="" />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() => void onClearImage()}
            disabled={saving || !imagePath}
          >
            Fjern bilde
          </button>
        </fieldset>

        <fieldset className="admin-form__block">
          <legend>Sett stemningen (Spotify)</legend>
          <p className="admin__muted">
            Valgfritt. Vises på oppskriftssiden hvis minst ett felt er fylt.
            Bruk en åpen Spotify-lenke (open.spotify.com) eller spotify:-URI.
          </p>
          <label className="admin-form__field">
            <span>Sang-tittel</span>
            <input
              value={draft.spotifyTitle ?? ''}
              onChange={(e) => updateField('spotifyTitle', e.target.value)}
              placeholder="F.eks. Sunday Morning"
            />
          </label>
          <label className="admin-form__field">
            <span>Artist</span>
            <input
              value={draft.spotifyArtist ?? ''}
              onChange={(e) => updateField('spotifyArtist', e.target.value)}
              placeholder="F.eks. Maroon 5"
            />
          </label>
          <label className="admin-form__field">
            <span>Spotify-lenke (track URL)</span>
            <input
              type="url"
              value={draft.spotifyUrl ?? ''}
              onChange={(e) => updateField('spotifyUrl', e.target.value)}
              placeholder="https://open.spotify.com/track/…"
            />
          </label>
          <label className="admin-form__field">
            <span>Spotify Code-bilde (valgfritt)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                void onUploadSpotifyCode(e.target.files?.[0] ?? null)
              }
            />
          </label>
          {draft.spotifyCodeImage ? (
            <div className="admin-form__spotify-code">
              <img src={draft.spotifyCodeImage} alt="" />
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                onClick={() => void onClearSpotifyCode()}
                disabled={saving}
              >
                Fjern Spotify-kode
              </button>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="admin-form__block">
          <legend>Ingredienser</legend>
          {draft.ingredients.map((ingredient, index) => (
            <div key={index} className="admin-form__ingredient">
              <div className="admin-form__reorder">
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  aria-label="Flytt opp"
                  disabled={index === 0}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      ingredients: moveItem(prev.ingredients, index, index - 1),
                    }))
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  aria-label="Flytt ned"
                  disabled={index === draft.ingredients.length - 1}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      ingredients: moveItem(prev.ingredients, index, index + 1),
                    }))
                  }
                >
                  ↓
                </button>
              </div>
              <input
                placeholder="Navn (NO)"
                value={ingredient.nameNo || ingredient.name}
                onChange={(e) => {
                  const nameNo = e.target.value
                  const id = ingredient.id || nameNo
                  updateIngredient(index, {
                    ...ingredient,
                    nameNo,
                    name: nameNo,
                    id,
                    nameEnAuto: suggestEnglishIngredient(id, nameNo),
                  })
                }}
              />
              <div className="admin-form__en-ing">
                <input
                  placeholder={
                    ingredient.nameEnAuto ||
                    suggestEnglishIngredient(
                      ingredient.id,
                      ingredient.nameNo || ingredient.name,
                    ) ||
                    'Name (EN auto)'
                  }
                  value={
                    ingredient.nameEnOverride
                      ? ingredient.nameEn || ''
                      : ingredient.nameEnAuto ||
                        suggestEnglishIngredient(
                          ingredient.id,
                          ingredient.nameNo || ingredient.name,
                        )
                  }
                  onChange={(e) =>
                    updateIngredient(index, {
                      ...ingredient,
                      nameEn: e.target.value,
                      nameEnOverride: true,
                      nameEnAuto:
                        ingredient.nameEnAuto ||
                        suggestEnglishIngredient(
                          ingredient.id,
                          ingredient.nameNo || ingredient.name,
                        ),
                    })
                  }
                  title={
                    ingredient.nameEnOverride
                      ? 'Manual override'
                      : 'Automatic / default'
                  }
                />
                {ingredient.nameEnOverride ? (
                  <button
                    type="button"
                    className="admin__btn admin__btn--ghost"
                    title="Restore automatic English"
                    onClick={() =>
                      updateIngredient(index, {
                        ...ingredient,
                        nameEn: '',
                        nameEnOverride: false,
                        nameEnAuto:
                          ingredient.nameEnAuto ||
                          suggestEnglishIngredient(
                            ingredient.id,
                            ingredient.nameNo || ingredient.name,
                          ),
                      })
                    }
                  >
                    ↺
                  </button>
                ) : (
                  <span className="admin-en-badge admin-en-badge--auto admin-en-badge--tiny">
                    Auto
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                placeholder="Mengde"
                value={ingredient.quantity ?? ''}
                onChange={(e) =>
                  updateIngredient(index, {
                    ...ingredient,
                    quantity:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
              <select
                value={ingredient.unit ?? ''}
                onChange={(e) =>
                  updateIngredient(index, {
                    ...ingredient,
                    unit: (e.target.value || null) as IngredientUnit,
                  })
                }
              >
                {UNITS.map((unit) => (
                  <option key={String(unit)} value={unit ?? ''}>
                    {unit ?? '—'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    ingredients: prev.ingredients.filter((_, i) => i !== index),
                  }))
                }
              >
                Fjern
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                ingredients: [
                  ...prev.ingredients,
                  {
                    id: `ing-${Date.now()}`,
                    nameNo: '',
                    nameEn: '',
                    nameEnAuto: '',
                    nameEnOverride: false,
                    name: '',
                    quantity: null,
                    unit: null,
                  },
                ],
              }))
            }
          >
            + Ingrediens
          </button>
        </fieldset>

        <fieldset className="admin-form__block">
          <legend>Steg</legend>
          {draft.steps.map((step, index) => (
            <div key={index} className="admin-form__step">
              <div className="admin-form__reorder">
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  aria-label="Flytt opp"
                  disabled={index === 0}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      steps: moveItem(prev.steps, index, index - 1),
                    }))
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin__btn admin__btn--ghost"
                  aria-label="Flytt ned"
                  disabled={index === draft.steps.length - 1}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      steps: moveItem(prev.steps, index, index + 1),
                    }))
                  }
                >
                  ↓
                </button>
              </div>
              <textarea
                rows={2}
                value={step}
                onChange={(e) => {
                  const steps = [...draft.steps]
                  steps[index] = e.target.value
                  updateField('steps', steps)
                }}
              />
              <button
                type="button"
                className="admin__btn admin__btn--ghost"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    steps: prev.steps.filter((_, i) => i !== index),
                  }))
                }
              >
                Fjern
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin__btn admin__btn--ghost"
            onClick={() =>
              setDraft((prev) => ({ ...prev, steps: [...prev.steps, ''] }))
            }
          >
            + Steg
          </button>
        </fieldset>

        <label className="admin-form__field">
          <span>Praktiske tagger (kommaseparert)</span>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="2 porsjoner, En panne"
          />
        </label>

        <label className="admin-form__check">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublishedFlag(e.target.checked)}
          />
          Publisert (synlig i appen for alle)
        </label>

        <label className="admin-form__check">
          <input
            type="checkbox"
            checked={notifyOnPublish}
            onChange={(e) => setNotifyOnPublish(e.target.checked)}
          />
          Varsle brukere om denne oppskriften (åpner Varsler-komponisten etter
          lagring — sender ikke automatisk)
        </label>

        <div className="admin-form__footer">
          <button type="submit" className="admin__btn" disabled={saving}>
            {saving ? 'Lagrer…' : 'Lagre'}
          </button>
          {!isNew && (
            <Link
              to={`/admin/oppskrifter/${routeId}/forhandsvis`}
              className="admin__btn admin__btn--ghost"
            >
              Forhåndsvis før publisering
            </Link>
          )}
        </div>
      </form>
    </div>
  )
}
