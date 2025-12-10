/**
 * Script to backfill workMeCompanyId on all WorkMe records
 * 
 * Usage: npx tsx scripts/backfill-workmecompany.ts
 * 
 * This ensures all WorkMe records have the silent tenant tag (workMeCompanyId)
 */

import { prisma } from '../lib/prisma'
import { getWorkMeCompanyId } from '../lib/config/workmeConfig'

async function backfillWorkMeCompany() {
  try {
    console.log('🔍 Checking WorkMe records for missing workMeCompanyId...\n')

    // Get or create WorkMeCompany
    const workMeCompanyId = await getWorkMeCompanyId()
    console.log(`✅ WorkMeCompany ID: ${workMeCompanyId}\n`)

    // Find all WorkMe records without workMeCompanyId
    const workMeWithoutCompany = await prisma.workMe.findMany({
      where: {
        workMeCompanyId: null,
      },
      select: {
        id: true,
        email: true,
      },
    })

    console.log(`Found ${workMeWithoutCompany.length} WorkMe records without workMeCompanyId\n`)

    if (workMeWithoutCompany.length === 0) {
      console.log('✅ All WorkMe records already have workMeCompanyId set!')
      return
    }

    // Update all records
    let updated = 0
    for (const workMe of workMeWithoutCompany) {
      try {
        await prisma.workMe.update({
          where: { id: workMe.id },
          data: { workMeCompanyId },
        })
        updated++
        console.log(`   ✅ Updated ${workMe.email}`)
      } catch (error: any) {
        console.error(`   ❌ Error updating ${workMe.email}:`, error.message)
      }
    }

    console.log(`\n✅ Backfill complete! Updated ${updated} of ${workMeWithoutCompany.length} records`)

    // Also check CompanyEmployee records (workMeCompanyId is required, so we check all)
    console.log('\n🔍 Checking CompanyEmployee records...\n')
    
    // Since workMeCompanyId is required (not nullable), we'll check all employees
    // and update any that might have the wrong value
    const allEmployees = await prisma.companyEmployee.findMany({
      select: {
        id: true,
        fullName: true,
        companyId: true,
        workMeCompanyId: true,
      },
    })
    
    const employeesToUpdate = allEmployees.filter(emp => 
      emp.workMeCompanyId !== workMeCompanyId
    )

    console.log(`Found ${employeesToUpdate.length} CompanyEmployee records with incorrect workMeCompanyId\n`)

    if (employeesToUpdate.length > 0) {
      let employeeUpdated = 0
      for (const employee of employeesToUpdate) {
        try {
          await prisma.companyEmployee.update({
            where: { id: employee.id },
            data: { workMeCompanyId },
          })
          employeeUpdated++
          console.log(`   ✅ Updated employee: ${employee.fullName}`)
        } catch (error: any) {
          console.error(`   ❌ Error updating employee ${employee.fullName}:`, error.message)
        }
      }
      console.log(`\n✅ Updated ${employeeUpdated} of ${employeesToUpdate.length} CompanyEmployee records`)
    } else {
      console.log('✅ All CompanyEmployee records already have correct workMeCompanyId!')
    }

  } catch (error: any) {
    console.error('❌ Error backfilling workMeCompanyId:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backfillWorkMeCompany()
  .then(() => {
    console.log('\n✅ Backfill process completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Backfill process failed:', error)
    process.exit(1)
  })
