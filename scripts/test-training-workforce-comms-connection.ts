/**
 * Shock Test: Training → WorkforceComms Connection
 * 
 * This script tests the integration between Trainings and WorkforceComms
 * by creating a dummy training, linking it to a WorkforceComms, and verifying
 * the connection works through the WorkOutput model.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testTrainingWorkforceCommsConnection() {
  console.log('🧪 Starting Training → WorkforceComms Connection Test\n')

  try {
    // Step 1: Get or create a test company and user
    console.log('Step 1: Setting up test data...')
    
    // Try to find an existing company for testing
    let testCompany = await prisma.company.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    if (!testCompany) {
      console.log('   ⚠️  No company found. Please create a company first.')
      return
    }

    // Try to find an existing user
    let testUser = await prisma.workMe.findFirst({
      where: { companyId: testCompany.id },
    })

    if (!testUser) {
      console.log('   ⚠️  No user found for company. Please create a user first.')
      return
    }

    console.log(`   ✅ Using company: ${testCompany.name}`)
    console.log(`   ✅ Using user: ${testUser.email}\n`)

    // Step 2: Create a dummy WorkforceComms item
    console.log('Step 2: Creating WorkforceComms item...')
    const workforceComms = await prisma.workforceComms.create({
      data: {
        type: 'email',
        name: 'Test Training Announcement',
        description: 'Test WorkforceComms for training integration',
        companyId: testCompany.id,
        originatorId: testUser.id,
      },
    })
    console.log(`   ✅ Created WorkforceComms: ${workforceComms.workforceCommsId}\n`)

    // Step 3: Create a WorkContextTraining (training)
    console.log('Step 3: Creating WorkContextTraining...')
    const training = await prisma.workContextTraining.create({
      data: {
        title: 'Test Training - Safety Protocols',
        description: 'This is a test training created for WorkforceComms integration',
        trainingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        mandatory: true,
        sponsoringOffice: 'Test Office',
        companyId: testCompany.id,
        originatorId: testUser.id,
      },
    })
    console.log(`   ✅ Created Training: ${training.id} - ${training.title}\n`)

    // Step 4: Create WorkEventRouter for the training
    console.log('Step 4: Creating WorkEventRouter for training...')
    const eventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'training',
        eventRefId: training.id,
        companyId: testCompany.id,
        originatorId: testUser.id,
      },
    })
    console.log(`   ✅ Created WorkEventRouter: ${eventRouter.id}\n`)

    // Step 5: Create WorkOutput linked to training router AND WorkforceComms
    console.log('Step 5: Creating WorkOutput linked to Training and WorkforceComms...')
    const workOutput = await prisma.workOutput.create({
      data: {
        eventRouterId: eventRouter.id,
        workforceCommsId: workforceComms.workforceCommsId,
        outputType: 'digital_signage',
        dataJson: {
          title: 'Training Announcement',
          message: 'Safety Protocols training scheduled',
          trainingDate: training.trainingDate,
        },
        status: 'draft',
        companyId: testCompany.id,
        originatorId: testUser.id,
      },
      include: {
        eventRouter: true,
        workforceComms: true,
      },
    })
    console.log(`   ✅ Created WorkOutput: ${workOutput.id}`)
    console.log(`   ✅ Linked to WorkforceComms: ${workOutput.workforceCommsId}`)
    console.log(`   ✅ Output Type: ${workOutput.outputType}\n`)

    // Step 6: Verify hydration - Query WorkOutput with all relations
    console.log('Step 6: Verifying hydration...')
    const hydratedOutput = await prisma.workOutput.findUnique({
      where: { id: workOutput.id },
      include: {
        eventRouter: {
          include: {
            supports: true,
          },
        },
        support: true,
        workforceComms: {
          include: {
            editions: true,
            drafts: true,
          },
        },
        company: true,
        originator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!hydratedOutput) {
      throw new Error('Failed to hydrate WorkOutput')
    }

    console.log('   ✅ WorkOutput hydrated successfully')
    console.log(`   ✅ Training Title: ${training.title}`)
    console.log(`   ✅ WorkforceComms Name: ${hydratedOutput.workforceComms?.name}`)
    console.log(`   ✅ Event Router Type: ${hydratedOutput.eventRouter?.type}\n`)

    // Step 7: Verify we can query by WorkforceComms
    console.log('Step 7: Verifying query by WorkforceComms...')
    const outputsByComms = await prisma.workOutput.findMany({
      where: {
        workforceCommsId: workforceComms.workforceCommsId,
      },
      include: {
        workforceComms: true,
        eventRouter: true,
      },
    })

    console.log(`   ✅ Found ${outputsByComms.length} output(s) linked to WorkforceComms`)
    if (outputsByComms.length > 0) {
      console.log(`   ✅ Output IDs: ${outputsByComms.map(o => o.id).join(', ')}\n`)
    }

    // Step 8: Verify we can query training outputs
    console.log('Step 8: Verifying query by Training (via EventRouter)...')
    const trainingOutputs = await prisma.workOutput.findMany({
      where: {
        eventRouterId: eventRouter.id,
      },
      include: {
        workforceComms: true,
        eventRouter: true,
      },
    })

    console.log(`   ✅ Found ${trainingOutputs.length} output(s) for training`)
    if (trainingOutputs.length > 0) {
      const outputWithComms = trainingOutputs.filter(o => o.workforceCommsId !== null)
      console.log(`   ✅ Outputs with WorkforceComms: ${outputWithComms.length}\n`)
    }

    // Step 9: Test reverse lookup - Get WorkforceComms with WorkOutputs
    console.log('Step 9: Verifying reverse lookup (WorkforceComms → WorkOutputs)...')
    const commsWithOutputs = await prisma.workforceComms.findUnique({
      where: { workforceCommsId: workforceComms.workforceCommsId },
      include: {
        workOutputs: {
          include: {
            eventRouter: true,
          },
        },
      },
    })

    if (commsWithOutputs) {
      console.log(`   ✅ WorkforceComms has ${commsWithOutputs.workOutputs.length} output(s)`)
      console.log(`   ✅ Output Types: ${commsWithOutputs.workOutputs.map(o => o.outputType).join(', ')}\n`)
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ SHOCK TEST PASSED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\nSummary:')
    console.log(`   Training: ${training.title} (${training.id})`)
    console.log(`   WorkforceComms: ${workforceComms.name} (${workforceComms.workforceCommsId})`)
    console.log(`   WorkOutput: ${workOutput.id} (${workOutput.outputType})`)
    console.log(`   Connection: ✅ WorkOutput.workforceCommsId = ${workOutput.workforceCommsId}\n`)

    console.log('🧹 Cleaning up test data...')
    // Optionally clean up - comment out if you want to keep test data
    // await prisma.workOutput.delete({ where: { id: workOutput.id } })
    // await prisma.workEventRouter.delete({ where: { id: eventRouter.id } })
    // await prisma.workContextTraining.delete({ where: { id: training.id } })
    // await prisma.workforceComms.delete({ where: { workforceCommsId: workforceComms.workforceCommsId } })
    console.log('   ℹ️  Test data preserved (uncomment cleanup code to remove)\n')

  } catch (error) {
    console.error('\n❌ SHOCK TEST FAILED')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testTrainingWorkforceCommsConnection()
  .then(() => {
    console.log('✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })

