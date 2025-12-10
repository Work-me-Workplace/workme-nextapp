/**
 * DEPRECATED: Create page consolidated into /mywork/products
 * 
 * This page redirects to the unified products page which includes
 * both product listing and creation functionality.
 */

import { redirect } from 'next/navigation'

export default function CreatePage() {
  redirect('/mywork/products')
}

