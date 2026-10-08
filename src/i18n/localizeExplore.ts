import { pickEditorial } from './fallback'
import type { AppLocale } from './types'
import type {
  ExploreCategoryConfig,
  ExploreSectionConfig,
  ExploreSettings,
} from '../lib/siteDefaults'

export function resolveExploreTitle(
  titleNo: string,
  titleEn: string,
  titleEnAuto: string,
  titleEnOverride: boolean,
  locale: AppLocale,
): string {
  return pickEditorial(
    titleNo,
    titleEn,
    titleEnAuto,
    titleEnOverride,
    locale,
  )
}

export function localizeExploreCategory(
  category: ExploreCategoryConfig,
  locale: AppLocale,
): ExploreCategoryConfig {
  const title = resolveExploreTitle(
    category.titleNo || category.title,
    category.titleEn,
    category.titleEnAuto,
    category.titleEnOverride,
    locale,
  )
  return { ...category, title }
}

export function localizeExploreSection(
  section: ExploreSectionConfig,
  locale: AppLocale,
): ExploreSectionConfig {
  const title = resolveExploreTitle(
    section.titleNo || section.title,
    section.titleEn,
    section.titleEnAuto,
    section.titleEnOverride,
    locale,
  )
  return { ...section, title }
}

export function localizeExploreSettings(
  settings: ExploreSettings,
  locale: AppLocale,
): ExploreSettings {
  const blurb = pickEditorial(
    settings.blurbNo || settings.blurb,
    settings.blurbEn,
    settings.blurbEnAuto,
    settings.blurbEnOverride,
    locale,
  )
  return {
    ...settings,
    blurb,
    sections: settings.sections.map((s) =>
      localizeExploreSection(s, locale),
    ),
    categories: settings.categories.map((c) =>
      localizeExploreCategory(c, locale),
    ),
  }
}
