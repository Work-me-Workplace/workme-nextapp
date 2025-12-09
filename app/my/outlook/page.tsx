import { redirect } from 'next/navigation'

export default async function MyOutlookRedirect() {
  redirect('/workops/daily')
}
