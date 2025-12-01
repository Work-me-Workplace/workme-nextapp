/**
 * Script to lookup a user by Firebase ID
 * 
 * Usage: npx tsx scripts/lookup-user.ts <firebaseId>
 */

import { prisma } from '../lib/prisma'

async function lookupUser(firebaseId: string) {
  try {
    console.log(`🔍 Looking up user with firebaseId: ${firebaseId}`)

    // Try to find by firebaseId
    let workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
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

    if (workMe) {
      console.log('\n✅ User found by firebaseId:')
      console.log(JSON.stringify(workMe, null, 2))
      return workMe
    }

    console.log('\n❌ User not found by firebaseId')
    console.log('\n📊 Checking all users in database...')
    
    const allUsers = await prisma.workMe.findMany({
      take: 10,
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

    console.log(`\nFound ${allUsers.length} users in database:`)
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Firebase ID: ${user.firebaseId || '(none)'}`)
      console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`)
      console.log(`   Company Unit: ${user.companyUnit || '(none)'}`)
      console.log(`   Company Division: ${user.companyDivision || '(none)'}`)
      console.log(`   Created: ${user.createdAt}`)
    })

    return null
  } catch (error: any) {
    console.error('❌ Error looking up user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get firebaseId from command line args
const firebaseId = process.argv[2]

if (!firebaseId) {
  console.error('❌ Please provide a firebaseId as an argument')
  console.error('Usage: npx tsx scripts/lookup-user.ts <firebaseId>')
  process.exit(1)
}

lookupUser(firebaseId)
  .then(() => {
    console.log('\n✅ Lookup complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Lookup failed:', error)
    process.exit(1)
  })


