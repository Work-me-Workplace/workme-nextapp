/**
 * WorkMe Configuration
 * 
 * Single-tenant container configuration
 */

// WorkMe container ID - represents the single tenant
// This is now stored in WorkMeCompany model, but kept here for backward compatibility
export const WORKME_CONTAINER_ID = process.env.WORKME_CONTAINER_ID || 'workme-container-001'

/**
 * Get or create the WorkMeCompany (container) record
 * This is the single tenant entity - silently tags all WorkMe records for tenant partitioning
 * 
 * @returns WorkMeCompany record with id
 */
export async function getWorkMeCompany() {
  const { prisma } = await import('@/lib/prisma')
  
  // Try to find existing WorkMeCompany
  let workMeCompany = await prisma.workMeCompany.findFirst()
  
  if (!workMeCompany) {
    // Create the WorkMeCompany (container) - only happens once
    workMeCompany = await prisma.workMeCompany.create({
      data: {
        name: 'WorkMe Platform',
        description: 'The WorkMe career growth platform',
      },
    })
    console.log('✅ Created WorkMeCompany container:', workMeCompany.id)
  }
  
  return workMeCompany
}

/**
 * Get or create WorkMeCompany and return its ID
 * Use this when you need to set workMeCompanyId on WorkMe or CompanyEmployee records
 * 
 * @returns WorkMeCompany ID string
 */
export async function getWorkMeCompanyId(): Promise<string> {
  const workMeCompany = await getWorkMeCompany()
  return workMeCompany.id
}

