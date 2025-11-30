/**
 * Script to upsert a user by email and Firebase ID
 * 
 * Usage: npx tsx scripts/upsert-user.ts <email> <firebaseId>
 */

import { prisma } from '../lib/prisma'

async function upsertUser(email: string, firebaseId: string) {
  try {
    console.log(`🔍 Upserting user:`)
    console.log(`   Email: ${email}`)
    console.log(`   Firebase ID: ${firebaseId}\n`)

    // Try to find by email first
    let workMe = await prisma.workMe.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        companyUnit: true,
        companyDivision: true,
      },
    })

    if (workMe) {
      console.log('✅ Found existing user by email')
      console.log(`   WorkMe ID: ${workMe.id}`)
      console.log(`   Current Firebase ID: ${workMe.firebaseId || '(none)'}`)
      
      // Update with new Firebase ID
      workMe = await prisma.workMe.update({
        where: { id: workMe.id },
        data: {
          firebaseId,
        },
        select: {
          id: true,
          firebaseId: true,
          email: true,
          firstName: true,
          lastName: true,
          companyUnit: true,
          companyDivision: true,
        },
      })
      
      console.log(`\n✅ Updated user with new Firebase ID`)
      console.log(`   WorkMe ID: ${workMe.id}`)
      console.log(`   Email: ${workMe.email}`)
      console.log(`   Firebase ID: ${workMe.firebaseId}`)
      const fullName = `${workMe.firstName || ''} ${workMe.lastName || ''}`.trim() || '(no name)'
    console.log(`   Name: ${fullName}`)
      console.log(`   Company Unit: ${workMe.companyUnit || '(none)'}`)
      console.log(`   Company Division: ${workMe.companyDivision || '(none)'}`)
      
      return workMe
    }

    // Try to find by Firebase ID
    workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        companyUnit: true,
        companyDivision: true,
      },
    })

    if (workMe) {
      console.log('✅ Found existing user by Firebase ID')
      console.log(`   WorkMe ID: ${workMe.id}`)
      console.log(`   Current Email: ${workMe.email}`)
      
      // Update email if different
      if (workMe.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
        workMe = await prisma.workMe.update({
          where: { id: workMe.id },
          data: {
            email: email.toLowerCase().trim(),
          },
          select: {
            id: true,
            firebaseId: true,
            email: true,
            firstName: true,
            lastName: true,
            companyUnit: true,
            companyDivision: true,
          },
        })
        console.log(`\n✅ Updated email to: ${workMe.email}`)
      }
      
      return workMe
    }

    // Create new user
    console.log('📝 Creating new user...')
    workMe = await prisma.workMe.create({
      data: {
        firebaseId,
        email: email.toLowerCase().trim(),
        firstName: 'Adam',
        lastName: 'Cole',
      },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        companyUnit: true,
        companyDivision: true,
      },
    })

    console.log(`\n✅ Created new user:`)
    console.log(`   WorkMe ID: ${workMe.id}`)
    console.log(`   Email: ${workMe.email}`)
    console.log(`   Firebase ID: ${workMe.firebaseId}`)
    const fullName = `${workMe.firstName || ''} ${workMe.lastName || ''}`.trim() || '(no name)'
    console.log(`   Name: ${fullName}`)
    
    return workMe
  } catch (error: any) {
    console.error('❌ Error upserting user:', error)
    if (error.code === 'P2002') {
      console.error('   Unique constraint violation - email or firebaseId already exists')
    }
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get email and firebaseId from command line args
const email = process.argv[2]
const firebaseId = process.argv[3]

if (!email || !firebaseId) {
  console.error('❌ Please provide both email and firebaseId as arguments')
  console.error('Usage: npx tsx scripts/upsert-user.ts <email> <firebaseId>')
  process.exit(1)
}

upsertUser(email, firebaseId)
  .then(() => {
    console.log('\n✅ Upsert complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Upsert failed:', error)
    process.exit(1)
  })

