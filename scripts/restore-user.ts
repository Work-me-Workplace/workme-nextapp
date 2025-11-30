/**
 * Script to restore/create a user account
 * 
 * Usage: npx tsx scripts/restore-user.ts <email> <firebaseId> [firstName] [lastName]
 */

import { prisma } from '../lib/prisma'

function formatName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const parts = [firstName, lastName].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '(no name)'
}

async function restoreUser(
  email: string,
  firebaseId: string,
  firstName?: string,
  lastName?: string
) {
  try {
    console.log('🔍 Restoring user:')
    console.log(`   Email: ${email}`)
    console.log(`   Firebase ID: ${firebaseId}`)
    if (firstName || lastName) {
      console.log(`   Name: ${formatName(firstName, lastName)}`)
    }
    console.log('')

    // Check if user exists by email
    let workMe = await prisma.workMe.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        firebaseId: true,
        firstName: true,
        lastName: true,
        companyUnit: true,
        companyDivision: true,
      },
    })

    if (workMe) {
      console.log('✅ User already exists by email')
      console.log(`   WorkMe ID: ${workMe.id}`)
      console.log(`   Current Firebase ID: ${workMe.firebaseId || '(none)'}`)
      
      // Update Firebase ID if different
      if (workMe.firebaseId !== firebaseId) {
        workMe = await prisma.workMe.update({
          where: { id: workMe.id },
          data: {
            firebaseId,
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
          },
          select: {
            id: true,
            email: true,
            firebaseId: true,
            firstName: true,
            lastName: true,
            companyUnit: true,
            companyDivision: true,
          },
        })
        console.log('\n✅ Updated user with Firebase ID and name')
      } else {
        // Just update name if provided
        if (firstName || lastName) {
          workMe = await prisma.workMe.update({
            where: { id: workMe.id },
            data: {
              ...(firstName && { firstName }),
              ...(lastName && { lastName }),
            },
            select: {
              id: true,
              email: true,
              firebaseId: true,
              firstName: true,
              lastName: true,
              companyUnit: true,
              companyDivision: true,
            },
          })
          console.log('\n✅ Updated user name')
        }
      }
      
      console.log(`   WorkMe ID: ${workMe.id}`)
      console.log(`   Email: ${workMe.email}`)
      console.log(`   Firebase ID: ${workMe.firebaseId}`)
      console.log(`   Name: ${formatName(workMe.firstName, workMe.lastName)}`)
      console.log(`   Company Unit: ${workMe.companyUnit || '(none)'}`)
      console.log(`   Company Division: ${workMe.companyDivision || '(none)'}`)
      
      return workMe
    }

    // Check if user exists by Firebase ID
    workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        email: true,
        firebaseId: true,
        firstName: true,
        lastName: true,
        companyUnit: true,
        companyDivision: true,
      },
    })

    if (workMe) {
      console.log('✅ User already exists by Firebase ID')
      console.log(`   WorkMe ID: ${workMe.id}`)
      console.log(`   Current Email: ${workMe.email}`)
      
      // Update email if different
      if (workMe.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
        workMe = await prisma.workMe.update({
          where: { id: workMe.id },
          data: {
            email: email.toLowerCase().trim(),
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
          },
          select: {
            id: true,
            email: true,
            firebaseId: true,
            firstName: true,
            lastName: true,
            companyUnit: true,
            companyDivision: true,
          },
        })
        console.log('\n✅ Updated email and name')
      } else if (firstName || lastName) {
        workMe = await prisma.workMe.update({
          where: { id: workMe.id },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
          },
          select: {
            id: true,
            email: true,
            firebaseId: true,
            firstName: true,
            lastName: true,
            companyUnit: true,
            companyDivision: true,
          },
        })
        console.log('\n✅ Updated name')
      }
      
      return workMe
    }

    // Create new user
    console.log('📝 Creating new user...')
    workMe = await prisma.workMe.create({
      data: {
        firebaseId,
        email: email.toLowerCase().trim(),
        firstName: firstName || 'Adam',
        lastName: lastName || 'Cole',
      },
      select: {
        id: true,
        email: true,
        firebaseId: true,
        firstName: true,
        lastName: true,
        companyUnit: true,
        companyDivision: true,
      },
    })

    console.log('\n✅ Created new user:')
    console.log(`   WorkMe ID: ${workMe.id}`)
    console.log(`   Email: ${workMe.email}`)
    console.log(`   Firebase ID: ${workMe.firebaseId}`)
    console.log(`   Name: ${formatName(workMe.firstName, workMe.lastName)}`)
    console.log(`   Company Unit: ${workMe.companyUnit || '(none)'}`)
    console.log(`   Company Division: ${workMe.companyDivision || '(none)'}`)
    
    return workMe
  } catch (error: any) {
    console.error('❌ Error restoring user:', error)
    if (error.code === 'P2002') {
      console.error('   Unique constraint violation - email or firebaseId already exists')
      console.error('   This means the user exists but with different credentials')
    }
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get arguments from command line
const email = process.argv[2]
const firebaseId = process.argv[3]
const firstName = process.argv[4]
const lastName = process.argv[5]

if (!email || !firebaseId) {
  console.error('❌ Please provide email and firebaseId as arguments')
  console.error('Usage: npx tsx scripts/restore-user.ts <email> <firebaseId> [firstName] [lastName]')
  process.exit(1)
}

restoreUser(email, firebaseId, firstName, lastName)
  .then(() => {
    console.log('\n✅ Restore complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Restore failed:', error)
    process.exit(1)
  })
