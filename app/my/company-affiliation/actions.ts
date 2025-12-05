'use server'

export async function saveAffiliation(formData: FormData) {
  const companyName = formData.get('companyName') as string
  const unitName = formData.get('unitName') as string
  const divisionName = formData.get('divisionName') as string

  // Get the base URL for API calls
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

  // POST to API route
  const response = await fetch(`${baseUrl}/api/company-affiliation/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      companyName,
      unitName,
      divisionName,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to save affiliation' }))
    throw new Error(error.error || 'Failed to save affiliation')
  }

  return await response.json()
}

