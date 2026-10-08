import { useEffect, useState } from 'react'
import { fetchAllRecipesForAdmin } from '../../lib/adminRecipes'
import {
  fetchExploreSettings,
  saveExploreSettings,
} from '../../lib/siteContentApi'
import {
  DEFAULT_EXPLORE_SETTINGS,
  normalizeExploreSettings,
  type ExploreCategoryConfig,
  type ExploreSectionConfig,
  type ExploreSettings,
} from '../../lib/siteDefaults'
import { EXPLORE_CATEGORIES } from '../../data/exploreCategories'
import { useSiteContent } from '../../context/SiteContentContext'
import type { RecipeRow } from '../../lib/recipeMapper'
import {
  suggestExploreBlurbEn,
  suggestExploreCategoryEn,
  suggestExploreSectionEn,
} from '../../i18n/editorialAuto'
import {
  BilingualHint,
  BilingualTextInput,
  LangTabs,
  type ContentLangTab,
} from '../../components/admin/BilingualFields'
import './Admin.css'
import { toUserSaveError } from '../../lib/userErrors'

export function AdminExplorePage() {
  const { refresh: refreshSite } = useSiteContent()
  const [settings, setSettings] = useState<ExploreSettings>({
    ...DEFAULT_EXPLORE_SETTINGS,
  })
  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<ContentLangTab>('no')

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [next, rows] = await Promise.all([
          fetchExploreSettings(),
          fetchAllRecipesForAdmin().catch(() => [] as RecipeRow[]),
        ])
        if (!active) return
        setSettings(normalizeExploreSettings(next))
        setRecipes(rows.filter((r) => r.is_published || true))
      } catch (err) {
        if (active) setMessage(toUserSaveError(err, 'admin'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  function updateSection(index: number, patch: Partial<ExploreSectionConfig>) {
    setSettings((prev) => {
      const sections = prev.sections.map((s, i) =>
        i === index ? { ...s, ...patch } : s,
      )
      return { ...prev, sections }
    })
  }

  function updateCategory(
    index: number,
    patch: Partial<ExploreCategoryConfig>,
  ) {
    setSettings((prev) => {
      const categories = prev.categories.map((c, i) =>
        i === index ? { ...c, ...patch } : c,
      )
      return { ...prev, categories }
    })
  }

  function toggleRecipeId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }

  async function onSave() {
    setSaving(true)
    try {
      await saveExploreSettings(normalizeExploreSettings(settings))
      await refreshSite()
      setMessage('Explore-innstillingene er lagret.')
    } catch (err) {
      setMessage(toUserSaveError(err, 'admin'))
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
          <p className="admin__eyebrow">Explore</p>
          <h1 className="admin__title">Utforsk-innhold</h1>
        </div>
        <button
          type="button"
          className="admin__btn"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? 'Lagrer…' : 'Lagre'}
        </button>
      </header>

      {message && <p className="admin__message">{message}</p>}

      <LangTabs value={lang} onChange={setLang} />
      <BilingualHint>
        {lang === 'no'
          ? 'Norsk er hovedinnhold for blurb, kategori- og seksjonstitler.'
          : 'English: automatic/default first. Custom text marks Manual override. Clear restores automatic.'}
      </BilingualHint>

      <BilingualTextInput
        lang={lang}
        labelNo="Kort tekst under tagline (valgfri)"
        labelEn="Short blurb under tagline (optional)"
        valueNo={settings.blurbNo || settings.blurb}
        valueEn={settings.blurbEn}
        autoEn={
          settings.blurbEnAuto ||
          suggestExploreBlurbEn(settings.blurbNo || settings.blurb)
        }
        isOverride={settings.blurbEnOverride}
        multiline
        rows={2}
        onChangeNo={(value) =>
          setSettings((prev) => ({
            ...prev,
            blurb: value,
            blurbNo: value,
            blurbEnAuto: suggestExploreBlurbEn(value),
          }))
        }
        onChangeEn={(value) =>
          setSettings((prev) => ({
            ...prev,
            blurbEn: value,
            blurbEnOverride: true,
          }))
        }
        onClearOverride={() =>
          setSettings((prev) => ({
            ...prev,
            blurbEn: '',
            blurbEnOverride: false,
            blurbEnAuto: suggestExploreBlurbEn(prev.blurbNo || prev.blurb),
          }))
        }
      />

      <fieldset className="admin-form__block">
        <legend>Utvalgte (featured)</legend>
        <p className="admin__muted">
          Visøverst på Explore hvis minst én er valgt. Kun publiserte vises for
          vanlige brukere.
        </p>
        <div className="admin-check-grid">
          {recipes.map((row) => (
            <label key={row.id} className="admin-form__check">
              <input
                type="checkbox"
                checked={settings.featured_ids.includes(row.id)}
                onChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    featured_ids: toggleRecipeId(prev.featured_ids, row.id),
                  }))
                }
              />
              {row.name}
              {!row.is_published && ' (utkast)'}
            </label>
          ))}
        </div>
      </fieldset>

      <h2 className="admin__subtitle">Kategorikort (horisontal rad)</h2>
      <p className="admin__muted">
        Styr hvilke oppskrifter som vises når brukeren trykker på et
        kategorikort under søk. <strong>Automatisk</strong> bruker eksisterende
        tagger/filtre. <strong>Manuelt</strong> lar deg huk av konkrete
        oppskrifter.
      </p>

      {settings.categories.map((category, index) => {
        const visual = EXPLORE_CATEGORIES.find((c) => c.id === category.id)
        const titleNo = category.titleNo || category.title
        const autoEn =
          category.titleEnAuto ||
          suggestExploreCategoryEn(category.id, titleNo)
        return (
          <fieldset key={category.id} className="admin-form__block">
            <legend>
              {visual?.label ?? titleNo}{' '}
              <span className="admin__muted">({category.id})</span>
            </legend>
            <BilingualTextInput
              lang={lang}
              labelNo="Tittel i kategori-visning (NO)"
              labelEn="Category title (EN)"
              valueNo={titleNo}
              valueEn={category.titleEn}
              autoEn={autoEn}
              isOverride={category.titleEnOverride}
              onChangeNo={(value) =>
                updateCategory(index, {
                  title: value,
                  titleNo: value,
                  titleEnAuto: suggestExploreCategoryEn(category.id, value),
                })
              }
              onChangeEn={(value) =>
                updateCategory(index, {
                  titleEn: value,
                  titleEnOverride: true,
                  titleEnAuto: autoEn,
                })
              }
              onClearOverride={() =>
                updateCategory(index, {
                  titleEn: '',
                  titleEnOverride: false,
                  titleEnAuto: suggestExploreCategoryEn(
                    category.id,
                    titleNo,
                  ),
                })
              }
            />
            <label className="admin-form__field">
              <span>Modus</span>
              <select
                value={category.mode}
                onChange={(e) =>
                  updateCategory(index, {
                    mode: e.target.value === 'manual' ? 'manual' : 'auto',
                  })
                }
              >
                <option value="auto">Automatisk (tagger/filter)</option>
                <option value="manual">Manuelt utvalg</option>
              </select>
            </label>
            {category.mode === 'manual' && (
              <div className="admin-check-grid">
                {recipes.map((row) => (
                  <label key={row.id} className="admin-form__check">
                    <input
                      type="checkbox"
                      checked={category.recipe_ids.includes(row.id)}
                      onChange={() =>
                        updateCategory(index, {
                          recipe_ids: toggleRecipeId(
                            category.recipe_ids,
                            row.id,
                          ),
                        })
                      }
                    />
                    {row.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        )
      })}

      <h2 className="admin__subtitle">Seksjoner i feed</h2>
      {settings.sections.map((section, index) => {
        const titleNo = section.titleNo || section.title
        const autoEn =
          section.titleEnAuto ||
          suggestExploreSectionEn(section.id, titleNo)
        return (
          <fieldset key={section.id} className="admin-form__block">
            <legend>{section.id}</legend>
            <BilingualTextInput
              lang={lang}
              labelNo="Seksjonstittel (NO)"
              labelEn="Section title (EN)"
              valueNo={titleNo}
              valueEn={section.titleEn}
              autoEn={autoEn}
              isOverride={section.titleEnOverride}
              onChangeNo={(value) =>
                updateSection(index, {
                  title: value,
                  titleNo: value,
                  titleEnAuto: suggestExploreSectionEn(section.id, value),
                })
              }
              onChangeEn={(value) =>
                updateSection(index, {
                  titleEn: value,
                  titleEnOverride: true,
                  titleEnAuto: autoEn,
                })
              }
              onClearOverride={() =>
                updateSection(index, {
                  titleEn: '',
                  titleEnOverride: false,
                  titleEnAuto: suggestExploreSectionEn(section.id, titleNo),
                })
              }
            />
            <label className="admin-form__field">
              <span>Modus</span>
              <select
                value={section.mode}
                onChange={(e) =>
                  updateSection(index, {
                    mode: e.target.value === 'manual' ? 'manual' : 'auto',
                  })
                }
              >
                <option value="auto">Automatisk (filter)</option>
                <option value="manual">Manuelt utvalg</option>
              </select>
            </label>
            {section.mode === 'manual' && (
              <div className="admin-check-grid">
                {recipes.map((row) => (
                  <label key={row.id} className="admin-form__check">
                    <input
                      type="checkbox"
                      checked={section.recipe_ids.includes(row.id)}
                      onChange={() =>
                        updateSection(index, {
                          recipe_ids: toggleRecipeId(
                            section.recipe_ids,
                            row.id,
                          ),
                        })
                      }
                    />
                    {row.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        )
      })}
    </div>
  )
}
