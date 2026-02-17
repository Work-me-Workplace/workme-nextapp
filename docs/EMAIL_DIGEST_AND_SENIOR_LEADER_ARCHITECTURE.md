# Email Digest & Senior Leader Email Architecture

**Created:** 2026-02-17  
**Status:** 🔍 **INVESTIGATION** - Understanding current state before refactoring

---

## 🎯 Overview

There are **THREE separate email-related systems** in the codebase:

1. **EmailDigestItem** - Recurring/enduring email digests (newsletters)
2. **OneOffEmailItem** / **WorkForceOneOffEmailDigest** - One-off email digests (unclear purpose)
3. **ProductSeniorLeaderEmail** - Product artifact for "what did the boss say"

This document clarifies what each system does and proposes a refactoring plan.

---

## 📋 System 1: EmailDigestItem (Recurring/Enduring Email Digests)

### Current State

**Purpose:** Recurring email newsletters that can be reused across multiple editions

**Current Schema:**
```prisma
model EmailDigestItem {
  id String @id @default(cuid())
  
  // The morphed, formatted content (what matters!)
  formattedContent Json // { title, body, cta, ctaUrl, imageUrl, ... }
  
  // Source reference (NOT foreign keys, just for tracking) ⚠️ DEPRECATED
  sourceType String? // "CompanyEvent" | "CompanyCampaign" | "CompanyTraining" | "manual" | etc
  sourceId   String? // UUID of source (for reference only)
  
  // Status lifecycle
  status String @default("DRAFT") // DRAFT | READY | ARCHIVED
  
  // Ownership
  companyId         String
  createdByWorkMeId String   @db.Uuid
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Many-to-many with editions via junction table
  editionItems EmailDigestEditionItem[]
  
  @@index([companyId])
  @@index([status])
  @@index([sourceType])
  @@index([createdByWorkMeId])
}
```

**Current Issues:**
- ❌ Uses `sourceType`/`sourceId` (deprecated, not real FKs)
- ❌ No FK to `EmailDigestEdition` (only via junction table)
- ❌ No FK to workforcestuff (CompanyX models)

**Documentation:** See `docs/EMAIL_DIGEST_CORRECT_ARCHITECTURE.md`

**UX Flow:**
- User creates items from workforcestuff or manual entry
- Items are formatted with AI
- Items are reused across multiple editions
- Editions compile items together

---

## 📋 System 2: OneOffEmailItem / WorkForceOneOffEmailDigest

### Current State

**Purpose:** ⚠️ **UNCLEAR** - One-off email digests (non-recurring)

**Current Schema:**
```prisma
model WorkForceOneOffEmailDigest {
  id                String   @id @default(uuid())
  title             String
  companyId         String
  createdByWorkMeId String   @db.Uuid
  createdAt         DateTime @default(now())

  status      OneOffEmailStatus @default(DRAFT)
  contentJson Json? // Generated content (null until GENERATED)

  createdBy WorkMe            @relation("OneOffEmailCreator", fields: [createdByWorkMeId], references: [id], onDelete: Cascade)
  items     OneOffEmailItem[]

  @@index([companyId])
  @@index([createdByWorkMeId])
  @@index([status])
  @@index([createdAt])
}

model OneOffEmailItem {
  id            String                     @id @default(cuid())
  oneOffEmail   WorkForceOneOffEmailDigest @relation(fields: [oneOffEmailId], references: [id], onDelete: Cascade)
  oneOffEmailId String

  // Link to one CompanyX model (one of these will be set) ✅ HAS FKs
  companyEventId            String?
  companyCampaignId         String?
  companyTrainingId         String?
  companyBenefitsId         String?
  companyImpactEventId      String?
  companyImpactEventId      String?
  companyCommunityId        String?
  companyCareerId           String?
  companyEmployeeCauseId    String?
  companyLeaderEngagementId String?

  // Relations (nullable)
  companyEvent            CompanyEvent?            @relation("OneOffEmailItemEvent", fields: [companyEventId], references: [id], onDelete: Cascade)
  companyCampaign         CompanyCampaign?         @relation("OneOffEmailItemCampaign", fields: [companyCampaignId], references: [id], onDelete: Cascade)
  companyTraining         CompanyTraining?         @relation("OneOffEmailItemTraining", fields: [companyTrainingId], references: [id], onDelete: Cascade)
  // ... etc

  order     Int // Display order in email
  notes     String? // User notes for this item
  createdAt DateTime @default(now())

  @@index([oneOffEmailId])
  @@index([companyEventId])
  // ... etc
}
```

**Current Issues:**
- ⚠️ **Purpose unclear** - What is this actually used for?
- ⚠️ **Name confusing** - "OneOffEmail" doesn't clearly indicate purpose
- ✅ Has proper FK relationships to workforcestuff (CompanyX models)
- ❌ Currently checked in `product-status` route (may be wrong)

**Usage Found:**
- ✅ UI page exists: `app/workforce/enduring/email-digest/one-off/new/page.tsx` (but NOT IMPLEMENTED - shows "Coming Soon")
- ✅ Referenced in `app/api/workforcestuff/[id]/product-status/route.ts`
- ❌ No API routes found creating/using this model (TODO: Implement)
- 📚 Documented in `docs/EMAIL_DIGEST_HIERARCHY.md` as separate from recurring series

**Purpose (from docs):**
- One-off email digests (not part of a recurring series)
- Single email container (no parent series, no editions)
- Same structure as edition items but standalone
- Perfect for special announcements or ad-hoc updates

**Questions:**
1. ✅ **ANSWERED:** It's for one-off email digests (not recurring)
2. ❓ Should this be renamed to "SeniorLeaderEmail"? (Unclear - ProductSeniorLeaderEmail already exists)
3. ❓ Should this be merged with ProductSeniorLeaderEmail? (They seem to serve different purposes)

---

## 📋 System 3: ProductSeniorLeaderEmail

### Current State

**Purpose:** Product artifact for "what did the boss say" - captures senior leader emails

**Current Schema:**
```prisma
model ProductSeniorLeaderEmail {
  id                String   @id @default(cuid())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  archivedAt        DateTime?
  companyUnit       String?
  createdByWorkMeId String   @db.Uuid

  content ProductSeniorLeaderEmailContent?
  topics  SeniorLeaderTopic[]

  createdBy WorkMe @relation("ProductSeniorLeaderEmailCreator", fields: [createdByWorkMeId], references: [id], onDelete: Cascade)

  @@index([createdByWorkMeId])
  @@index([archivedAt])
}

model ProductSeniorLeaderEmailContent {
  id                      String                  @id @default(cuid())
  seniorLeaderEmailProductId String              @unique
  seniorLeaderEmailProduct   ProductSeniorLeaderEmail @relation(fields: [seniorLeaderEmailProductId], references: [id], onDelete: Cascade)

  title             String?
  actualSubjectLine String?
  content           String // Full pasted text, untouched
  role              SeniorLeaderRole // Role enum - user selects this first
  companyEmployeeId String? // FK to CompanyEmployee - The actual person selected after role lookup

  companyEmployee CompanyEmployee? @relation("SeniorLeaderEmailEmployee", fields: [companyEmployeeId], references: [id], onDelete: SetNull)

  @@index([seniorLeaderEmailProductId])
  @@index([companyEmployeeId])
}
```

**Current State:**
- ✅ Clear purpose: "what did the boss say"
- ✅ Has role enum + person lookup
- ✅ Has topic parsing
- ❌ **No FK to workforcestuff** - doesn't link to CompanyX items
- ✅ Documented in `docs/SENIOR_LEADER_EMAIL_FLOW.md`

**UX Flow:**
- User pastes email content from senior leader
- Selects role (enum)
- Looks up person by role
- System parses topics
- Creates product artifact

**Questions:**
1. Should this link to workforcestuff (CompanyX items)?
2. Is this the same as OneOffEmailItem or different?

---

## 🔍 Investigation: What Should OneOffEmailItem Be?

### Hypothesis 1: OneOffEmailItem = Senior Leader Email System

**Evidence:**
- Name suggests "one-off" (non-recurring)
- Has FK to workforcestuff (CompanyX models)
- Currently checked in product-status route
- Comment says "Non-recurring"

