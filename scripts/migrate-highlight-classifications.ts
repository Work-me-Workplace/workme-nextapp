/**
 * Migration script to convert string classifications to enum values
 * 
 * Run with: npx tsx scripts/migrate-highlight-classifications.ts
 */

import { PrismaClient } from '@prisma/client'
import { mapStringToClassification } from '../lib/config/highlightClassification'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting highlight classification migration...')

  // Get all highlights with string classifications
  const highlights = await prisma.companyEmployeeHighlight.findMany({
    where: {
      classification: {
        not: null,
      },
    },
    select: {
      id: true,
      classification: true,
    },
  })

  console.log(`📊 Found ${highlights.length} highlights to check`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const highlight of highlights) {
    try {
      const currentClassification = highlight.classification as string | null

      if (!currentClassification) {
        skipped++
        continue
      }

      // Check if it's already an enum value
      const enumValues = ['EXCELLENCE', 'LEADERSHIP', 'INNOVATION', 'SERVICE', 'IMPACT']
      if (enumValues.includes(currentClassification)) {
        skipped++
        continue
      }

      // Map string to enum
      const mapped = mapStringToClassification(currentClassification)

      if (mapped) {
        await prisma.companyEmployeeHighlight.update({
          where: { id: highlight.id },
          data: { classification: mapped },
        })
        console.log(`✅ Updated ${highlight.id}: "${currentClassification}" → "${mapped}"`)
        updated++
      } else {
        console.log(`⚠️  Could not map "${currentClassification}" for highlight ${highlight.id}`)
        errors++
      }
    } catch (error: any) {
      console.error(`❌ Error updating highlight ${highlight.id}:`, error.message)
      errors++
    }
  }

  console.log('\n📈 Migration Summary:')
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   ⏭️  Skipped (already enum): ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log('\n✨ Migration complete!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
