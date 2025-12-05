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
        createdAt: true,
      },
    })

    if (workMe) {
      // Get profile and work entry
      const [profile, currentWorkEntry] = await Promise.all([
        prisma.workProfile.findUnique({ where: { workMeId: workMe.id } }),
        prisma.workEntry.findFirst({
          where: { workMeId: workMe.id, endDate: null },
        }),
      ])
      
      const userData = {
        ...workMe,
        companyName: currentWorkEntry?.companyName || null,
        title: currentWorkEntry?.title || null,
      }
      
      console.log('\n✅ User found by firebaseId:')
      console.log(JSON.stringify(userData, null, 2))
      return userData
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
        createdAt: true,
      },
    })

    // Fetch profiles and work entries
    const usersWithData = await Promise.all(
      allUsers.map(async (user) => {
        const [profile, currentWorkEntry] = await Promise.all([
          prisma.workProfile.findUnique({ where: { workMeId: user.id } }),
          prisma.workEntry.findFirst({
            where: { workMeId: user.id, endDate: null },
          }).catch(() => null),
        ])
        return {
          ...user,
          companyName: currentWorkEntry?.companyName || null,
          title: currentWorkEntry?.title || null,
        }
      })
    )

    console.log(`\nFound ${usersWithData.length} users in database:`)
    usersWithData.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Firebase ID: ${user.firebaseId || '(none)'}`)
      console.log(`   Company: ${user.companyName || '(none)'}`)
      console.log(`   Title: ${user.title || '(none)'}`)
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


