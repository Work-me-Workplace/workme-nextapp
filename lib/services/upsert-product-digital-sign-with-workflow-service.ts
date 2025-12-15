/**
 * Upsert Product Digital Sign With Workflow Service
 * 
 * WORKFLOW-OPS ARCHITECTURE:
 * 
 * - ProductDigitalSign is the canonical product record (the anchor)
 * - Typed product variants (CompanyEvent, CompanyNews, Workforce, WorkforceAchievement) 
 *   define meaning via 1:1 relationship with ProductDigitalSign via digitalSignId
 * - Variants contain only domain-specific fields (no assets, no workflow state)
 * - DesignWorkPackage represents assigned human work
 * - A work package is "assigned" to a digital product by setting digitalSignId
 * - Assets attach directly to ProductDigitalSign (not work packages)
 * 
 * This orchestration function:
 * 1. Creates or updates ProductDigitalSign (product is the anchor)
 * 2. Upserts the correct typed variant (keyed by digitalSignId)
 * 3. Optionally creates a DesignWorkPackage if workflow is requested
 * 
 * Rules:
 * - Product creation/upsert happens first
 * - Variant upsert happens second (keyed by digitalSignId)
 * - Work package creation is optional and last
 * - This wiring supports future workflow ops (approvals, promotion, publishing) without refactor
 */

import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'

export type VariantType = 
  | 'WORKFORCE_ACHIEVEMENT'
  | 'COMPANY_NEWS'
  | 'WORKFORCE'
  | 'COMPANY_EVENT'

export interface UpsertProductDigitalSignWithWorkflowInput {
  // Product-level data
  product: {
    id?: string // If provided, will update existing; otherwise creates new
    signType: DigitalSignType
    companyUnit?: string | null
    createdByWorkMeId: string
    archivedAt?: Date | null
  }

  // Variant type and data
  variantType: VariantType
  variantData: 
    | {
        headline: string
        subhead?: string | null
        factualStatement?: string | null
        quote?: string | null
        quoteAttribution?: string | null
        runtimeGuidance?: string | null
        imageAssetId?: string | null
        employeeId?: string | null
        highlightId?: string | null
      }
    | {
        headline: string
        subheadline?: string | null
        body?: string | null
        link?: string | null
      }
    | {
        title: string
        summary?: string | null
        bullets?: string[] | null
        icon?: string | null
        background?: string | null
        footerNote?: string | null
      }
    | {
        eventName: string
        eventDate?: Date | string | null
        startTime?: string | null
        endTime?: string | null
        location?: string | null
        description?: string | null
        perks?: string[] | null
        registrationLink?: string | null
      }

  // Optional asset IDs to attach to the product
  assetIds?: string[]

  // Optional work package creation
  createWorkPackage?: {
    purpose?: string
    assignedToWorkMeId?: string | null
    dueDate?: Date | null
    title?: string
    description?: string
  }
}

export interface UpsertProductDigitalSignWithWorkflowResult {
  product: {
    id: string
    signType: DigitalSignType
    companyUnit: string | null
    createdAt: Date
    updatedAt: Date
    archivedAt: Date | null
    workforceAchievement?: any
    companyNews?: any
    workforce?: any
    companyEvent?: any
    assetAttachments: Array<{
      id: string
      assetId: string
      asset: any
    }>
  }
  workPackage?: {
    id: string
    digitalSignId: string
    status: string
    title: string | null
    description: string | null
  }
}

/**
 * Upsert a ProductDigitalSign with its typed variant and optionally create a work package.
 * 
 * This is the single orchestration point for product creation/updates with workflow support.
 */
