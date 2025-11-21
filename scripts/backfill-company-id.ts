/**
 * Backfill Script: Populate companyId for all existing records
 * 
 * For each record with NULL companyId:
 * - Find creator WorkMe via createdByWorkMeId
 * - Use workMe.companyId to populate companyId
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

interface BackfillResult {
  tableName: string
  updated: number
  skipped: number
  errors: string[]
}

async function backfillCompanyId() {
  console.log('🔄 Starting companyId backfill...\n')
  console.log('='.repeat(80) + '\n')

  const results: BackfillResult[] = []

  try {
    // ============================================================
    // 1. WorkContext
    // ============================================================
    console.log('📊 Backfilling WorkContext...')
    const workContexts = await prisma.workContext.findMany({
      where: { companyId: null },
      select: { id: true, createdByWorkMeId: true },
    })

    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const ctx of workContexts) {
      if (!ctx.createdByWorkMeId) {
        skipped++
        errors.push(`WorkContext ${ctx.id}: missing createdByWorkMeId`)
        continue
      }

      const creator = await prisma.workMe.findUnique({
        where: { id: ctx.createdByWorkMeId },
        select: { companyId: true },
      })

      if (!creator || !creator.companyId) {
        skipped++
        errors.push(`WorkContext ${ctx.id}: creator ${ctx.createdByWorkMeId} has no companyId`)
        continue
      }

      await prisma.workContext.update({
        where: { id: ctx.id },
        data: { companyId: creator.companyId },
      })

      updated++
      console.log(`  ✅ Updated WorkContext ${ctx.id} → companyId: ${creator.companyId}`)
    }

    console.log(`  Summary: ${updated} updated, ${skipped} skipped, ${errors.length} errors\n`)
    results.push({ tableName: 'WorkContext', updated, skipped, errors })

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
      console.log(`📊 Backfilling ${name}...`)
      
      try {
        const records = await (model as any).findMany({
          where: { companyId: null },
          select: { id: true, createdByWorkMeId: true },
        })

        let updated = 0
        let skipped = 0
        const errors: string[] = []

        for (const record of records) {
          if (!record.createdByWorkMeId) {
            skipped++
            errors.push(`${name} ${record.id}: missing createdByWorkMeId`)
            continue
          }

          const creator = await prisma.workMe.findUnique({
            where: { id: record.createdByWorkMeId },
            select: { companyId: true },
          })

          if (!creator || !creator.companyId) {
            skipped++
            errors.push(`${name} ${record.id}: creator ${record.createdByWorkMeId} has no companyId`)
            continue
          }

          await (model as any).update({
            where: { id: record.id },
            data: { companyId: creator.companyId },
          })

          updated++
          console.log(`  ✅ Updated ${name} ${record.id} → companyId: ${creator.companyId}`)
        }

        console.log(`  Summary: ${updated} updated, ${skipped} skipped, ${errors.length} errors\n`)
        results.push({ tableName: name, updated, skipped, errors })
      } catch (error: any) {
        console.log(`  ⚠️  Error processing ${name}: ${error.message}\n`)
        results.push({ tableName: name, updated: 0, skipped: 0, errors: [error.message] })
      }
    }

    // ============================================================
    // 3. WorkSupport
    // ============================================================
    console.log('📊 Backfilling WorkSupport...')
    const workSupports = await prisma.workSupport.findMany({
      where: { companyId: null },
      select: { id: true, createdByWorkMeId: true, contextId: true },
    })

    let supportUpdated = 0
    let supportSkipped = 0
    const supportErrors: string[] = []

    for (const support of workSupports) {
      // Try to get companyId from context first
      let companyId: string | null = null

      if (support.contextId) {
        const context = await prisma.workContext.findUnique({
          where: { id: support.contextId },
          select: { companyId: true },
        })
        companyId = context?.companyId || null
      }

      // Fallback to creator's companyId
      if (!companyId && support.createdByWorkMeId) {
        const creator = await prisma.workMe.findUnique({
          where: { id: support.createdByWorkMeId },
          select: { companyId: true },
        })
        companyId = creator?.companyId || null
      }

      if (!companyId) {
        supportSkipped++
        supportErrors.push(`WorkSupport ${support.id}: cannot determine companyId`)
        continue
      }

      await prisma.workSupport.update({
        where: { id: support.id },
        data: { companyId },
      })

      supportUpdated++
      console.log(`  ✅ Updated WorkSupport ${support.id} → companyId: ${companyId}`)
    }

    console.log(`  Summary: ${supportUpdated} updated, ${supportSkipped} skipped, ${supportErrors.length} errors\n`)
    results.push({ tableName: 'WorkSupport', updated: supportUpdated, skipped: supportSkipped, errors: supportErrors })

    // ============================================================
    // 4. WorkOutput
    // ============================================================
    console.log('📊 Backfilling WorkOutput...')
    const workOutputs = await prisma.workOutput.findMany({
      where: { companyId: null },
      select: { id: true, createdByWorkMeId: true, contextId: true, supportId: true },
    })

    let outputUpdated = 0
    let outputSkipped = 0
    const outputErrors: string[] = []

    for (const output of workOutputs) {
      let companyId: string | null = null

      // Try context first
      if (output.contextId) {
        const context = await prisma.workContext.findUnique({
          where: { id: output.contextId },
          select: { companyId: true },
        })
        companyId = context?.companyId || null
      }

      // Try support
      if (!companyId && output.supportId) {
        const support = await prisma.workSupport.findUnique({
          where: { id: output.supportId },
          select: { companyId: true },
        })
        companyId = support?.companyId || null
      }

      // Fallback to creator
      if (!companyId && output.createdByWorkMeId) {
        const creator = await prisma.workMe.findUnique({
          where: { id: output.createdByWorkMeId },
          select: { companyId: true },
        })
        companyId = creator?.companyId || null
      }

      if (!companyId) {
        outputSkipped++
        outputErrors.push(`WorkOutput ${output.id}: cannot determine companyId`)
        continue
      }

      await prisma.workOutput.update({
        where: { id: output.id },
        data: { companyId },
      })

      outputUpdated++
      console.log(`  ✅ Updated WorkOutput ${output.id} → companyId: ${companyId}`)
    }

    console.log(`  Summary: ${outputUpdated} updated, ${outputSkipped} skipped, ${outputErrors.length} errors\n`)
    results.push({ tableName: 'WorkOutput', updated: outputUpdated, skipped: outputSkipped, errors: outputErrors })

    // ============================================================
    // 5. WorkOutputStandalone
    // ============================================================
    console.log('📊 Backfilling WorkOutputStandalone...')
    const standaloneOutputs = await prisma.workOutputStandalone.findMany({
      where: { companyId: null },
      select: { id: true, createdByWorkMeId: true },
    })

    let standaloneUpdated = 0
    let standaloneSkipped = 0
    const standaloneErrors: string[] = []

    for (const output of standaloneOutputs) {
      if (!output.createdByWorkMeId) {
        skipped++
        errors.push(`WorkOutputStandalone ${output.id}: missing createdByWorkMeId`)
        continue
      }

      const creator = await prisma.workMe.findUnique({
        where: { id: output.createdByWorkMeId },
        select: { companyId: true },
      })

      if (!creator || !creator.companyId) {
        standaloneSkipped++
        standaloneErrors.push(`WorkOutputStandalone ${output.id}: creator has no companyId`)
        continue
      }

      await prisma.workOutputStandalone.update({
        where: { id: output.id },
        data: { companyId: creator.companyId },
      })

      standaloneUpdated++
      console.log(`  ✅ Updated WorkOutputStandalone ${output.id} → companyId: ${creator.companyId}`)
    }

    console.log(`  Summary: ${standaloneUpdated} updated, ${standaloneSkipped} skipped, ${standaloneErrors.length} errors\n`)
    results.push({ tableName: 'WorkOutputStandalone', updated: standaloneUpdated, skipped: standaloneSkipped, errors: standaloneErrors })

    // ============================================================
    // 6. Career Models
    // ============================================================
    const careerModels = [
      { name: 'Achievement', model: prisma.achievement },
      { name: 'Objective', model: prisma.objective },
      { name: 'CommsOutput', model: prisma.commsOutput },
    ]

    for (const { name, model } of careerModels) {
      console.log(`📊 Backfilling ${name}...`)
      
      try {
        const records = await (model as any).findMany({
          where: { companyId: null },
          select: { id: true, createdByWorkMeId: true },
        })

        let careerUpdated = 0
        let careerSkipped = 0
        const careerErrors: string[] = []

        for (const record of records) {
          if (!record.createdByWorkMeId) {
            careerSkipped++
            careerErrors.push(`${name} ${record.id}: missing createdByWorkMeId`)
            continue
          }

          const creator = await prisma.workMe.findUnique({
            where: { id: record.createdByWorkMeId },
            select: { companyId: true },
          })

          if (!creator || !creator.companyId) {
            careerSkipped++
            careerErrors.push(`${name} ${record.id}: creator has no companyId`)
            continue
          }

          await (model as any).update({
            where: { id: record.id },
            data: { companyId: creator.companyId },
          })

          careerUpdated++
          console.log(`  ✅ Updated ${name} ${record.id} → companyId: ${creator.companyId}`)
        }

        console.log(`  Summary: ${careerUpdated} updated, ${careerSkipped} skipped, ${careerErrors.length} errors\n`)
        results.push({ tableName: name, updated: careerUpdated, skipped: careerSkipped, errors: careerErrors })
      } catch (error: any) {
        console.log(`  ⚠️  Error processing ${name}: ${error.message}\n`)
        results.push({ tableName: name, updated: 0, skipped: 0, errors: [error.message] })
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
      console.log(`📊 Backfilling ${name}...`)
      
      try {
        const records = await (model as any).findMany({
          where: { companyId: null },
          select: { [idField]: true, createdByWorkMeId: true },
        })

        let commsUpdated = 0
        let commsSkipped = 0
        const commsErrors: string[] = []

        for (const record of records) {
          const recordId = record[idField]
          
          if (!record.createdByWorkMeId) {
            commsSkipped++
            commsErrors.push(`${name} ${recordId}: missing createdByWorkMeId`)
            continue
          }

          const creator = await prisma.workMe.findUnique({
            where: { id: record.createdByWorkMeId },
            select: { companyId: true },
          })

          if (!creator || !creator.companyId) {
            commsSkipped++
            commsErrors.push(`${name} ${recordId}: creator has no companyId`)
            continue
          }

          await (model as any).update({
            where: { [idField]: recordId },
            data: { companyId: creator.companyId },
          })

          commsUpdated++
          console.log(`  ✅ Updated ${name} ${recordId} → companyId: ${creator.companyId}`)
        }

        console.log(`  Summary: ${commsUpdated} updated, ${commsSkipped} skipped, ${commsErrors.length} errors\n`)
        results.push({ tableName: name, updated: commsUpdated, skipped: commsSkipped, errors: commsErrors })
      } catch (error: any) {
        console.log(`  ⚠️  Error processing ${name}: ${error.message}\n`)
        results.push({ tableName: name, updated: 0, skipped: 0, errors: [error.message] })
      }
    }

    // ============================================================
    // FINAL REPORT
    // ============================================================
    console.log('='.repeat(80))
    console.log('📋 BACKFILL SUMMARY REPORT')
    console.log('='.repeat(80) + '\n')

    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0)
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)

    results.forEach(result => {
      if (result.updated > 0 || result.skipped > 0 || result.errors.length > 0) {
        console.log(`${result.tableName}:`)
        console.log(`  ✅ Updated: ${result.updated}`)
        console.log(`  ⚠️  Skipped: ${result.skipped}`)
        if (result.errors.length > 0) {
          console.log(`  ❌ Errors: ${result.errors.length}`)
          result.errors.slice(0, 5).forEach(err => console.log(`    - ${err}`))
          if (result.errors.length > 5) {
            console.log(`    ... and ${result.errors.length - 5} more`)
          }
        }
        console.log('')
      }
    })

    console.log('='.repeat(80))
    console.log(`TOTALS:`)
    console.log(`  ✅ Records Updated: ${totalUpdated}`)
    console.log(`  ⚠️  Records Skipped: ${totalSkipped}`)
    console.log(`  ❌ Errors: ${totalErrors}`)
    console.log('='.repeat(80) + '\n')

    if (totalSkipped > 0 || totalErrors > 0) {
      console.log('⚠️  WARNING: Some records could not be backfilled!')
      console.log('   Please review the errors above before proceeding to Step 5.')
      console.log('   Making fields required will fail if any NULL companyId values remain.\n')
      process.exit(1)
    } else {
      console.log('✅ SUCCESS: All records have been backfilled!')
      console.log('   Safe to proceed to Step 5 (make fields required).\n')
    }

  } catch (error: any) {
    console.error('\n❌ Backfill failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backfillCompanyId()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

