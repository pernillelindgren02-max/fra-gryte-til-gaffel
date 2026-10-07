import type { AppThemeTokens } from './siteDefaults'

const HEX = /^#([0-9a-fA-F]{6})$/

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim())
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const R = toLin(r)
  const G = toLin(g)
  const B = toLin(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const L1 = relativeLuminance(hexToRgb(a))
  const L2 = relativeLuminance(hexToRgb(b))
  const light = Math.max(L1, L2)
  const dark = Math.min(L1, L2)
  return (light + 0.05) / (dark + 0.05)
}

export type ThemeValidation = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

/** Validate hex format + keep text/bg readable (teal on bg ≥ 4.5). */
export function validateTheme(tokens: AppThemeTokens): ThemeValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const keys = Object.keys(tokens) as (keyof AppThemeTokens)[]

  for (const key of keys) {
    const value = tokens[key]
    if (!isHexColor(value)) {
      errors.push(`${key}: ugyldig farge (bruk #RRGGBB).`)
    }
  }

  if (errors.length === 0) {
    const textOnBg = contrastRatio(tokens.teal, tokens.bg)
    if (textOnBg < 4.5) {
      errors.push(
        `Tekst (teal) mot bakgrunn har for lav kontrast (${textOnBg.toFixed(1)}:1). Mål ≥ 4.5:1.`,
      )
    }
    const accentOnBg = contrastRatio(tokens.terracotta, tokens.bg)
    if (accentOnBg < 3) {
      warnings.push(
        `Terracotta mot bakgrunn er lav (${accentOnBg.toFixed(1)}:1).`,
      )
    }
    const tealOnCard = contrastRatio(tokens.teal, tokens.card)
    if (tealOnCard < 4.5) {
      warnings.push(
        `Tekst mot kort-bakgrunn er litt lav (${tealOnCard.toFixed(1)}:1).`,
      )
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}

export function applyThemeToDocument(tokens: AppThemeTokens) {
  const root = document.documentElement
  root.style.setProperty('--color-terracotta', tokens.terracotta)
  root.style.setProperty('--color-teal', tokens.teal)
  root.style.setProperty('--color-olive', tokens.olive)
  root.style.setProperty('--color-warm-orange', tokens.warmOrange)
  root.style.setProperty('--color-soft-yellow', tokens.softYellow)
  root.style.setProperty('--color-pale-green', tokens.paleGreen)
  root.style.setProperty('--color-bg', tokens.bg)
  root.style.setProperty('--color-card', tokens.card)
  root.style.setProperty('--color-logo-blob', tokens.logoBlob)
}
