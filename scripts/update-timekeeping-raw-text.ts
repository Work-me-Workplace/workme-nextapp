/**
 * Update Timekeeping Guidance CompanyImpactEvent with full raw text
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FULL_RAW_TEXT = `Below is the guidance for the Christmas and New Year's Day holidays.

 

** The Following Timekeeping Guidance is applicable to NAVSEA General Fund (HQ/PEO/DRPMs and applicable General Fund Field Activities) ONLY **

 

PP Dec 16 - Dec 27: Christmas is Thursday, Dec. 25. so SEA10 is directing early submission/approval of time and attendance.  To support the upcoming Christmas Holiday, all NAVSEA HQ/PEOs and General Fund Field Activity (if applicable) employees must enter their time and attendance in ERP NO LATER THAN 1600 Monday, Dec 22.  Supervisors must validate/approve all time by 1500 Tuesday Dec. 23. We will not have Dec 29th to process missing/unapproved time.

 

PP Dec 28 - Jan 10: New Year's Day is Thursday, Jan. 1. so SEA10 is highly encouraging proactive submission/approval of time and attendance through Jan 10. due to planned absences and extended leave.  Supervisors may start to validate/approve all time by Dec 29th.

 

DRP employees should have time approved through Dec 31.

 

Please ensure that Dec. 25 and Jan 1 are coded correctly with LH.`

async function main() {
  console.log('🔍 Finding Timekeeping Guidance CompanyImpactEvent...')

  // Find the timekeeping item
  const items = await prisma.companyImpactEvent.findMany({
    where: {
      title: {
        contains: 'Timekeeping',
        mode: 'insensitive',
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (items.length === 0) {
    console.log('❌ No timekeeping items found')
    return
  }

  console.log(`✅ Found ${items.length} timekeeping item(s)`)
  
  for (const item of items) {
    console.log(`\n📝 Updating: ${item.title}`)
    console.log(`   ID: ${item.id}`)
    console.log(`   Current raw text: ${item.ingestRawText ? 'EXISTS' : 'MISSING'}`)

    const updated = await prisma.companyImpactEvent.update({
      where: { id: item.id },
      data: {
        ingestRawText: FULL_RAW_TEXT,
      },
    })

    console.log(`✅ Updated! Raw text now: ${updated.ingestRawText?.substring(0, 50)}...`)
  }

  console.log('\n🎉 Done!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