export async function upsertProductDigitalSignWithWorkflow(
  input: UpsertProductDigitalSignWithWorkflowInput
): Promise<UpsertProductDigitalSignWithWorkflowResult> {
  const { product, variantType, variantData, assetIds = [], createWorkPackage } = input

  // Validate variant type matches sign type
  const variantTypeToSignType: Record<VariantType, DigitalSignType> = {
    'WORKFORCE_ACHIEVEMENT': 'WORKFORCE_ACHIEVEMENT',
    'COMPANY_NEWS': 'COMPANY_NEWS',
    'WORKFORCE': 'WORKFORCE',
    'COMPANY_EVENT': 'COMPANY_EVENT',
  }
  const expectedSignType = variantTypeToSignType[variantType]
  if (product.signType !== expectedSignType) {
    throw new Error(
      `Variant type ${variantType} does not match sign type ${product.signType}`
    )
  }

  // Step 1: Create or update ProductDigitalSign (product is the anchor)
  const productData: any = {
    signType: product.signType,
    companyUnit: product.companyUnit || null,
    createdByWorkMeId: product.createdByWorkMeId,
    updatedAt: new Date(),
    ...(product.archivedAt !== undefined && { archivedAt: product.archivedAt }),
  }

  const signage = product.id
    ? await prisma.productDigitalSign.update({
        where: { id: product.id },
        data: productData,
      })
    : await prisma.productDigitalSign.create({
        data: {
          ...productData,
          createdAt: new Date(),
        },
      })

  // Step 2: Upsert the typed variant (keyed by digitalSignId)
  // Variants are 1:1 with ProductDigitalSign, so we use upsert pattern
  let variant: any

  switch (variantType) {
    case 'WORKFORCE_ACHIEVEMENT': {
      const data = variantData as {
        headline: string
        subhead?: string | null
        factualStatement?: string | null
        quote?: string | null
        quoteAttribution?: string | null
        runtimeGuidance?: string | null
        imageAssetId?: string | null
        employeeId?: string | null
        highlightId?: string | null
      }
      variant = await prisma.productDigitalSignWorkforceAchievement.upsert({
        where: { digitalSignId: signage.id },
        update: {
          headline: data.headline,
          subhead: data.subhead || null,
          factualStatement: data.factualStatement || null,
          quote: data.quote || null,
          quoteAttribution: data.quoteAttribution || null,
          runtimeGuidance: data.runtimeGuidance || null,
          imageAssetId: data.imageAssetId || null,
          employeeId: data.employeeId || null,
          highlightId: data.highlightId || null,
        },
        create: {
          digitalSignId: signage.id,
          headline: data.headline,
          subhead: data.subhead || null,
          factualStatement: data.factualStatement || null,
          quote: data.quote || null,
          quoteAttribution: data.quoteAttribution || null,
          runtimeGuidance: data.runtimeGuidance || null,
          imageAssetId: data.imageAssetId || null,
          employeeId: data.employeeId || null,
          highlightId: data.highlightId || null,
        },
      })
      break
    }

    case 'COMPANY_NEWS': {
      const data = variantData as {
        headline: string
        subheadline?: string | null
        body?: string | null
        link?: string | null
      }
      variant = await prisma.productDigitalSignCompanyNews.upsert({
        where: { digitalSignId: signage.id },
        update: {
          headline: data.headline,
          subheadline: data.subheadline || null,
          body: data.body || null,
          link: data.link || null,
        },
        create: {
          digitalSignId: signage.id,
          headline: data.headline,
          subheadline: data.subheadline || null,
          body: data.body || null,
          link: data.link || null,
        },
      })
      break
    }

    case 'WORKFORCE': {
      const data = variantData as {
        title: string
        summary?: string | null
        bullets?: string[] | null
        icon?: string | null
        background?: string | null
        footerNote?: string | null
      }
      variant = await prisma.productDigitalSignWorkforce.upsert({
        where: { digitalSignId: signage.id },
        update: {
          title: data.title,
          summary: data.summary || null,
          bullets: data.bullets || [],
          icon: data.icon || null,
          background: data.background || null,
          footerNote: data.footerNote || null,
        },
        create: {
          digitalSignId: signage.id,
          title: data.title,
          summary: data.summary || null,
          bullets: data.bullets || [],
          icon: data.icon || null,
          background: data.background || null,
          footerNote: data.footerNote || null,
        },
      })
      break
    }

    case 'COMPANY_EVENT': {
      const data = variantData as {
        eventName: string
        eventDate?: Date | string | null
        startTime?: string | null
        endTime?: string | null
        location?: string | null
        description?: string | null
        perks?: string[] | null
        registrationLink?: string | null
      }
      variant = await prisma.productDigitalSignCompanyEvent.upsert({
        where: { digitalSignId: signage.id },
        update: {
          eventName: data.eventName,
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          location: data.location || null,
          description: data.description || null,
          perks: data.perks || [],
          registrationLink: data.registrationLink || null,
        },
        create: {
          digitalSignId: signage.id,
          eventName: data.eventName,
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          location: data.location || null,
          description: data.description || null,
          perks: data.perks || [],
          registrationLink: data.registrationLink || null,
        },
      })
      break
    }

    default:
      throw new Error(`Unknown variant type: ${variantType}`)
  }

  // Step 3: Attach assets to product (assets attach to product, not work package)
  if (assetIds.length > 0) {
    // Verify assets exist
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds },
      },
    })

    if (assets.length !== assetIds.length) {
      throw new Error('Some asset IDs not found')
    }

    // Create DigitalSignAsset links (skip duplicates)
    await prisma.digitalSignAsset.createMany({
      data: assetIds.map(assetId => ({
        assetId,
        digitalSignId: signage.id,
      })),
      skipDuplicates: true,
    })
  }

  // Step 4: Optionally create work package (work assignment is explicit, not inferred)
  let workPackage: any = undefined
  if (createWorkPackage) {
    workPackage = await prisma.designWorkPackage.create({
      data: {
        digitalSignId: signage.id,
        createdByWorkMeId: product.createdByWorkMeId,
        assignedToWorkMeId: createWorkPackage.assignedToWorkMeId || null,
        title: createWorkPackage.title || createWorkPackage.purpose || `Work for ${signage.id}`,
        description: createWorkPackage.description || null,
        status: 'PENDING',
      },
    })
  }

  // Step 5: Fetch complete product with variant and assets
  const completeSignage = await prisma.productDigitalSign.findUnique({
    where: { id: signage.id },
    include: {
      workforceAchievement: true,
      companyNews: true,
      workforce: true,
      companyEvent: true,
      assetAttachments: {
        include: {
          asset: true,
        },
      },
    },
  })

  if (!completeSignage) {
    throw new Error('Failed to retrieve created/updated signage')
  }

  return {
    product: {
      id: completeSignage.id,
      signType: completeSignage.signType,
      companyUnit: completeSignage.companyUnit,
      createdAt: completeSignage.createdAt,
      updatedAt: completeSignage.updatedAt,
      archivedAt: completeSignage.archivedAt,
      workforceAchievement: completeSignage.workforceAchievement,
      companyNews: completeSignage.companyNews,
      workforce: completeSignage.workforce,
      companyEvent: completeSignage.companyEvent,
      assetAttachments: completeSignage.assetAttachments.map(att => ({
        id: att.id,
        assetId: att.assetId,
        asset: att.asset,
      })),
    },
    ...(workPackage && {
      workPackage: {
        id: workPackage.id,
        digitalSignId: workPackage.digitalSignId,
        status: workPackage.status,
        title: workPackage.title,
        description: workPackage.description,
      },
    }),
  }
}
