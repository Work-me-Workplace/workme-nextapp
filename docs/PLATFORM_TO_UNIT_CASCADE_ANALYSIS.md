# Platform to Platform Unit Cascade Analysis

## Summary

**YES - You first need a Platform, then you can create Platform Units for it.**

The relationship is a **one-to-many cascade**: 
- `CompanyPlatformProduct` (Platform) is the parent
- `CompanyPlatformUnit` (Platform Unit) is the child, referencing the platform via `platformProductId`

## Database Schema

From `prisma/schema.prisma`:

```prisma
model CompanyPlatformProduct {
  id        String   @id @default(cuid())
  // ... platform fields
  units     CompanyPlatformUnit[]  // One-to-many relationship
}

model CompanyPlatformUnit {
  id                String   @id @default(cuid())
  platformProductId String   // Required foreign key
  platformProduct   CompanyPlatformProduct @relation(fields: [platformProductId], references: [id], onDelete: Cascade)
  // ... unit fields (hullNumber, name, shipyard, status, etc.)
}
```

**Key Point**: `platformProductId` is required - you cannot create a unit without a platform.

## Current Implementation Flow

### 1. Platform Creation

**Option A: Create Platform Only**
- Route: `/api/company/products/platform/create`
- UI: Not currently implemented (only AI parse flow exists)
- Creates: `CompanyPlatformProduct` only

**Option B: Create Platform with Units (AI Parse)**
- Route: `/api/company/products/platform/create-with-units`
- UI: `/app/company/products/platform/new/page.tsx`
- Flow: 
  1. User pastes text (Wikipedia, CRS report, press release)
  2. AI parses to extract platform, units, and milestones
  3. User reviews and edits parsed data
  4. Creates platform + units + milestones in one transaction

### 2. Platform Unit Creation (After Platform Exists)

**API Route**: `/api/company/products/platform/unit/create`
- Requires: `platformProductId` (must exist)
- Optional fields: `hullNumber`, `name`, `block`, `shipyard`, `description`, `status`, `percentComplete`, `deliveryExpected`

**UI Status**: ⚠️ **MISSING**
- Platform detail page (`/company/products/platform/[id]/page.tsx`) has links to:
  - `/company/products/platform/${product.id}/unit/new` (lines 347, 383)
- **But this page does not exist!**

## Current User Flow

### Working Flow (AI Parse)
1. User goes to `/company/products/platform/new`
2. Pastes text and clicks "Parse with AI"
3. Reviews parsed platform + units + milestones
4. Clicks "Create Platform"
5. Platform and units are created together
6. Redirects to platform detail page

### Broken Flow (Manual Unit Creation)
1. User creates a platform (via AI parse or future manual form)
2. User views platform detail page
3. User clicks "Create Unit" button
4. **404 Error** - `/company/products/platform/[id]/unit/new` page doesn't exist

## Findings

### ✅ What Works
- Platform creation with units via AI parse
- Platform detail page displays existing units
- Unit detail page exists (`/company/products/platform/unit/[id]/page.tsx`)
- API route for creating units exists (`/api/company/products/platform/unit/create`)

### ❌ What's Missing
- **UI form/page for creating a unit after platform exists**
  - Should be at: `/app/company/products/platform/[id]/unit/new/page.tsx`
  - Should accept `platformProductId` from URL params
  - Should call `/api/company/products/platform/unit/create`
  - Should redirect to platform detail page after creation

### 🔍 Additional Notes
- The cascade is enforced at the database level (`onDelete: Cascade`)
- Units cannot exist without a platform (foreign key constraint)
- The platform detail page already has UI elements expecting this flow (buttons, empty states)

## Recommendations

1. **Create the missing unit creation page** at:
   `/app/company/products/platform/[id]/unit/new/page.tsx`

2. **Consider adding a manual platform creation form** (currently only AI parse exists)

3. **Consider allowing unit creation during platform creation** (currently only via AI parse)

4. **Verify the cascade behavior** - test that deleting a platform deletes all its units (should work due to `onDelete: Cascade`)








