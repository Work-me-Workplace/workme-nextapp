"use server"

/**
 * Migration script to convert WorkContext.type from String to ContextType enum
 * 
 * IMPORTANT: This script must be run before deploying the new schema.
 * It will:
 * 1. Verify all existing type values are valid enum values
 * 2. Update the database schema to use the enum
 * 
 * Run manually with: npx tsx lib/server/migrate-context-type.ts
 */

import { prisma } from "@/lib/prisma"

const VALID_TYPES = [
  'campaign',
  'impact_event',
  'training',
  'event',
  'community',
  'benefits',
  'career',
  'employee_cause',
] as const

async function migrateContextType() {
  console.log('🔍 Checking existing WorkContext types...')
  
  // Get all unique type values
  const contexts = await prisma.workEventRouter.findMany({
    select: { type: true },
    distinct: ['type'],
  })

  const existingTypes = contexts.map(c => c.type as string)
  console.log('Found types:', existingTypes)

  // Check for invalid types
  const invalidTypes = existingTypes.filter(t => !VALID_TYPES.includes(t as any))
  if (invalidTypes.length > 0) {
    console.error('❌ Invalid types found:', invalidTypes)
    console.error('Cannot migrate - fix invalid types first')
    process.exit(1)
  }

  console.log('✅ All existing types are valid enum values')
  console.log('')
  console.log('📝 Next steps:')
  console.log('1. The enum has been added to the Prisma schema')
  console.log('2. Run: npx prisma migrate dev --name convert_context_type_to_enum')
  console.log('   OR if you need to force reset (⚠️ DESTROYS DATA):')
  console.log('   npx prisma db push --force-reset')
  console.log('')
  console.log('⚠️  If you have existing data, you may need to:')
  console.log('   - Create a custom migration SQL script')
  console.log('   - Or accept data loss with --force-reset')
}

migrateContextType()
  .then(() => {
    console.log('✅ Migration check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration check failed:', error)
    process.exit(1)
  })

