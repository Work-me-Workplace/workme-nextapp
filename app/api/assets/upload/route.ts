import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'
import { downloadAndSaveImage, generateHashedFilename } from '@/lib/holiday/storage'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/assets/upload
 * Upload an asset (from URL or file)
 */
export async function POST(request: Request) {
  try {
    await verifyAuth(request)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const url = formData.get('url') as string | null
    const category = formData.get('category') as string
    const holidaySlug = formData.get('holidaySlug') as string | null

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category is required',
        },
        { status: 400 },
      )
    }

    const validCategories = ['holiday', 'workforce', 'shipyard', 'general']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Category must be one of: ${validCategories.join(', ')}`,
        },
        { status: 400 },
      )
    }

    let assetUrl: string
    let fileName: string

    if (file) {
      // Handle file upload
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate filename
      fileName = generateHashedFilename(file.name, file.name)
      const { path, publicUrl } = await downloadAndSaveImage(
        `data:${file.type};base64,${buffer.toString('base64')}`,
        category,
        file.name,
      )

      // Save file to disk
      const { writeFile } = await import('fs/promises')
      const { join } = await import('path')
      const { ensureCategoryDirectory } = await import('@/lib/holiday/storage')
      await ensureCategoryDirectory(category)
      const filePath = join(process.cwd(), 'public', 'assets', category, fileName)
      await writeFile(filePath, buffer)

      assetUrl = publicUrl
    } else if (url) {
      // Handle URL upload
      const result = await downloadAndSaveImage(url, category)
      assetUrl = result.publicUrl
      fileName = result.filename
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Either file or url is required',
        },
        { status: 400 },
      )
    }

    // Create database entry
    const asset = await prisma.asset.create({
      data: {
        url: assetUrl,
        fileName: fileName,
        category,
        holidaySlug: holidaySlug || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: asset,
    })
  } catch (error: any) {
    console.error('❌ POST /api/assets/upload error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload asset',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

