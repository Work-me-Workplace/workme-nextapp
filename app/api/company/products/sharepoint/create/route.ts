import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // Load WorkMe identity to get companyId
    const workMe = await loadWorkMe(firebaseId)
    
    // Get companyId from URL params or use WorkMe's companyId
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId') || workMe.companyId
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      )
    }
    
    // Validate that the requested companyId matches the user's companyId for security
    if (companyId !== workMe.companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: companyId does not match user\'s company' },
        { status: 403 }
      )
    }

    const { name, description, siteUrl, siteType, owner, accessLevel, lastSyncDate, notes } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const product = await prisma.companyProductSharepoint.create({
      data: {
        name,
        description: description || null,
        siteUrl: siteUrl || null,
        siteType: siteType || null,
        owner: owner || null,
        accessLevel: accessLevel || null,
        lastSyncDate: lastSyncDate ? new Date(lastSyncDate) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('Failed to create sharepoint product:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
