/**
 * Script to list all users in the database
 */

import { prisma } from '../lib/prisma'

async function listAllUsers() {
  try {
    console.log('🔍 Fetching all users from database...\n')

    const users = await prisma.workMe.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firebaseId: true,
        firstName: true,
        lastName: true,
        companyUnit: true,
        companyDivision: true,
        createdAt: true,
      },
    })

    console.log(`Found ${users.length} user(s) in database:\n`)
    console.log('='.repeat(80))

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Record`)
      console.log(`   WorkMe ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Firebase ID: ${user.firebaseId || '(none)'}`)
      console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || '(no name)')
      console.log(`   Company Unit: ${user.companyUnit || '(none)'}`)
      console.log(`   Company Division: ${user.companyDivision || '(none)'}`)
      console.log(`   Created: ${user.createdAt.toISOString()}`)
      console.log('-'.repeat(80))
    })

    return users
  } catch (error: any) {
    console.error('❌ Error listing users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

listAllUsers()
  .then(() => {
    console.log('\n✅ List complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })

