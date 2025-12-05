/**
 * Script to delete a user by ID, email, or Firebase ID
 * 
 * Usage: npx tsx scripts/delete-user.ts <identifier>
 */

import { prisma } from '../lib/prisma'

async function deleteUser(identifier: string) {
  try {
    console.log(`🔍 Looking for user: ${identifier}`)
    console.log('')

    // Try to find by ID first
    let workMe = await prisma.workMe.findUnique({
      where: { id: identifier },
      select: {
        id: true,
        email: true,
        firebaseId: true,
        // firstName, lastName, companyUnit, companyDivision removed - now in WorkProfile/WorkEntry
      },
    })

    // Try by email if not found by ID
    if (!workMe) {
      workMe = await prisma.workMe.findUnique({
        where: { email: identifier.toLowerCase().trim() },
        select: {
          id: true,
          email: true,
          firebaseId: true,
        },
      })
    }

    // Try by Firebase ID if still not found
    if (!workMe) {
      workMe = await prisma.workMe.findUnique({
        where: { firebaseId: identifier },
        select: {
          id: true,
          email: true,
          firebaseId: true,
        },
      })
    }

    if (!workMe) {
      console.error('❌ User not found')
      return
    }

    // Get profile and work entry for display
    const [profile, currentWorkEntry] = await Promise.all([
      prisma.workProfile.findUnique({
        where: { workMeId: workMe.id },
      }).catch(() => null),
      prisma.workEntry.findFirst({
        where: {
          workMeId: workMe.id,
          endDate: null,
        },
      }).catch(() => null),
    ])

    console.log('✅ Found user:')
    console.log(`   WorkMe ID: ${workMe.id}`)
    console.log(`   Email: ${workMe.email}`)
    console.log(`   Firebase ID: ${workMe.firebaseId || '(none)'}`)
    console.log(`   Email: ${workMe.email}`)
    console.log(`   Company: ${currentWorkEntry?.companyName || '(none)'}`)
    console.log(`   Title: ${currentWorkEntry?.title || '(none)'}`)
    console.log('')

    // Delete the user
    await prisma.workMe.delete({
      where: { id: workMe.id },
    })

    console.log('✅ User deleted successfully')
  } catch (error: any) {
    console.error('❌ Error deleting user:', error)
    if (error.code === 'P2025') {
      console.error('   Record not found')
    } else if (error.code === 'P2003') {
      console.error('   Foreign key constraint - user has related records that must be deleted first')
    }
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get identifier from command line
const identifier = process.argv[2]

if (!identifier) {
  console.error('❌ Please provide a user ID, email, or Firebase ID')
  console.error('Usage: npx tsx scripts/delete-user.ts <id|email|firebaseId>')
  process.exit(1)
}

deleteUser(identifier)
  .then(() => {
    console.log('\n✅ Delete complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Delete failed:', error)
    process.exit(1)
  })


