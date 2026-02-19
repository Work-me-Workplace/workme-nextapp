/**
 * Redirect: performance-plans/[id] → performance-reviews/[id]
 */

import { redirect } from 'next/navigation'

export default async function PerformancePlanDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/career/performance-reviews/${id}`)
}
