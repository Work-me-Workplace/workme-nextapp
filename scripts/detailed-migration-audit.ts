/**
 * Detailed Migration Safety Audit
 * 
 * Checks relationships and provides migration recommendations
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function detailedAudit() {
  console.log('🔍 DETAILED MIGRATION SAFETY AUDIT\n')
  console.log('='.repeat(80) + '\n')

  try {
    // 1. Check WorkMe and Company relationships
    console.log('📊 1. WORKME & COMPANY RELATIONSHIPS\n')
    const workMes = await prisma.workMe.findMany({
      include: { company: true },
    })
    
    console.log(`   Total WorkMe records: ${workMes.length}`)
    workMes.forEach(wm => {
      console.log(`   - WorkMe ID: ${wm.id}`)
      console.log(`     Email: ${wm.email}`)
      console.log(`     CompanyId: ${wm.companyId || 'NULL ⚠️'}`)
      if (wm.company) {
        console.log(`     Company: ${wm.company.name} (${wm.company.id})`)
      } else {
        console.log(`     Company: NOT FOUND ⚠️`)
      }
      console.log('')
    })
    console.log('')

    // 2. Check Company records
    console.log('📊 2. COMPANY RECORDS\n')
    const companies = await prisma.company.findMany({
      include: { employees: { select: { id: true, email: true } } },
    })
    
    console.log(`   Total Company records: ${companies.length}`)
    companies.forEach(comp => {
      console.log(`   - Company ID: ${comp.id}`)
      console.log(`     Name: ${comp.name}`)
      console.log(`     Employees: ${comp.employees.length}`)
      comp.employees.forEach(emp => {
        console.log(`       - ${emp.email} (${emp.id})`)
      })
      console.log('')
    })
    console.log('')

    // 3. Check WorkContext records and their relationships
    console.log('📊 3. WORKCONTEXT RECORDS\n')
    const workContexts = await prisma.workEventRouter.findMany({
      include: {
        // Note: originatorId relation doesn't exist yet in current schema
      },
    })
    
    console.log(`   Total WorkContext records: ${workContexts.length}`)
    for (const ctx of workContexts) {
      console.log(`   - WorkContext ID: ${ctx.id}`)
      console.log(`     Type: ${ctx.type}`)
      console.log(`     EventRefId: ${ctx.eventRefId}`)
      console.log(`     CreatedByWorkMeId: ${ctx.originatorId}`)
      console.log(`     CreatedAt: ${ctx.createdAt}`)
      
      // Try to find the creator's company
      const creator = await prisma.workMe.findUnique({
        where: { id: ctx.originatorId },
        select: { companyId: true, company: { select: { id: true, name: true } } },
      })
      
      if (creator) {
        console.log(`     Creator's CompanyId: ${creator.companyId || 'NULL ⚠️'}`)
        if (creator.company) {
          console.log(`     Creator's Company: ${creator.company.name} (${creator.company.id})`)
        }
      } else {
        console.log(`     ⚠️  Creator WorkMe not found!`)
      }
      console.log('')
    }
    console.log('')

    // 4. Check Typed Context Models
    console.log('📊 4. TYPED CONTEXT MODELS\n')
    
    const typedModels = [
      { name: 'WorkContextCampaign', model: prisma.workContextCampaign },
      { name: 'WorkContextImpactEvent', model: prisma.workContextImpactEvent },
      { name: 'WorkContextTraining', model: prisma.workContextTraining },
      { name: 'WorkEvent', model: prisma.workEvent },
      { name: 'WorkContextCommunity', model: prisma.workContextCommunity },
      { name: 'WorkContextBenefits', model: prisma.workContextBenefits },
      { name: 'WorkContextCareer', model: prisma.workContextCareer },
      { name: 'WorkContextEmployeeCause', model: prisma.workContextEmployeeCause },
    ]

    for (const { name, model } of typedModels) {
      try {
        const records = await (model as any).findMany({
          select: { id: true, originatorId: true, title: true },
        })
        
        if (records.length > 0) {
          console.log(`   ${name}: ${records.length} records`)
          for (const record of records) {
            console.log(`     - ID: ${record.id}`)
            console.log(`       Title: ${record.title || 'N/A'}`)
            console.log(`       CreatedByWorkMeId: ${record.originatorId}`)
            
            // Find creator's company
            const creator = await prisma.workMe.findUnique({
              where: { id: record.originatorId },
              select: { companyId: true, company: { select: { id: true, name: true } } },
            })
            
            if (creator) {
              console.log(`       Creator's CompanyId: ${creator.companyId || 'NULL ⚠️'}`)
              if (creator.company) {
                console.log(`       Creator's Company: ${creator.company.name} (${creator.company.id})`)
              }
            } else {
              console.log(`       ⚠️  Creator WorkMe not found!`)
            }
            console.log('')
          }
        }
      } catch (error: any) {
        // Model might not exist yet
      }
    }
    console.log('')

    // 5. Generate migration risk assessment
    console.log('='.repeat(80))
    console.log('⚠️  MIGRATION RISK ASSESSMENT')
    console.log('='.repeat(80) + '\n')

    const workMesWithoutCompany = workMes.filter(wm => !wm.companyId)
    const workContextsCount = workContexts.length
    
    let totalRecordsNeedingBackfill = 0
    
    // Count all records that need companyId
    for (const ctx of workContexts) {
      const creator = await prisma.workMe.findUnique({
        where: { id: ctx.originatorId },
        select: { companyId: true },
      })
      
      if (creator && creator.companyId) {
        totalRecordsNeedingBackfill++
      } else {
        console.log(`⚠️  WorkContext ${ctx.id} has creator without companyId - CANNOT BACKFILL`)
      }
    }
    
    // Check typed contexts
    for (const { name, model } of typedModels) {
      try {
        const records = await (model as any).findMany({
          select: { id: true, originatorId: true },
        })
        
        for (const record of records) {
          const creator = await prisma.workMe.findUnique({
            where: { id: record.originatorId },
            select: { companyId: true },
          })
          
          if (creator && creator.companyId) {
            totalRecordsNeedingBackfill++
          } else {
            console.log(`⚠️  ${name} ${record.id} has creator without companyId - CANNOT BACKFILL`)
          }
        }
      } catch (error) {
        // Model might not exist
      }
    }

    console.log(`\n📊 SUMMARY:`)
    console.log(`   WorkMe records without companyId: ${workMesWithoutCompany.length}`)
    console.log(`   WorkContext records needing companyId: ${workContextsCount}`)
    console.log(`   Records that CAN be backfilled: ${totalRecordsNeedingBackfill}`)
    console.log(`   Records that CANNOT be backfilled: ${workContextsCount - totalRecordsNeedingBackfill}`)
    console.log(`   Company records available: ${companies.length}`)
    console.log('')

    // Determine migration strategy
    console.log('='.repeat(80))
    console.log('🎯 RECOMMENDED MIGRATION STRATEGY')
    console.log('='.repeat(80) + '\n')

    if (workMesWithoutCompany.length > 0) {
      console.log('❌ BLOCKER: Some WorkMe records are missing companyId')
      console.log('   Action required: Assign companyId to all WorkMe records before migration')
      console.log('')
    }

    if (totalRecordsNeedingBackfill === 0 && workContextsCount === 0) {
      console.log('✅ SAFE: No existing data to migrate')
      console.log('   Strategy: Direct migration (no backfill needed)')
      console.log('   Risk: NONE - All tables are empty')
      console.log('')
    } else if (totalRecordsNeedingBackfill === workContextsCount) {
      console.log('✅ SAFE: All records can be backfilled from creator\'s companyId')
      console.log('   Strategy: Migration with backfill script')
      console.log('   Risk: LOW - Can derive companyId from creator WorkMe')
      console.log('')
    } else {
      console.log('⚠️  RISKY: Some records cannot be backfilled')
      console.log('   Strategy: Review each record and assign companyId manually OR wipe DB')
      console.log('   Risk: MEDIUM - Some data may need manual intervention')
      console.log('')
    }

  } catch (error: any) {
    console.error('❌ Audit error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

detailedAudit()
  .then(() => {
    console.log('\n✅ Detailed audit complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Detailed audit failed:', error)
    process.exit(1)
  })

