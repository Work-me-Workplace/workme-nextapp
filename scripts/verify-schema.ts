import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function verifySchema() {
  console.log('\n🔍 Verifying Database Schema...\n')

  try {
    // 1. Check WorkMe.id is UUID
    const workMeIdType = await prisma.$queryRaw<Array<{ data_type: string }>>`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'WorkMe' AND column_name = 'id'
    `
    
    if (workMeIdType[0]?.data_type === 'uuid') {
      console.log('✅ WorkMe.id is UUID')
    } else {
      console.log(`❌ WorkMe.id is ${workMeIdType[0]?.data_type} (expected UUID)`)
    }

    // 2. Check all foreign keys to WorkMe.id are UUID
    const fkColumns = await prisma.$queryRaw<Array<{ table_name: string; column_name: string; data_type: string }>>`
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type
      FROM information_schema.columns c
      JOIN information_schema.table_constraints tc 
        ON c.table_name = tc.table_name
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'WorkMe'
        AND ccu.column_name = 'id'
        AND (c.column_name LIKE '%workMeId%' OR c.column_name LIKE '%createdByWorkMeId%' OR c.column_name = 'userId')
      ORDER BY c.table_name, c.column_name
    `

    console.log(`\n📋 Found ${fkColumns.length} foreign key columns referencing WorkMe.id:`)
    let allCorrect = true
    for (const fk of fkColumns) {
      if (fk.data_type === 'uuid') {
        console.log(`  ✅ ${fk.table_name}.${fk.column_name} is UUID`)
      } else {
        console.log(`  ❌ ${fk.table_name}.${fk.column_name} is ${fk.data_type} (expected UUID)`)
        allCorrect = false
      }
    }

    // 3. Check for any TEXT foreign keys (should be none)
    const textFks = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
      SELECT DISTINCT
        c.table_name,
        c.column_name
      FROM information_schema.columns c
      JOIN information_schema.table_constraints tc 
        ON c.table_name = tc.table_name
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'WorkMe'
        AND ccu.column_name = 'id'
        AND c.data_type = 'text'
    `

    if (textFks.length === 0) {
      console.log('\n✅ No TEXT foreign keys found (all are UUID)')
    } else {
      console.log(`\n❌ Found ${textFks.length} TEXT foreign keys:`)
      textFks.forEach(fk => {
        console.log(`  - ${fk.table_name}.${fk.column_name}`)
      })
      allCorrect = false
    }

    // 4. Verify schema sync
    const dbPushResult = execSync('npx prisma db push --skip-generate', { encoding: 'utf-8' })
    if (dbPushResult.includes('in sync')) {
      console.log('\n✅ Database schema is in sync with Prisma schema')
    } else {
      console.log('\n⚠️  Schema may not be fully in sync')
    }

    // 5. Summary
    console.log('\n' + '='.repeat(50))
    if (allCorrect && workMeIdType[0]?.data_type === 'uuid') {
      console.log('✅ VERIFICATION PASSED: All foreign keys are UUID')
    } else {
      console.log('❌ VERIFICATION FAILED: Some issues found')
    }
    console.log('='.repeat(50) + '\n')

  } catch (error) {
    console.error('❌ Verification error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifySchema()

