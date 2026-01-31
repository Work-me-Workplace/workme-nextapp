/**
 * Blob Mapper for Gamma API
 * Converts DeckSpec to Gamma-friendly human-readable structured narrative.
 * Gamma requires a human-readable structured narrative, not JSON or markdown.
 */

export interface DeckSpec {
  title: string
  subtitle?: string
  brand?: {
    primaryColor?: string
    accentColor?: string
    font?: string
  }
  slides: {
    title: string
    bullets?: string[]
    imageUrl?: string
    notes?: string
  }[]
}

/**
 * Builds a Gamma-friendly human-readable structured narrative from a DeckSpec
 */
export function buildGammaBlob(deck: DeckSpec): string {
  const lines: string[] = []

  lines.push(`Presentation Title: ${deck.title}`)
  if (deck.subtitle) {
    lines.push(`Subtitle: ${deck.subtitle}`)
  }

  if (deck.brand) {
    lines.push('')
    if (deck.brand.primaryColor) lines.push(`Primary Color: ${deck.brand.primaryColor}`)
    if (deck.brand.accentColor) lines.push(`Accent Color: ${deck.brand.accentColor}`)
    if (deck.brand.font) lines.push(`Font: ${deck.brand.font}`)
  }

  deck.slides.forEach((slide, index) => {
    lines.push('')
    lines.push(`Slide ${index + 1}: ${slide.title}`)
    if (slide.bullets?.length) {
      slide.bullets.forEach((b) => lines.push(`- ${b}`))
    }
    if (slide.imageUrl) lines.push(`Image: ${slide.imageUrl}`)
    if (slide.notes) lines.push(`Notes: ${slide.notes}`)
  })

  return lines.join('\n')
}
