# Workflow-Ops Digital Signage Architecture

## Overview

This document describes the workflow-ops architecture for digital signage products. This architecture standardizes the workflow model and supports future workflow operations (approvals, promotion, publishing) without refactor.

## Core Principles

1. **Product is the Anchor**: `ProductDigitalSign` is the canonical product record
2. **Variants Define Meaning**: Typed product variants provide domain-specific fields
3. **Work Assignment = Work Package**: `DesignWorkPackage` represents assigned human work
4. **Assets Attach to Product Only**: Assets attach directly to `ProductDigitalSign`, not work packages
5. **Explicit Workflow**: Workflow is explicit, not inferred

## Architecture Components

### 1. ProductDigitalSign (The Anchor)

The canonical product record. All other entities reference this.

```prisma
model ProductDigitalSign {
  id         String    @id @default(cuid())
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  archivedAt DateTime? // When archived, null if active

  signType DigitalSignType
  companyUnit       String?
  createdByWorkMeId String  @db.Uuid

  // Typed variants (1:1 relationships)
  workforce            ProductDigitalSignWorkforce?
  companyNews          ProductDigitalSignCompanyNews?
  workforceAchievement ProductDigitalSignWorkforceAchievement?
  companyEvent         ProductDigitalSignCompanyEvent?

  // Asset attachments (assets attach to product, not work packages)
  assetAttachments DigitalSignAsset[]

  // Design work packages (a product may have zero, one, or many)
  designPackages DesignWorkPackage[]
}
```

**Key Points:**
- Products are outcomes
- Products can exist without work packages
- Products can have multiple work packages over time

### 2. Typed Product Variants

Each variant has a 1:1 relationship with `ProductDigitalSign` via `digitalSignId`.

**Variant Types:**
- `ProductDigitalSignWorkforce`
- `ProductDigitalSignCompanyNews`
- `ProductDigitalSignWorkforceAchievement`
- `ProductDigitalSignCompanyEvent`

**Rules:**
- Variants contain only domain-specific fields
- No assets in variants (assets attach to product)
- No workflow state in variants (workflow is in work packages)
- Variants are keyed by `digitalSignId` (unique constraint)

```prisma
model ProductDigitalSignWorkforceAchievement {
  id           String @id @default(cuid())
  digitalSignId String @unique // 1:1 with ProductDigitalSign

  headline         String
  subhead          String?
  factualStatement String?
  quote            String?
  quoteAttribution String?
  runtimeGuidance  String?
  imageAssetId     String? // Direct FK to Asset (for variant-specific image)
  employeeId       String?
  highlightId      String?

  signage ProductDigitalSign @relation(fields: [digitalSignId], references: [id], onDelete: Cascade)
}
```

### 3. DesignWorkPackage (Work Assignment)

Represents assigned human work on a digital product.

```prisma
model DesignWorkPackage {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  createdByWorkMeId  String                  @db.Uuid
  assignedToWorkMeId String?                 @db.Uuid
  status             DesignWorkPackageStatus @default(PENDING)

  // Work assignment: link to the digital product this work is for
  digitalSignId String?
  signage       ProductDigitalSign? @relation(fields: [digitalSignId], references: [id], onDelete: SetNull)

  title       String?
  description String?

  // NO asset attachments - assets attach to product only
}
```

**Key Points:**
- Work packages are effort, not outcomes
- A work package is "assigned" to a product by setting `digitalSignId`
- A product may have zero, one, or many work packages over time
- No separate assignment table needed
- Assets do NOT attach to work packages

### 4. Asset System

Assets attach directly to `ProductDigitalSign`, not to work packages.

```prisma
model Asset {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  url         String
  filename    String?
  size        Int?
  contentType String?
  type        String?
  tags        String[]

  // Relations
  digitalSignAttachments DigitalSignAsset[]
  // NO workPackageAttachments
}

model DigitalSignAsset {
  id           String @id @default(cuid())
  assetId      String
  digitalSignId String

  asset   Asset              @relation(fields: [assetId], references: [id])
  signage ProductDigitalSign @relation(fields: [digitalSignId], references: [id])

  @@unique([assetId, digitalSignId])
}
```

