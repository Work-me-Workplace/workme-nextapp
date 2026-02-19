/**
 * Redirect: performance-plans → performance-reviews (nomenclature: Performance reviews, fork Plan | Review).
 */

import { redirect } from 'next/navigation'

export default function PerformancePlansRedirectPage() {
  redirect('/career/performance-reviews')
}
