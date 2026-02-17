/**
 * Converts a ProductDigitalSign (with nested content) to a DeckSpec for Gamma API.
 * Each sign type (workforce, companyNews, workforceAchievement, companyEvent) is
 * mapped to a short presentation with title + slides.
 */

import type { DeckSpec } from './blob-mapper'

type SignageWithRelations = {
  signType: string
  workforce?: {
    title: string
    summary?: string | null
    bullets: string[]
    footerNote?: string | null
  } | null
  companyNews?: {
    headline: string
    subheadline?: string | null
    body?: string | null
    link?: string | null
  } | null
  workforceAchievement?: {
    headline: string
    subhead?: string | null
    factualStatement?: string | null
    quote?: string | null
    quoteAttribution?: string | null
  } | null
  companyEvent?: {
    eventName: string
    eventDate?: Date | string | null
    startTime?: string | null
    endTime?: string | null
    location?: string | null
    description?: string | null
    perks: string[]
    registrationLink?: string | null
  } | null
}

export function digitalSignageToDeckSpec(signage: SignageWithRelations): DeckSpec {
  const title = getSignageTitle(signage)
  const slides: DeckSpec['slides'] = []

  if (signage.workforceAchievement) {
    slides.push({
      title: signage.workforceAchievement.headline,
      bullets: [
        ...(signage.workforceAchievement.subhead ? [signage.workforceAchievement.subhead] : []),
        ...(signage.workforceAchievement.factualStatement ? [signage.workforceAchievement.factualStatement] : []),
        ...(signage.workforceAchievement.quote && signage.workforceAchievement.quoteAttribution
          ? [`"${signage.workforceAchievement.quote}" — ${signage.workforceAchievement.quoteAttribution}`]
          : signage.workforceAchievement.quote ? [signage.workforceAchievement.quote] : []),
      ].filter(Boolean),
    })
  } else if (signage.workforce) {
    slides.push({
      title: signage.workforce.title,
      bullets: [
        ...(signage.workforce.summary ? [signage.workforce.summary] : []),
        ...signage.workforce.bullets,
        ...(signage.workforce.footerNote ? [signage.workforce.footerNote] : []),
      ].filter(Boolean),
    })
  } else if (signage.companyNews) {
    slides.push({
      title: signage.companyNews.headline,
      bullets: [
        ...(signage.companyNews.subheadline ? [signage.companyNews.subheadline] : []),
        ...(signage.companyNews.body ? [signage.companyNews.body.slice(0, 500)] : []),
        ...(signage.companyNews.link ? [`Link: ${signage.companyNews.link}`] : []),
      ].filter(Boolean),
    })
  } else if (signage.companyEvent) {
    const e = signage.companyEvent
    const dateStr = e.eventDate
      ? new Date(e.eventDate).toLocaleDateString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null
    slides.push({
      title: e.eventName,
      bullets: [
        ...(dateStr ? [dateStr] : []),
        ...(e.startTime && e.endTime ? [`${e.startTime} – ${e.endTime}`] : e.startTime ? [e.startTime] : []),
        ...(e.location ? [e.location] : []),
        ...(e.description ? [e.description.slice(0, 300)] : []),
        ...(e.perks?.length ? ['Highlights: ' + e.perks.join(', ')] : []),
        ...(e.registrationLink ? [`Register: ${e.registrationLink}`] : []),
      ].filter(Boolean),
    })
  }

  if (slides.length === 0) {
    slides.push({ title: title || 'Digital Signage', bullets: ['No content to display.'] })
  }

  return {
    title: title || 'Digital Signage',
    subtitle: `${signage.signType.replace('_', ' ')}`,
    slides,
  }
}

function getSignageTitle(signage: SignageWithRelations): string {
  if (signage.workforceAchievement?.headline) return signage.workforceAchievement.headline
  if (signage.workforce?.title) return signage.workforce.title
  if (signage.companyNews?.headline) return signage.companyNews.headline
  if (signage.companyEvent?.eventName) return signage.companyEvent.eventName
  return 'Digital Signage'
}