**If true:**
- Should be renamed to `SeniorLeaderEmailItem` / `SeniorLeaderEmailDigest`
- Should have FK to workforcestuff (already has this ✅)
- Should NOT be checked in product-status route (that's for regular email digests)

### Hypothesis 2: OneOffEmailItem = Legacy/Unused System

**Evidence:**
- No UI pages found
- No API routes found creating it
- Only referenced in product-status route (which may be wrong)

**If true:**
- Should be deprecated/removed
- Product-status route should check EmailDigestItem instead

### Hypothesis 3: OneOffEmailItem = Different from ProductSeniorLeaderEmail

**Evidence:**
- ProductSeniorLeaderEmail = product artifact (what boss said)
- OneOffEmailItem = email digest item (content for email)

**If true:**
- They serve different purposes
- Need to clarify the relationship

---

## 🎯 Proposed Refactoring Plan

### Step 1: Clarify OneOffEmailItem Purpose

**Action Items:**
1. ✅ Search codebase for all usages
2. ✅ Check if any UI uses it
3. ✅ Check if any API routes create it
4. ❓ **NEED TO ANSWER:** What is this actually for?

### Step 2: Refactor EmailDigestItem

**Proposed Changes:**
```prisma
model EmailDigestItem {
  id String @id @default(cuid())
  
  // The morphed, formatted content (what matters!)
  formattedContent Json // { title, body, cta, ctaUrl, imageUrl, ... }
  
  // ✅ ADD: FK to workforcestuff (one of these will be set)
  companyEventId            String?
  companyCampaignId         String?
  companyTrainingId         String?
  companyBenefitsId         String?
  companyImpactEventId      String?
  companyCommunityId        String?
  companyCareerId           String?
  companyEmployeeCauseId    String?
  companyLeaderEngagementId String?
  
  // ✅ ADD: Relations to workforcestuff
  companyEvent            CompanyEvent?            @relation("EmailDigestItemEvent", fields: [companyEventId], references: [id], onDelete: SetNull)
  companyCampaign         CompanyCampaign?         @relation("EmailDigestItemCampaign", fields: [companyCampaignId], references: [id], onDelete: SetNull)
  // ... etc
  
  // ❌ REMOVE: Deprecated sourceType/sourceId
  // sourceType String?
  // sourceId   String?
  
  // Status lifecycle
  status String @default("DRAFT") // DRAFT | READY | ARCHIVED
  
  // Ownership
  companyId         String
  createdByWorkMeId String   @db.Uuid
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Many-to-many with editions via junction table
  editionItems EmailDigestEditionItem[]
  
  @@index([companyId])
  @@index([status])
  @@index([createdByWorkMeId])
  @@index([companyEventId])
  @@index([companyCampaignId])
  // ... etc
}
```

**Migration Steps:**
1. Add FK fields to EmailDigestItem
2. Migrate existing `sourceType`/`sourceId` data to FK fields (if possible)
3. Remove `sourceType`/`sourceId` fields
4. Update all code that uses `sourceType`/`sourceId`

### Step 3: Refactor OneOffEmailItem → SeniorLeaderEmailItem

**Proposed Changes:**
```prisma
// ❌ REMOVE: WorkForceOneOffEmailDigest
// ❌ REMOVE: OneOffEmailItem

// ✅ ADD: SeniorLeaderEmailDigest
model SeniorLeaderEmailDigest {
  id                String   @id @default(uuid())
  title             String
  companyId         String
  createdByWorkMeId String   @db.Uuid
  createdAt         DateTime @default(now())

  status      SeniorLeaderEmailStatus @default(DRAFT)
  contentJson Json? // Generated content (null until GENERATED)

  createdBy WorkMe            @relation("SeniorLeaderEmailCreator", fields: [createdByWorkMeId], references: [id], onDelete: Cascade)
  items     SeniorLeaderEmailItem[]

  @@index([companyId])
  @@index([createdByWorkMeId])
  @@index([status])
  @@index([createdAt])
}

// ✅ ADD: SeniorLeaderEmailItem
model SeniorLeaderEmailItem {
  id            String                     @id @default(cuid())
  seniorLeaderEmail   SeniorLeaderEmailDigest @relation(fields: [seniorLeaderEmailId], references: [id], onDelete: Cascade)
  seniorLeaderEmailId String

  // ✅ KEEP: FK to workforcestuff (one of these will be set)
  companyEventId            String?
  companyCampaignId         String?
  companyTrainingId         String?
  companyBenefitsId         String?
  companyImpactEventId      String?
  companyCommunityId        String?
  companyCareerId           String?
  companyEmployeeCauseId    String?
  companyLeaderEngagementId String?

  // Relations (nullable)
  companyEvent            CompanyEvent?            @relation("SeniorLeaderEmailItemEvent", fields: [companyEventId], references: [id], onDelete: Cascade)
  // ... etc

  order     Int // Display order in email
  notes     String? // User notes for this item
  createdAt DateTime @default(now())

  @@index([seniorLeaderEmailId])
  @@index([companyEventId])
  // ... etc
}
```

**Migration Steps:**
1. Rename `WorkForceOneOffEmailDigest` → `SeniorLeaderEmailDigest`
2. Rename `OneOffEmailItem` → `SeniorLeaderEmailItem`
3. Rename `oneOffEmailId` → `seniorLeaderEmailId`
4. Update all code references
5. Update product-status route to NOT check this (it's for senior leaders, not regular email digests)

### Step 4: Update Product-Status Route

**Current (WRONG):**
```typescript
// Email Digest - Check OneOffEmailItem (has FK relationships)
prisma.oneOffEmailItem.findFirst({
  where: whereClause,
  select: { id: true, oneOffEmailId: true },
}).then(r => ({
  productTypeId: 'email_digest',
  exists: !!r,
  productId: r?.oneOffEmailId || r?.id,
})),
```

**Proposed (CORRECT):**
```typescript
// Email Digest - Check EmailDigestItem (has FK relationships after refactor)
prisma.emailDigestItem.findFirst({
  where: whereClause,
  select: { id: true },
}).then(r => ({
  productTypeId: 'email_digest',
  exists: !!r,
  productId: r?.id,
})),
```

---

## ❓ Open Questions

1. **What is OneOffEmailItem actually used for?**
   - Is it used anywhere in the UI?
   - Is it used anywhere in the API?
   - Should it be deprecated or refactored?

2. **Should ProductSeniorLeaderEmail link to workforcestuff?**
   - Currently it doesn't have FK to CompanyX models
   - Should it? Or is it intentionally separate?

3. **What's the relationship between:**
   - `EmailDigestItem` (recurring newsletters)
   - `OneOffEmailItem` (one-off emails?)
   - `ProductSeniorLeaderEmail` (boss emails)

4. **Should product-status route check:**
   - `EmailDigestItem` for regular email digests?
   - `OneOffEmailItem`/`SeniorLeaderEmailItem` for senior leader emails?
   - Both?

---

## 📝 Next Steps

1. **Investigate OneOffEmailItem usage** - Search codebase, check UI, check API routes
2. **Clarify purpose** - Understand what OneOffEmailItem is actually for
3. **Decide on refactoring** - Based on investigation, decide:
   - Rename OneOffEmailItem → SeniorLeaderEmailItem?
   - Deprecate OneOffEmailItem?
   - Keep separate?
4. **Add FKs to EmailDigestItem** - Add FK fields to workforcestuff
5. **Update product-status route** - Fix to check correct models
6. **Create migration** - Database migration for schema changes

---

## 📚 Related Documentation

- `docs/EMAIL_DIGEST_CORRECT_ARCHITECTURE.md` - EmailDigestItem architecture
- `docs/SENIOR_LEADER_EMAIL_FLOW.md` - ProductSeniorLeaderEmail flow
- `docs/EMAIL_DIGEST_UX_FLOWS_PROPOSAL.md` - UX flows

---

**Status:** 🔍 **INVESTIGATION IN PROGRESS**  
**Next Action:** Need to clarify OneOffEmailItem purpose before proceeding with refactoring
