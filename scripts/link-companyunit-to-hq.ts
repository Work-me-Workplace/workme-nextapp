/**
 * Quick script to link an existing CompanyUnit to a CompanyRegistry (HQ)
 * Usage: npx tsx scripts/link-companyunit-to-hq.ts "CompanyUnit Name" "CompanyRegistry ID"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const companyUnitName = process.argv[2]
  const companyRegistryId = process.argv[3]

  if (!companyUnitName) {
    console.error('Usage: npx tsx scripts/link-companyunit-to-hq.ts "CompanyUnit Name" "CompanyRegistry ID"')
    process.exit(1)
  }

  try {
    // Find the CompanyUnit
    const companyUnit = await prisma.companyUnit.findFirst({
      where: {
        name: {
          equals: companyUnitName,
          mode: 'insensitive',
        },
      },
    })

    if (!companyUnit) {
      console.error(`❌ CompanyUnit "${companyUnitName}" not found`)
      process.exit(1)
    }

    // If companyRegistryId provided, validate it exists
    if (companyRegistryId) {
      const companyRegistry = await prisma.companyRegistry.findUnique({
        where: { id: companyRegistryId },
      })

      if (!companyRegistry) {
        console.error(`❌ CompanyRegistry with ID "${companyRegistryId}" not found`)
        process.exit(1)
      }

      // Update the CompanyUnit
      const updated = await prisma.companyUnit.update({
        where: { id: companyUnit.id },
        data: { companyId: companyRegistryId },
      })

      console.log(`✅ CompanyUnit "${companyUnitName}" linked to Company HQ "${companyRegistry.name}"`)
      console.log(`   CompanyUnit ID: ${updated.id}`)
      console.log(`   Company HQ ID: ${updated.companyId}`)
    } else {
      // Just show current state
      console.log(`CompanyUnit: ${companyUnit.name}`)
      console.log(`   ID: ${companyUnit.id}`)
      console.log(`   Company ID: ${companyUnit.companyId || 'Not linked'}`)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

