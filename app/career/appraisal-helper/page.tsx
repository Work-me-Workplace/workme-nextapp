/**
 * Deprecated: no appraisal. Redirect to Performance reviews (Plan | Review).
 */

import { redirect } from 'next/navigation'

export default function AppraisalHelperRedirectPage() {
  redirect('/career/performance-reviews')
}
