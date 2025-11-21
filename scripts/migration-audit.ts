/**
 * Migration Safety Audit Script
 * 
 * Inspects the live database to determine migration safety
 * for adding required companyId and originatorId fields
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TableAudit {
  tableName: string
  recordCount: number
  hasData: boolean
  missingCompanyId: number
  missingCreatedBy: number
  sampleIds: string[]
}

async function auditDatabase() {
  console.log('🔍 Starting Migration Safety Audit...\n')
  
  const audits: TableAudit[] = []

  try {
    // 1. Check WorkMe records
    console.log('📊 Auditing WorkMe records...')
    const workMes = await prisma.workMe.findMany({
      select: { id: true, email: true, companyId: true },
    })
    
    const workMeWithoutCompany = workMes.filter(wm => !wm.companyId)
    console.log(`  Total WorkMe records: ${workMes.length}`)
    console.log(`  WorkMe without companyId: ${workMeWithoutCompany.length}`)
    
    if (workMeWithoutCompany.length > 0) {
      console.log(`  ⚠️  WARNING: ${workMeWithoutCompany.length} WorkMe records missing companyId`)
      console.log(`  Sample IDs: ${workMeWithoutCompany.slice(0, 5).map(w => w.id).join(', ')}`)
    }
    console.log('')

    // 2. Check WorkContext
    console.log('📊 Auditing WorkContext...')
    const workContexts = await prisma.workContext.findMany({
      select: { id: true },
    })
    console.log(`  Total WorkContext records: ${workContexts.length}`)
    audits.push({
      tableName: 'WorkContext',
      recordCount: workContexts.length,
      hasData: workContexts.length > 0,
      missingCompanyId: workContexts.length, // All will need companyId
      missingCreatedBy: 0, // Already has originatorId
      sampleIds: workContexts.slice(0, 5).map(w => w.id),
    })
    console.log('')

    // 3. Check WorkSupport
    console.log('📊 Auditing WorkSupport...')
    const workSupports = await prisma.workSupport.findMany({
      select: { id: true, contextId: true },
    })
    console.log(`  Total WorkSupport records: ${workSupports.length}`)
    audits.push({
      tableName: 'WorkSupport',
      recordCount: workSupports.length,
      hasData: workSupports.length > 0,
      missingCompanyId: workSupports.length,
      missingCreatedBy: 0, // Already has originatorId
      sampleIds: workSupports.slice(0, 5).map(w => w.id),
    })
    console.log('')

    // 4. Check WorkOutput
    console.log('📊 Auditing WorkOutput...')
    const workOutputs = await prisma.workOutput.findMany({
      select: { id: true, contextId: true },
    })
    console.log(`  Total WorkOutput records: ${workOutputs.length}`)
    audits.push({
      tableName: 'WorkOutput',
      recordCount: workOutputs.length,
      hasData: workOutputs.length > 0,
      missingCompanyId: workOutputs.length,
      missingCreatedBy: 0, // Already has originatorId
      sampleIds: workOutputs.slice(0, 5).map(w => w.id),
    })
    console.log('')

    // 5. Check WorkOutputStandalone
    console.log('📊 Auditing WorkOutputStandalone...')
    const standaloneOutputs = await prisma.workOutputStandalone.findMany({
      select: { id: true },
    })
    console.log(`  Total WorkOutputStandalone records: ${standaloneOutputs.length}`)
    audits.push({
      tableName: 'WorkOutputStandalone',
      recordCount: standaloneOutputs.length,
      hasData: standaloneOutputs.length > 0,
      missingCompanyId: standaloneOutputs.length,
      missingCreatedBy: 0, // Already has originatorId
      sampleIds: standaloneOutputs.slice(0, 5).map(w => w.id),
    })
    console.log('')

    // 6. Check Typed Context Models
    console.log('📊 Auditing Typed Context Models...')
    
    const typedModels = [
      { name: 'WorkContextCampaign', model: prisma.workContextCampaign },
      { name: 'WorkContextImpactEvent', model: prisma.workContextImpactEvent },
      { name: 'WorkContextTraining', model: prisma.workContextTraining },
      { name: 'WorkContextEvent', model: prisma.workContextEvent },
      { name: 'WorkContextCommunity', model: prisma.workContextCommunity },
      { name: 'WorkContextBenefits', model: prisma.workContextBenefits },
      { name: 'WorkContextCareer', model: prisma.workContextCareer },
      { name: 'WorkContextEmployeeCause', model: prisma.workContextEmployeeCause },
    ]

    for (const { name, model } of typedModels) {
      try {
        const records = await (model as any).findMany({
          select: { id: true, originatorId: true },
        })
        console.log(`  ${name}: ${records.length} records`)
        audits.push({
          tableName: name,
          recordCount: records.length,
          hasData: records.length > 0,
          missingCompanyId: records.length,
          missingCreatedBy: 0, // Already has originatorId
          sampleIds: records.slice(0, 5).map((r: any) => r.id),
        })
      } catch (error: any) {
        console.log(`  ${name}: Error - ${error.message}`)
        audits.push({
          tableName: name,
          recordCount: 0,
          hasData: false,
          missingCompanyId: 0,
          missingCreatedBy: 0,
          sampleIds: [],
        })
      }
    }
    console.log('')

    // 7. Check Career Models
    console.log('📊 Auditing Career Models...')
    
    const achievements = await prisma.achievement.findMany({
      select: { id: true, originatorId: true },
    })
    console.log(`  Achievement: ${achievements.length} records`)
    audits.push({
      tableName: 'Achievement',
      recordCount: achievements.length,
      hasData: achievements.length > 0,
      missingCompanyId: achievements.length,
      missingCreatedBy: achievements.filter(a => !a.originatorId).length,
      sampleIds: achievements.slice(0, 5).map(a => a.id),
    })

    const objectives = await prisma.objective.findMany({
      select: { id: true, originatorId: true },
    })
    console.log(`  Objective: ${objectives.length} records`)
    audits.push({
      tableName: 'Objective',
      recordCount: objectives.length,
      hasData: objectives.length > 0,
      missingCompanyId: objectives.length,
      missingCreatedBy: objectives.filter(o => !o.originatorId).length,
      sampleIds: objectives.slice(0, 5).map(o => o.id),
    })

    const commsOutputs = await prisma.commsOutput.findMany({
      select: { id: true, originatorId: true },
    })
    console.log(`  CommsOutput: ${commsOutputs.length} records`)
    audits.push({
      tableName: 'CommsOutput',
      recordCount: commsOutputs.length,
      hasData: commsOutputs.length > 0,
      missingCompanyId: commsOutputs.length,
      missingCreatedBy: commsOutputs.filter(c => !c.originatorId).length,
      sampleIds: commsOutputs.slice(0, 5).map(c => c.id),
    })
    console.log('')

    // 8. Check WorkforceComms Models
    console.log('📊 Auditing WorkforceComms Models...')
    
    try {
      const workforceComms = await prisma.workforceComms.findMany({
        select: { workforceCommsId: true },
      })
      console.log(`  WorkforceComms: ${workforceComms.length} records`)
      audits.push({
        tableName: 'WorkforceComms',
        recordCount: workforceComms.length,
        hasData: workforceComms.length > 0,
        missingCompanyId: workforceComms.length,
        missingCreatedBy: workforceComms.length, // Missing originatorId
        sampleIds: workforceComms.slice(0, 5).map(w => w.workforceCommsId),
      })
    } catch (error: any) {
      console.log(`  WorkforceComms: Error - ${error.message}`)
    }

    try {
      const drafts = await prisma.workforceCommsDraft.findMany({
        select: { draftId: true },
      })
      console.log(`  WorkforceCommsDraft: ${drafts.length} records`)
      audits.push({
        tableName: 'WorkforceCommsDraft',
        recordCount: drafts.length,
        hasData: drafts.length > 0,
        missingCompanyId: drafts.length,
        missingCreatedBy: drafts.length,
        sampleIds: drafts.slice(0, 5).map(d => d.draftId),
      })
    } catch (error: any) {
      console.log(`  WorkforceCommsDraft: Error - ${error.message}`)
    }

    try {
      const editions = await prisma.workforceCommsEdition.findMany({
        select: { editionId: true },
      })
      console.log(`  WorkforceCommsEdition: ${editions.length} records`)
      audits.push({
        tableName: 'WorkforceCommsEdition',
        recordCount: editions.length,
        hasData: editions.length > 0,
        missingCompanyId: editions.length,
        missingCreatedBy: editions.length,
        sampleIds: editions.slice(0, 5).map(e => e.editionId),
      })
    } catch (error: any) {
      console.log(`  WorkforceCommsEdition: Error - ${error.message}`)
    }
    console.log('')

    // 9. Check Company records
    console.log('📊 Auditing Company records...')
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
    })
    console.log(`  Total Company records: ${companies.length}`)
    if (companies.length > 0) {
      console.log(`  Company names: ${companies.map(c => c.name).join(', ')}`)
    }
    console.log('')

    // Generate summary report
    console.log('\n' + '='.repeat(80))
    console.log('📋 MIGRATION SAFETY AUDIT SUMMARY')
    console.log('='.repeat(80) + '\n')

    const tablesWithData = audits.filter(a => a.hasData)
    const tablesNeedingCompanyId = audits.filter(a => a.missingCompanyId > 0)
    const tablesNeedingCreatedBy = audits.filter(a => a.missingCreatedBy > 0)

    console.log(`📊 Tables with existing data: ${tablesWithData.length}`)
    console.log(`⚠️  Tables needing companyId: ${tablesNeedingCompanyId.length}`)
    console.log(`⚠️  Tables needing originatorId: ${tablesNeedingCreatedBy.length}`)
    console.log(`👤 WorkMe records without companyId: ${workMeWithoutCompany.length}`)
    console.log(`🏢 Total Company records: ${companies.length}`)
    console.log('')

    console.log('📋 DETAILED TABLE AUDIT:\n')
    audits.forEach(audit => {
      if (audit.hasData) {
        console.log(`  ${audit.tableName}:`)
        console.log(`    Records: ${audit.recordCount}`)
        if (audit.missingCompanyId > 0) {
          console.log(`    ⚠️  Missing companyId: ${audit.missingCompanyId}`)
        }
        if (audit.missingCreatedBy > 0) {
          console.log(`    ⚠️  Missing originatorId: ${audit.missingCreatedBy}`)
        }
        if (audit.sampleIds.length > 0) {
          console.log(`    Sample IDs: ${audit.sampleIds.slice(0, 3).join(', ')}`)
        }
        console.log('')
      }
    })

    return {
      audits,
      workMes,
      workMeWithoutCompany,
      companies,
      tablesWithData,
      tablesNeedingCompanyId,
      tablesNeedingCreatedBy,
    }
  } catch (error: any) {
    console.error('❌ Audit error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run audit
auditDatabase()
  .then((result) => {
    console.log('\n✅ Audit complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Audit failed:', error)
    process.exit(1)
  })

