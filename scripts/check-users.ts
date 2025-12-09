import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.workMe.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        email: true,
        firebaseId: true,
        handle: true,
        createdAt: true,
      },
    })

    console.log(`\n📊 Found ${users.length} user(s) in WorkMe table:\n`)
    
    if (users.length === 0) {
      console.log('❌ No users found - database was reset and user data was lost')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email || 'No email'}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Firebase ID: ${user.firebaseId || 'None'}`)
        console.log(`   Handle: ${user.handle || 'None'}`)
        console.log(`   Created: ${user.createdAt}`)
        console.log('')
      })
    }

    const total = await prisma.workMe.count()
    console.log(`Total users in database: ${total}\n`)
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()

