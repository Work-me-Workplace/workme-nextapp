/**
 * Clear all data from ProductDigitalSignWorkforceAchievement table
 * 
 * This script deletes all records from ProductDigitalSignWorkforceAchievement
 * to allow for schema changes via db push.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Deleting all ProductDigitalSignWorkforceAchievement records...')
  
  const count = await prisma.productDigitalSignWorkforceAchievement.count()
  console.log(`   Found ${count} records to delete`)
  
  if (count > 0) {
    const result = await prisma.productDigitalSignWorkforceAchievement.deleteMany({})
    console.log(`✅ Deleted ${result.count} records`)
  } else {
    console.log('   No records to delete')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
