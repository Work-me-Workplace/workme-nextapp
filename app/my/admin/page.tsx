import { redirect } from 'next/navigation'

export default async function AdminRedirect() {
  redirect('/mywork/products')
}
