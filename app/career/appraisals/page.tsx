/**
 * Redirect: appraisals → performance-plans (no appraisal in product; plan = planned, review = did).
 */

import { redirect } from 'next/navigation'

export default function AppraisalsRedirectPage() {
  redirect('/career/performance-reviews')
}
