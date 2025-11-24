/**
 * Verification Script: Check for NULL companyId values
 * 
 * Queries every table that contains companyId and reports any NULLs
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

interface VerificationResult {
  tableName: string
  totalRecords: number
  nullCompanyId: number
  nullCreatedBy: number
  sampleIds: string[]
}

async function verifyCompanyId() {
  console.log('🔍 Verifying companyId backfill...\n')
  console.log('='.repeat(80) + '\n')

  const results: VerificationResult[] = []
  let hasFailures = false

  try {
    // ============================================================
    // 1. WorkContext
    // ============================================================
    console.log('📊 Verifying WorkContext...')
    const workContexts = await prisma.workEventRouter.findMany({
      select: { id: true, companyId: true, originatorId: true },
    })
    
    const nullCompanyId = workContexts.filter(c => !c.companyId).map(c => c.id)
    const nullCreatedBy = workContexts.filter(c => !c.originatorId).map(c => c.id)
    
    console.log(`  Total records: ${workContexts.length}`)
    console.log(`  NULL companyId: ${nullCompanyId.length}`)
    console.log(`  NULL originatorId: ${nullCreatedBy.length}`)
    
    if (nullCompanyId.length > 0 || nullCreatedBy.length > 0) {
      hasFailures = true
      console.log(`  ❌ FAILED: Found NULL values`)
      if (nullCompanyId.length > 0) {
        console.log(`    Sample IDs with NULL companyId: ${nullCompanyId.slice(0, 5).join(', ')}`)
      }
      if (nullCreatedBy.length > 0) {
        console.log(`    Sample IDs with NULL originatorId: ${nullCreatedBy.slice(0, 5).join(', ')}`)
      }
    } else {
      console.log(`  ✅ PASSED: All records have companyId and originatorId`)
    }
    console.log('')
    
    results.push({
      tableName: 'WorkContext',
      totalRecords: workContexts.length,
      nullCompanyId: nullCompanyId.length,
      nullCreatedBy: nullCreatedBy.length,
      sampleIds: nullCompanyId.slice(0, 5),
    })

    // ============================================================
    // 2. Typed Context Models
    // ============================================================
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
      console.log(`📊 Verifying ${name}...`)
      
      try {
        const records = await (model as any).findMany({
          select: { id: true, companyId: true, originatorId: true },
        })
        
        const nullCompanyId = records.filter((r: any) => !r.companyId).map((r: any) => r.id)
        const nullCreatedBy = records.filter((r: any) => !r.originatorId).map((r: any) => r.id)
        
        console.log(`  Total records: ${records.length}`)
        console.log(`  NULL companyId: ${nullCompanyId.length}`)
        console.log(`  NULL originatorId: ${nullCreatedBy.length}`)
        
        if (nullCompanyId.length > 0 || nullCreatedBy.length > 0) {
          hasFailures = true
          console.log(`  ❌ FAILED: Found NULL values`)
          if (nullCompanyId.length > 0) {
            console.log(`    Sample IDs with NULL companyId: ${nullCompanyId.slice(0, 5).join(', ')}`)
          }
          if (nullCreatedBy.length > 0) {
            console.log(`    Sample IDs with NULL originatorId: ${nullCreatedBy.slice(0, 5).join(', ')}`)
          }
        } else {
          console.log(`  ✅ PASSED: All records have companyId and originatorId`)
        }
        console.log('')
        
        results.push({
          tableName: name,
          totalRecords: records.length,
          nullCompanyId: nullCompanyId.length,
          nullCreatedBy: nullCreatedBy.length,
          sampleIds: nullCompanyId.slice(0, 5),
        })
      } catch (error: any) {
        console.log(`  ⚠️  Error: ${error.message}\n`)
      }
    }

    // ============================================================
    // 3. WorkSupport
    // ============================================================
    console.log('📊 Verifying WorkSupport...')
    const workSupports = await prisma.workSupport.findMany({
      select: { id: true, companyId: true, originatorId: true },
    })
    
    const supportNullCompanyId = workSupports.filter(s => !s.companyId).map(s => s.id)
    const supportNullCreatedBy = workSupports.filter(s => !s.originatorId).map(s => s.id)
    
    console.log(`  Total records: ${workSupports.length}`)
    console.log(`  NULL companyId: ${supportNullCompanyId.length}`)
    console.log(`  NULL originatorId: ${supportNullCreatedBy.length}`)
    
    if (supportNullCompanyId.length > 0 || supportNullCreatedBy.length > 0) {
      hasFailures = true
      console.log(`  ❌ FAILED: Found NULL values`)
    } else {
      console.log(`  ✅ PASSED: All records have companyId and originatorId`)
    }
    console.log('')
    
    results.push({
      tableName: 'WorkSupport',
      totalRecords: workSupports.length,
      nullCompanyId: supportNullCompanyId.length,
      nullCreatedBy: supportNullCreatedBy.length,
      sampleIds: supportNullCompanyId.slice(0, 5),
    })

    // ============================================================
    // 4. WorkOutput
    // ============================================================
    console.log('📊 Verifying WorkOutput...')
    const workOutputs = await prisma.workOutput.findMany({
      select: { id: true, companyId: true, originatorId: true },
    })
    
    const outputNullCompanyId = workOutputs.filter(o => !o.companyId).map(o => o.id)
    const outputNullCreatedBy = workOutputs.filter(o => !o.originatorId).map(o => o.id)
    
    console.log(`  Total records: ${workOutputs.length}`)
    console.log(`  NULL companyId: ${outputNullCompanyId.length}`)
    console.log(`  NULL originatorId: ${outputNullCreatedBy.length}`)
    
    if (outputNullCompanyId.length > 0 || outputNullCreatedBy.length > 0) {
      hasFailures = true
      console.log(`  ❌ FAILED: Found NULL values`)
    } else {
      console.log(`  ✅ PASSED: All records have companyId and originatorId`)
    }
    console.log('')
    
    results.push({
      tableName: 'WorkOutput',
      totalRecords: workOutputs.length,
      nullCompanyId: outputNullCompanyId.length,
      nullCreatedBy: outputNullCreatedBy.length,
      sampleIds: outputNullCompanyId.slice(0, 5),
    })

    // ============================================================
    // 5. WorkOutputStandalone
    // ============================================================
    console.log('📊 Verifying WorkOutputStandalone...')
    const standaloneOutputs = await prisma.workOutputStandalone.findMany({
      select: { id: true, companyId: true, originatorId: true },
    })
    
    const standaloneNullCompanyId = standaloneOutputs.filter(o => !o.companyId).map(o => o.id)
    const standaloneNullCreatedBy = standaloneOutputs.filter(o => !o.originatorId).map(o => o.id)
    
    console.log(`  Total records: ${standaloneOutputs.length}`)
    console.log(`  NULL companyId: ${standaloneNullCompanyId.length}`)
    console.log(`  NULL originatorId: ${standaloneNullCreatedBy.length}`)
    
    if (standaloneNullCompanyId.length > 0 || standaloneNullCreatedBy.length > 0) {
      hasFailures = true
      console.log(`  ❌ FAILED: Found NULL values`)
    } else {
      console.log(`  ✅ PASSED: All records have companyId and originatorId`)
    }
    console.log('')
    
    results.push({
      tableName: 'WorkOutputStandalone',
      totalRecords: standaloneOutputs.length,
      nullCompanyId: standaloneNullCompanyId.length,
      nullCreatedBy: standaloneNullCreatedBy.length,
      sampleIds: standaloneNullCompanyId.slice(0, 5),
    })

    // ============================================================
    // 6. Career Models
    // ============================================================
    const careerModels = [
      { name: 'Achievement', model: prisma.achievement },
      { name: 'Objective', model: prisma.objective },
      { name: 'CommsOutput', model: prisma.commsOutput },
    ]

    for (const { name, model } of careerModels) {
      console.log(`📊 Verifying ${name}...`)
      
      try {
        const records = await (model as any).findMany({
          select: { id: true, companyId: true, originatorId: true },
        })
        
        const nullCompanyId = records.filter((r: any) => !r.companyId).map((r: any) => r.id)
        const nullCreatedBy = records.filter((r: any) => !r.originatorId).map((r: any) => r.id)
        
        console.log(`  Total records: ${records.length}`)
        console.log(`  NULL companyId: ${nullCompanyId.length}`)
        console.log(`  NULL originatorId: ${nullCreatedBy.length}`)
        
        if (nullCompanyId.length > 0 || nullCreatedBy.length > 0) {
          hasFailures = true
          console.log(`  ❌ FAILED: Found NULL values`)
        } else {
          console.log(`  ✅ PASSED: All records have companyId and originatorId`)
        }
        console.log('')
        
        results.push({
          tableName: name,
          totalRecords: records.length,
          nullCompanyId: nullCompanyId.length,
          nullCreatedBy: nullCreatedBy.length,
          sampleIds: nullCompanyId.slice(0, 5),
        })
      } catch (error: any) {
        console.log(`  ⚠️  Error: ${error.message}\n`)
      }
    }

    // ============================================================
    // 7. WorkforceComms Models
    // ============================================================
    const workforceCommsModels = [
      { name: 'WorkforceComms', model: prisma.workforceComms, idField: 'workforceCommsId' },
      { name: 'WorkforceCommsDraft', model: prisma.workforceCommsDraft, idField: 'draftId' },
      { name: 'WorkforceCommsEdition', model: prisma.workforceCommsEdition, idField: 'editionId' },
    ]

    for (const { name, model, idField } of workforceCommsModels) {
      console.log(`📊 Verifying ${name}...`)
      
      try {
        const records = await (model as any).findMany({
          select: { [idField]: true, companyId: true, originatorId: true },
        })
        
        const nullCompanyId = records.filter((r: any) => !r.companyId).map((r: any) => r[idField])
        const nullCreatedBy = records.filter((r: any) => !r.originatorId).map((r: any) => r[idField])
        
        console.log(`  Total records: ${records.length}`)
        console.log(`  NULL companyId: ${nullCompanyId.length}`)
        console.log(`  NULL originatorId: ${nullCreatedBy.length}`)
        
        if (nullCompanyId.length > 0 || nullCreatedBy.length > 0) {
          hasFailures = true
          console.log(`  ❌ FAILED: Found NULL values`)
        } else {
          console.log(`  ✅ PASSED: All records have companyId and originatorId`)
        }
        console.log('')
        
        results.push({
          tableName: name,
          totalRecords: records.length,
          nullCompanyId: nullCompanyId.length,
          nullCreatedBy: nullCreatedBy.length,
          sampleIds: nullCompanyId.slice(0, 5),
        })
      } catch (error: any) {
        console.log(`  ⚠️  Error: ${error.message}\n`)
      }
    }

    // ============================================================
    // FINAL REPORT
    // ============================================================
    console.log('='.repeat(80))
    console.log('📋 VERIFICATION SUMMARY REPORT')
    console.log('='.repeat(80) + '\n')

    const totalRecords = results.reduce((sum, r) => sum + r.totalRecords, 0)
    const totalNullCompanyId = results.reduce((sum, r) => sum + r.nullCompanyId, 0)
    const totalNullCreatedBy = results.reduce((sum, r) => sum + r.nullCreatedBy, 0)

    const failedTables = results.filter(r => r.nullCompanyId > 0 || r.nullCreatedBy > 0)

    if (failedTables.length > 0) {
      console.log('❌ FAILED TABLES:\n')
      failedTables.forEach(result => {
        console.log(`  ${result.tableName}:`)
        if (result.nullCompanyId > 0) {
          console.log(`    NULL companyId: ${result.nullCompanyId}`)
          if (result.sampleIds.length > 0) {
            console.log(`    Sample IDs: ${result.sampleIds.join(', ')}`)
          }
        }
        if (result.nullCreatedBy > 0) {
          console.log(`    NULL originatorId: ${result.nullCreatedBy}`)
        }
        console.log('')
      })
    }

    console.log('='.repeat(80))
    console.log(`TOTALS:`)
    console.log(`  Total records checked: ${totalRecords}`)
    console.log(`  NULL companyId: ${totalNullCompanyId}`)
    console.log(`  NULL originatorId: ${totalNullCreatedBy}`)
    console.log('='.repeat(80) + '\n')

    if (hasFailures) {
      console.log('❌ VERIFICATION FAILED!')
      console.log('   Do NOT proceed to Step 5.')
      console.log('   Please run the backfill script again to fix NULL values.\n')
      process.exit(1)
    } else {
      console.log('✅ VERIFICATION PASSED!')
      console.log('   All records have companyId and originatorId.')
      console.log('   Safe to proceed to Step 5 (make fields required).\n')
    }

  } catch (error: any) {
    console.error('\n❌ Verification failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyCompanyId()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

