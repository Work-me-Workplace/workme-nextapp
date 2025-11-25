/**
 * Company Enrichment Actions
 * 
 * Server actions for enriching and upserting company data from Apollo
 */

'use server'

import { enrichCompanyApollo } from '@/lib/external/apolloClient'
import { mapApolloToCompany } from '@/lib/server/companyEnrichmentService'
import { prisma } from '@/lib/prisma'

/**
 * Enrich and upsert company data from Apollo
 * 
 * @param companyName - The name of the company to enrich
 * @returns Promise<Company> - The enriched company record
 */
export async function enrichAndUpsertCompany(companyName: string) {
  try {
    // Fetch data from Apollo
    const apolloData = await enrichCompanyApollo(companyName)
    
    // Map Apollo data to Work.me format
    const mapped = mapApolloToCompany(apolloData)
    
    // Ensure name matches (use the provided companyName as source of truth)
    mapped.name = companyName
    
    // Upsert company
    const company = await prisma.company.upsert({
      where: { name: companyName },
      create: mapped,
      update: mapped,
    })
    
    return company
  } catch (error: any) {
    console.error('❌ enrichAndUpsertCompany error:', error)
    throw new Error(`Failed to enrich company: ${error.message}`)
  }
}

