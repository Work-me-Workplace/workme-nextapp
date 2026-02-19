/**
 * Assessments (contribution summaries) live on Workforce stuff, not in Career.
 * Redirect so UX is not duplicated.
 */

import { redirect } from 'next/navigation'

export default function AssessmentsRedirectPage() {
  redirect('/mycompany/workforcestuff')
}
