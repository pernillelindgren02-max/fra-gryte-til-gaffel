/**
 * Branded recipe PDF for share/print — public recipe content only.
 * Generated on demand with jsPDF (not a website screenshot).
 */
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { Recipe } from '../data/recipes'
import { formatIngredient } from '../data/recipes'
import {
  getCampingStoveLabels,
  getDishwashingLevelLabels,
  getPriceLevelLabels,
  getStorageNeedLabels,
  getWaterNeedLabels,
} from '../data/filterLabels'
import { getBrand, sanitizePdfFilename } from '../i18n/brand'
import { translate } from '../i18n/messages'
import type { AppLocale } from '../i18n/types'
import { recipePath } from './recipeLinks'

const MARGIN = 18
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2
const TEAL: [number, number, number] = [37, 89, 87]
const INK: [number, number, number] = [32, 36, 34]
const MUTED: [number, number, number] = [90, 96, 92]
const CREAM: [number, number, number] = [247, 244, 239]
const ACCENT: [number, number, number] = [196, 112, 88]

async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    const absolute = src.startsWith('http')
      ? src
      : `${window.location.origin}${src.startsWith('/') ? '' : '/'}${src}`
    const res = await fetch(absolute, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('read failed'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function wrapText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[]
  for (const line of lines) {
    doc.text(line, x, y)
    y += lineHeight
  }
  return y
}

function ensureSpace(doc: jsPDF, y: number, needed: number, locale: AppLocale): number {
  if (y + needed <= PAGE_H - MARGIN - 12) return y
  doc.addPage()
  drawFooter(doc, locale, false)
  return MARGIN + 14
}

function drawFooter(doc: jsPDF, locale: AppLocale, firstPage: boolean) {
  const brand = getBrand(locale)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  const label = firstPage ? '' : brand.name
  if (label) {
    doc.text(label, MARGIN, PAGE_H - 8)
  }
  const page = doc.getNumberOfPages()
  doc.text(String(page), PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' })
}

export type RecipePdfResult = {
  blob: Blob
  filename: string
  dataUrl: string
}

export async function generateRecipePdf(
  recipe: Recipe,
  opts: {
    locale: AppLocale
    portions: number
    deepLinkUrl: string
  },
): Promise<RecipePdfResult> {
  const { locale, portions, deepLinkUrl } = opts
  const brand = getBrand(locale)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const filename = sanitizePdfFilename(recipe.name || recipe.id, locale)

  // Cream page background
  doc.setFillColor(...CREAM)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  let y = MARGIN

  // Brand header (text — logo optional if asset exists)
  const logoData = brand.logoUrl
    ? await loadImageDataUrl(brand.logoUrl)
    : null
  if (logoData) {
    try {
      // Don't stretch — fixed height, auto width capped
      const logoH = 12
      doc.addImage(logoData, 'PNG', MARGIN, y, 0, logoH)
      y += logoH + 6
    } catch {
      // fall through to text brand
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...TEAL)
      doc.text(brand.name, MARGIN, y + 6)
      y += 14
    }
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...TEAL)
    doc.text(brand.name, MARGIN, y + 6)
    y += 10
    doc.setDrawColor(...ACCENT)
    doc.setLineWidth(0.6)
    doc.line(MARGIN, y, MARGIN + 36, y)
    y += 8
  }

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...INK)
  y = wrapText(doc, recipe.name, MARGIN, y + 4, CONTENT_W, 9)
  y += 4

  // Hero image
  if (recipe.image) {
    const img = await loadImageDataUrl(recipe.image)
    if (img) {
      try {
        const imgH = 58
        y = ensureSpace(doc, y, imgH + 6, locale)
        doc.addImage(img, 'JPEG', MARGIN, y, CONTENT_W, imgH)
        y += imgH + 8
      } catch {
        /* skip broken images */
      }
    }
  }

  // Short description
  if (recipe.shortDescription) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...MUTED)
    y = wrapText(doc, recipe.shortDescription, MARGIN, y, CONTENT_W, 5.5)
    y += 6
  }

  const campingStoveLabels = getCampingStoveLabels(locale)
  const priceLevelLabels = getPriceLevelLabels(locale)
  const storageNeedLabels = getStorageNeedLabels(locale)
  const dishwashingLevelLabels = getDishwashingLevelLabels(locale)
  const waterNeedLabels = getWaterNeedLabels(locale)

  // Key facts
  const facts = [
    `${recipe.timeMinutes} ${translate(locale, 'recipe.min')}`,
    `${portions} ${
      portions === 1
        ? translate(locale, 'recipe.servings').split('|')[0]
        : translate(locale, 'recipe.servings').split('|')[1] ??
          translate(locale, 'recipe.servings')
    }`,
    campingStoveLabels[recipe.campingStoveSuitability],
    priceLevelLabels[recipe.priceLevel],
  ]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEAL)
  y = ensureSpace(doc, y, 10, locale)
  y = wrapText(doc, facts.join('  ·  '), MARGIN, y, CONTENT_W, 5)
  y += 8

  // Ingredients
  y = ensureSpace(doc, y, 16, locale)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...TEAL)
  doc.text(translate(locale, 'recipe.ingredients'), MARGIN, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  const scale = portions / (recipe.servings > 0 ? recipe.servings : 2)
  for (const ing of recipe.ingredients) {
    const scaled = {
      ...ing,
      quantity:
        ing.quantity == null ? null : Math.round(ing.quantity * scale * 1000) / 1000,
    }
    const line = `•  ${formatIngredient(scaled)}`
    y = ensureSpace(doc, y, 6, locale)
    y = wrapText(doc, line, MARGIN, y, CONTENT_W, 5)
    y += 1
  }
  y += 6

  // Steps
  y = ensureSpace(doc, y, 16, locale)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...TEAL)
  doc.text(translate(locale, 'recipe.steps'), MARGIN, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  recipe.steps.forEach((step, index) => {
    const block = `${index + 1}.  ${step}`
    const lines = doc.splitTextToSize(block, CONTENT_W) as string[]
    y = ensureSpace(doc, y, lines.length * 5 + 3, locale)
    y = wrapText(doc, block, MARGIN, y, CONTENT_W, 5)
    y += 3
  })
  y += 4

  // Practical / one-pot info
  y = ensureSpace(doc, y, 28, locale)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...TEAL)
  doc.text(locale === 'en' ? 'Practical' : 'Praktisk', MARGIN, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  const practical = [
    campingStoveLabels[recipe.campingStoveSuitability],
    storageNeedLabels[recipe.storageNeed],
    dishwashingLevelLabels[recipe.dishwashingLevel],
    waterNeedLabels[recipe.waterNeed],
    ...recipe.practicalTags,
  ]
  for (const item of practical) {
    y = ensureSpace(doc, y, 6, locale)
    y = wrapText(doc, `•  ${item}`, MARGIN, y, CONTENT_W, 5)
  }
  y += 10

  // Deep link + QR
  y = ensureSpace(doc, y, 42, locale)
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEAL)
  doc.text(
    locale === 'en' ? 'Open in the app' : 'Åpne i appen',
    MARGIN,
    y,
  )
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  y = wrapText(doc, deepLinkUrl, MARGIN, y, CONTENT_W - 40, 4)
  try {
    const qrDataUrl = await QRCode.toDataURL(deepLinkUrl, {
      margin: 1,
      width: 128,
      color: { dark: '#255957', light: '#f7f4ef' },
    })
    doc.addImage(qrDataUrl, 'PNG', PAGE_W - MARGIN - 28, y - 10, 28, 28)
  } catch {
    /* QR optional */
  }

  // Footers on all pages
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    if (i === 1) {
      doc.setFillColor(...CREAM)
      // footer only
    }
    drawFooter(doc, locale, i === 1)
  }

  const dataUrl = doc.output('datauristring')
  const blob = doc.output('blob')
  return { blob, filename, dataUrl }
}

export function recipeAbsoluteUrl(recipeId: string): string {
  const path = recipePath(recipeId)
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export function canShareFiles(): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof Navigator === 'undefined') {
      return false
    }
    if (!navigator.share || !navigator.canShare) return false
    const probe = new File(['x'], 'probe.pdf', { type: 'application/pdf' })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}
