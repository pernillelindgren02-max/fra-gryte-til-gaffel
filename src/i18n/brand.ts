import type { AppLocale } from './types'

export type BrandIdentity = {
  name: string
  /** Optional logo URL under /images — missing → text brand only. */
  logoUrl: string | null
  filenamePrefix: string
  siteOriginLabel: string
}

/** Language-specific public brand. No invented logo assets. */
export function getBrand(locale: AppLocale): BrandIdentity {
  if (locale === 'en') {
    return {
      name: 'One Pot Wonder',
      logoUrl: '/images/brand/one-pot-wonder.svg',
      filenamePrefix: 'one-pot-wonder',
      siteOriginLabel: 'onepotwonder.app',
    }
  }
  return {
    name: 'Fra gryte til gaffel',
    logoUrl: '/images/brand/fra-gryte-til-gaffel.svg',
    filenamePrefix: 'fra-gryte-til-gaffel',
    siteOriginLabel: 'fragyrtetilgaffel.no',
  }
}

export function sanitizePdfFilename(title: string, locale: AppLocale): string {
  const brand = getBrand(locale).filenamePrefix
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${brand}-${slug || 'recipe'}.pdf`
}
