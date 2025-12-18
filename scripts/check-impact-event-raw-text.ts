import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const events = await prisma.companyImpactEvent.findMany({
    where: { title: { contains: 'Timekeeping', mode: 'insensitive' } },
    select: {
      id: true,
      title: true,
      summary: true,
      ingestRawText: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })
  
  console.log('Found', events.length, 'timekeeping events:\n')
  events.forEach(e => {
    console.log('---')
    console.log('ID:', e.id)
    console.log('Title:', e.title)
    console.log('Summary:', e.summary?.substring(0, 100) + '...')
    console.log('Raw Text Status:', e.ingestRawText ? `✅ ${e.ingestRawText.length} chars` : '❌ NULL/MISSING')
    if (e.ingestRawText && e.ingestRawText.length > 0) {
      console.log('First 200 chars:', e.ingestRawText.substring(0, 200) + '...')
    }
    console.log()
  })
  
  await prisma.$disconnect()
}

check().catch(console.error)
