import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { nanoid } from 'nanoid'

/**
 * POST /api/workme/companyunit
 * 
 * Set user's workspace (companyUnit) via registry
 * 
 * Body: { unitName: string | null }
 * 
 * Behavior:
 * - If name provided → upsert into CompanyUnitRegistry (public)
 * - If blank → generate unique private unit name
 * - Update WorkMe.companyUnit
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth (NextRequest extends Request, so this works)
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe Identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    
    // 3. Get unitName from body
    const body = await request.json()
    const { unitName } = body
    
    let finalUnitName: string
    
    if (unitName && unitName.trim()) {
      // User provided a name - upsert into registry (public)
      const normalizedName = unitName.trim()
      
      const registry = await prisma.companyUnitRegistry.upsert({
        where: { name: normalizedName },
        create: { 
          name: normalizedName, 
          visibility: 'public' 
        },
        update: {} // No update needed - just ensure it exists
      })
      
      finalUnitName = registry.name
      console.log('✅ Upserted public workspace:', finalUnitName)
    } else {
      // User left blank - generate unique private unit
      const generated = `unit_${nanoid(8)}`
      
      // Create registry entry with private visibility
      await prisma.companyUnitRegistry.create({
        data: { 
          name: generated, 
          visibility: 'private' 
        }
      })
      
      finalUnitName = generated
      console.log('✅ Generated private workspace:', finalUnitName)
    }
    
    // 4. Update WorkMe.companyUnit
    const updated = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        companyUnit: finalUnitName,
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
    
    console.log('✅ Updated WorkMe.companyUnit:', finalUnitName)
    
    return NextResponse.json({
      success: true,
      workMe: updated,
      unitName: finalUnitName,
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

