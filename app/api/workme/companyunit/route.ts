import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { nanoid } from 'nanoid'

/**
 * POST /api/workme/companyunit
 * 
 * Set user's workspace (companyUnit) and optional division via registry
 * Creates WorkEntry linking WorkMe to CompanyUnit
 * 
 * Body: { 
 *   unitName: string | null,  // Required: workspace name (or blank for auto-generated)
 *   division?: string | null   // Optional: division name
 * }
 * 
 * Behavior:
 * - If unitName provided → search/create CompanyUnit registry (public)
 * - If unitName blank → generate unique private unit name
 * - End any current WorkEntry (endDate = now)
 * - Create new WorkEntry with companyUnit and division
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth (NextRequest extends Request, so this works)
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe Identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    
    // 3. Get unitName and division from body
    const body = await request.json()
    const { unitName, division } = body
    
    let companyUnitRecord
    
    if (unitName && unitName.trim()) {
      // User provided a name - search or create CompanyUnit registry
      const normalizedName = unitName.trim()
      
      // Search-before-create pattern (like RaceRegistry)
      companyUnitRecord = await prisma.companyUnit.findFirst({
        where: {
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
        },
      })
      
      if (!companyUnitRecord) {
        companyUnitRecord = await prisma.companyUnit.create({
          data: {
          name: normalizedName, 
          },
        })
        console.log('✅ Created new CompanyUnit:', companyUnitRecord.name)
      } else {
        console.log('✅ Found existing CompanyUnit:', companyUnitRecord.name)
      }
    } else {
      // User left blank - generate unique private unit
      const generated = `unit_${nanoid(8)}`
      
      companyUnitRecord = await prisma.companyUnit.create({
        data: { 
          name: generated, 
        }
      })
      
      console.log('✅ Generated private workspace:', generated)
    }
    
    // 4. End any current work entries
    await prisma.workEntry.updateMany({
      where: {
        userId: workMeId,
        endDate: null, // Current job
      },
      data: {
        endDate: new Date(), // End current job
      },
    })
    
    // 5. Create new WorkEntry
    const workEntry = await prisma.workEntry.create({
      data: {
        userId: workMeId,
        companyUnitId: companyUnitRecord.id,
        division: division?.trim() || null,
        startDate: new Date(),
        endDate: null, // Current job
      },
      include: {
        companyUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    
    console.log('✅ Created WorkEntry:', {
      workEntryId: workEntry.id,
      companyUnit: companyUnitRecord.name,
      division: division?.trim() || null,
    })
    
    return NextResponse.json({
      success: true,
      workEntry: {
        id: workEntry.id,
        companyUnit: workEntry.companyUnit,
        division: workEntry.division,
        startDate: workEntry.startDate,
        endDate: workEntry.endDate,
      },
      unitName: companyUnitRecord.name,
      division: division?.trim() || null,
    })
  } catch (error: any) {
    console.error('❌ CompanyUnitSet error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to set company unit' 
      },
      { status: 500 },
    )
  }
}
