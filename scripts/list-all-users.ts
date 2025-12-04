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
        createdAt: true,
      },
    })

    // Fetch profiles and work entries for all users
    const usersWithData = await Promise.all(
      users.map(async (user) => {
        const [profile, currentWorkEntry] = await Promise.all([
          prisma.workProfile.findUnique({
            where: { userId: user.id },
          }),
          prisma.workEntry.findFirst({
            where: {
              userId: user.id,
              endDate: null,
            },
            include: {
              companyUnit: {
                select: {
                  name: true,
                },
              },
            },
          }),
        ])
        return {
          ...user,
          firstName: profile?.firstName || null,
          lastName: profile?.lastName || null,
          companyUnit: currentWorkEntry?.companyUnit.name || null,
          companyDivision: currentWorkEntry?.division || null,
        }
      })
    )

    console.log(`Found ${usersWithData.length} user(s) in database:\n`)
    console.log('='.repeat(80))

    usersWithData.forEach((user, index) => {
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


