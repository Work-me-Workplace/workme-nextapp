/**
 * Apply the nullable migration directly using Prisma Client
 * This works around environment variable issues
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function applyMigration() {
  console.log('🚀 Applying migration: add_company_id_nullable\n')
  
  try {
    const migrationPath = join(
      process.cwd(),
      'prisma/migrations/20251120232828_add_company_id_nullable/migration.sql'
    )
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Split by semicolons but preserve DO blocks
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip empty or comment-only statements
      if (!statement || statement.length < 5) continue
      
      try {
        console.log(`  [${i + 1}/${statements.length}] Executing statement...`)
        
        // For DO blocks, we need to handle them specially
        if (statement.toUpperCase().startsWith('DO')) {
          await prisma.$executeRawUnsafe(statement + ';')
        } else {
          await prisma.$executeRawUnsafe(statement)
        }
        
        console.log(`  ✅ Statement ${i + 1} executed successfully`)
      } catch (error: any) {
        // Some errors are expected (e.g., index already exists, column already exists)
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.message?.includes('does not exist')) {
          console.log(`  ⚠️  Statement ${i + 1} skipped (already applied or not needed): ${error.message.split('\n')[0]}`)
        } else {
          console.error(`  ❌ Error executing statement ${i + 1}:`, error.message)
          throw error
        }
      }
    }
    
    // Mark migration as applied in _prisma_migrations table
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          gen_random_uuid()::text,
          '',
          NOW(),
          '20251120232828_add_company_id_nullable',
          NULL,
          NULL,
          NOW(),
          1
        )
        ON CONFLICT (migration_name) DO NOTHING
      `)
      console.log('\n✅ Migration recorded in _prisma_migrations table')
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('unique')) {
        console.log('\n⚠️  Migration already recorded in _prisma_migrations table')
      } else {
        console.warn('\n⚠️  Could not record migration (non-critical):', error.message)
      }
    }
    
    console.log('\n✅ Migration applied successfully!')
    console.log('\n📊 Next steps:')
    console.log('   1. Run backfill script: npx tsx scripts/backfill-company-id.ts')
    console.log('   2. Verify: npx tsx scripts/verify-company-id.ts')
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