**Draft vs Final:**
- Represented via metadata on assets (e.g. `stage`, `active`, or similar)
- Not via separate attachment systems
- All assets attach to the product

## Upsert Pattern

The system uses a single orchestration function for product creation/updates:

```typescript
upsertProductDigitalSignWithWorkflow({
  product: {
    id?: string, // If provided, updates existing; otherwise creates new
    signType: DigitalSignType,
    companyUnit?: string | null,
    createdByWorkMeId: string,
    archivedAt?: Date | null,
  },
  variantType: 'WORKFORCE_ACHIEVEMENT' | 'COMPANY_NEWS' | 'WORKFORCE' | 'COMPANY_EVENT',
  variantData: { /* variant-specific fields */ },
  assetIds?: string[], // Assets to attach to product
  createWorkPackage?: {
    purpose?: string,
    assignedToWorkMeId?: string | null,
    dueDate?: Date | null,
    title?: string,
    description?: string,
  },
})
```

**Orchestration Order:**
1. Product creation/upsert happens first
2. Variant upsert happens second (keyed by `digitalSignId`)
3. Asset attachment happens third
4. Work package creation is optional and last

## Workflow Operations

This architecture supports future workflow operations:

- **Approvals**: Work packages track approval state
- **Promotion**: Assets can be marked as "final" via metadata
- **Publishing**: Products can be published/archived
- **Assignment**: Work packages explicitly link to products

## Non-Goals (Explicitly Avoided)

1. ❌ **No generic Artifact model** - Products are specific to digital signage
2. ❌ **No assets on work packages** - Assets attach to products only
3. ❌ **No duplicate product identity in variants** - Variants reference product via `digitalSignId`
4. ❌ **No inferred workflow** - Workflow is explicit via work packages

## Migration Notes

### Field Name Changes
- `DesignWorkPackage.signageId` → `DesignWorkPackage.digitalSignId`
- Variant models: `signageId` → `digitalSignId`
- `DigitalSignAsset.signageId` → `DigitalSignAsset.digitalSignId`

### Removed Models
- `DesignWorkPackageAsset` - Removed (assets attach to product only)

### Removed Fields
- `DesignWorkPackage.assetAttachments` - Removed
- `Asset.workPackageAttachments` - Removed

## Usage Examples

### Creating a Product with Work Package

```typescript
import { upsertProductDigitalSignWithWorkflow } from '@/lib/services/upsert-product-digital-sign-with-workflow-service'

const result = await upsertProductDigitalSignWithWorkflow({
  product: {
    signType: 'WORKFORCE_ACHIEVEMENT',
    companyUnit: 'SEA 05',
    createdByWorkMeId: userId,
  },
  variantType: 'WORKFORCE_ACHIEVEMENT',
  variantData: {
    headline: 'Sarah Johnson — Leadership Recognition',
    subhead: 'Congratulations, Sarah!',
    employeeId: 'emp-123',
    highlightId: 'hl-456',
  },
  assetIds: ['asset-789'],
  createWorkPackage: {
    assignedToWorkMeId: designerId,
    title: 'Design final assets',
    description: 'Create final design assets for this achievement sign',
  },
})
```

### Attaching Assets to Product

```typescript
import { attachAssetToDigitalSign } from '@/lib/assets/attachments'

// Assets attach to product, not work package
await attachAssetToDigitalSign('asset-123', 'product-456')
```

### Creating Work Package for Existing Product

```typescript
const workPackage = await prisma.designWorkPackage.create({
  data: {
    digitalSignId: productId, // Link to product
    createdByWorkMeId: userId,
    assignedToWorkMeId: designerId,
    title: 'Design work',
    status: 'PENDING',
  },
})
```

## Summary

**Mental Model:**
- "There is one digital product. Sometimes we do work on it. Sometimes we don't. When we do, that's a work package. Everything else is detail."

**Key Distinctions:**
- **Products** = Outcomes
- **Work Packages** = Effort
- **Variants** = Meaning
- **Assets** = Attach to products only

This architecture is workflow-ready and supports future operations without refactor.
