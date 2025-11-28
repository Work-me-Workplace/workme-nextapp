# Work.me Architecture: Products, Outputs, and WorkforceComms

**Last Updated:** 2025-11-26  
**Status:** Post-Refactor Architecture Documentation

---

## 🎯 EXECUTIVE SUMMARY

**What we call "outputs" are actually PRODUCTS:**
- **`WorkCommsProduct`** = The unified product model (NEW, canonical)
- **`WorkforceComms`** = Legacy 3-layer email system (kept for backward compatibility)
- **`EventItem`** = Event-specific items (replaced PromotionalWorkItem)

**Key Relationship:**
```
CompanyX Models → CompanyWorkLink → WorkCommsProduct
```

---

## 📦 PRODUCT ARCHITECTURE

### 1. WorkCommsProduct (NEW - Canonical)

**Model:** `WorkCommsProduct`  
**Purpose:** Unified wrapper for all work communication products/outputs  
**Status:** ✅ Active, use this for new products

#### Structure
```prisma
model WorkCommsProduct {
  id          String               @id @default(uuid())
  type        WorkCommsProductType // email, poster, ntk, digital_sign, etc.
  data        Json?                // Product-specific data
  metadata    Json?                // Additional metadata
  createdById String               // Who created it
  createdAt   DateTime             @default(now())
  
  companyId  String
  company    Company @relation(...)
  originator WorkMe  @relation(...)
  
  links CompanyWorkLink[]  // Links to CompanyX models
}
```

#### Product Types
```typescript
enum WorkCommsProductType {
  email           // Email product
  poster          // Print poster
  ntk             // Need to Know
  digital_sign    // Digital signage
  exec_email      // Executive email
  flyer           // Print flyer
  sharepoint      // SharePoint update
  photo_video     // Photo/video content
  talking_points  // Talking points document
}
```

#### How It Works
1. **Create Product:** User creates a `WorkCommsProduct` with a specific `type`
2. **Link to CompanyX:** Create a `CompanyWorkLink` connecting the product to a `CompanyX` model (event, campaign, training, etc.)
3. **Store Data:** Product-specific data stored in `data` JSON field
4. **Display:** Products shown in MyWork → WorkComms view, grouped by CompanyX via links

#### Example Flow
```typescript
// 1. Create a poster product
const product = await prisma.workCommsProduct.create({
  data: {
    type: 'poster',
    data: { title: 'Event Poster', design: '...' },
    companyId: 'company-123',
    createdById: 'user-456',
  }
})

// 2. Link it to a CompanyEvent
await prisma.companyWorkLink.create({
  data: {
    companyEventId: 'event-789',
    workCommsProductId: product.id,
    companyId: 'company-123',
  }
})
```

---

### 2. WorkforceComms (LEGACY - Backward Compatibility)

**Model:** `WorkforceComms` (3-layer system)  
**Purpose:** Legacy email generation system for recurring workforce communications  
**Status:** ⚠️ Kept for backward compatibility, but new products should use `WorkCommsProduct`

#### The 3-Layer Architecture

**Layer 1: Product (`WorkforceComms`)**
- Stable, reusable product definitions
- Example: "Need to Know" email product
- Fields: `workforceCommsId`, `type`, `name`, `description`

**Layer 2: Draft (`WorkforceCommsDraft`)**
- Staging container before GPT generation
- Contains: `eventRouterIds` (DEPRECATED - use CompanyWorkLink), `authorNotes`, `whatChanged`, `status`
- **Note:** `eventRouterIds` is deprecated - should use `CompanyWorkLink` instead

**Layer 3: Edition (`WorkforceCommsEdition`)**
- Immutable generated emails (final output)
- Fields: `subject`, `body`, `sentAt`

#### Relationship to WorkCommsProduct

**Current State:**
- `WorkforceComms` is a **separate system** from `WorkCommsProduct`
- They serve different purposes:
  - `WorkforceComms` = Recurring email generation workflow
  - `WorkCommsProduct` = General product/output wrapper

**Future Migration:**
- `WorkforceComms` could potentially be migrated to use `WorkCommsProduct` as the base
- For now, they coexist

---

### 3. EventItem (Event-Specific Items)

**Model:** `EventItem`  
**Purpose:** Items attached to events (replaced PromotionalWorkItem)  
**Status:** ✅ Active

#### Structure
```prisma
model EventItem {
  id          String       @id @default(cuid())
  eventId     String       // FK to CompanyEvent
  event       CompanyEvent @relation(...)
  title       String
  description String?
  metadata    Json?        // Stores promotional fields (name, type, headline, etc.)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

#### Usage
- **Promotional items** for events stored as `EventItem` with promotional data in `metadata`
- **Agenda items** for events stored as `EventItem` with agenda data
- **Any event-specific structured data** can be stored as `EventItem`

---

## 🔗 LINKING ARCHITECTURE

### CompanyWorkLink (Junction Table)

**Purpose:** The ONLY way to link `CompanyX` models to `WorkCommsProduct`

#### Structure
```prisma
model CompanyWorkLink {
  id String @id @default(uuid())
  
  // One of these will be set (links to CompanyX model)
  companyEventId       String?
  companyTrainingId   String?
  companyBenefitsId   String?
  companyCampaignId   String?
  companyImpactEventId String?
  companyCommunityId   String?
  companyCareerId      String?
  companyEmployeeCauseId String?
  
  // Always set (links to product)
  workCommsProductId String
  workCommsProduct   WorkCommsProduct @relation(...)
  
  companyId String
  company   Company @relation(...)
  
  createdAt DateTime @default(now())
}
```

#### How It Works
1. **One CompanyX model** (e.g., `CompanyEvent`) links to **one WorkCommsProduct**
2. **One WorkCommsProduct** can link to **multiple CompanyX models** (via multiple `CompanyWorkLink` rows)
3. **All links are scoped to a company** (`companyId`)

#### Example
```typescript
// Link a poster product to an event
await prisma.companyWorkLink.create({
  data: {
    companyEventId: 'event-123',
    workCommsProductId: 'product-456',
    companyId: 'company-789',
  }
})

// Link the same product to a campaign (multi-link)
await prisma.companyWorkLink.create({
  data: {
    companyCampaignId: 'campaign-111',
    workCommsProductId: 'product-456', // Same product
    companyId: 'company-789',
  }
})
```

---

## 🏢 COMPANYX MODELS

### What Are CompanyX Models?

**CompanyX** = All company-level happenings/events:
- `CompanyEvent` - Company events
- `CompanyCampaign` - Company campaigns
- `CompanyTraining` - Training programs
- `CompanyBenefits` - Benefits enrollment windows
- `CompanyImpactEvent` - Impact events (disruptions)
- `CompanyCommunity` - Community engagement
- `CompanyCareer` - Career development
- `CompanyEmployeeCause` - Employee causes/drives

### Relationship to Products

**All CompanyX models have:**
```prisma
links CompanyWorkLink[]  // Links to WorkCommsProduct
```

**Flow:**
1. User creates a `CompanyEvent` (e.g., "Holiday Party")
2. User creates a `WorkCommsProduct` (e.g., poster)
3. System creates a `CompanyWorkLink` connecting them
4. Product appears in MyWork → WorkComms, grouped by event

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPANYX MODELS                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Company  │  │ Company  │  │ Company  │  │ Company  │  │
│  │  Event   │  │ Campaign │  │ Training │  │ Benefits │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │          │
│       └─────────────┴─────────────┴─────────────┘          │
│                      │                                      │
│                      ▼                                      │
│            ┌──────────────────────┐                         │
│            │  CompanyWorkLink     │                         │
│            │  (Junction Table)    │                         │
│            └──────────┬───────────┘                         │
│                       │                                      │
│                       ▼                                      │
│            ┌──────────────────────┐                         │
│            │  WorkCommsProduct    │                         │
│            │  (Unified Products)  │                         │
│            └──────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              LEGACY SYSTEM (Backward Compat)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         WorkforceComms (3-Layer Email System)         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Product  │→ │  Draft   │→ │ Edition  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│  Note: eventRouterIds deprecated, should use CompanyWorkLink│
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 PRODUCT CREATION FLOW

### Standard Flow (New Products)

1. **User Action:** "Create poster for this event"
2. **Create Product:**
   ```typescript
   const product = await prisma.workCommsProduct.create({
     data: {
       type: 'poster',
       data: { /* poster data */ },
       companyId,
       createdById: workMeId,
     }
   })
   ```
3. **Create Link:**
   ```typescript
   await prisma.companyWorkLink.create({
     data: {
       companyEventId: eventId,
       workCommsProductId: product.id,
       companyId,
     }
   })
   ```
4. **Display:** Product appears in MyWork → WorkComms, grouped by event

### Legacy Flow (WorkforceComms)

1. **User Action:** "Generate Need to Know email"
2. **Create/Select Product:** Get or create `WorkforceComms` product
3. **Create Draft:**
   ```typescript
   await prisma.workforceCommsDraft.create({
     data: {
       workforceCommsId: productId,
       eventRouterIds: [...], // DEPRECATED
       authorNotes: '...',
       status: 'drafting',
     }
   })
   ```
4. **Generate Edition:** GPT generates email from draft
5. **Send:** Mark edition as sent

---

## 🔍 KEY DIFFERENCES

### WorkCommsProduct vs WorkforceComms

| Aspect | WorkCommsProduct | WorkforceComms |
|--------|------------------|----------------|
| **Purpose** | Unified product wrapper | Recurring email generation |
| **Architecture** | Single model | 3-layer (Product → Draft → Edition) |
| **Linking** | Via `CompanyWorkLink` | Via `eventRouterIds` (deprecated) |
| **Status** | ✅ New, canonical | ⚠️ Legacy, backward compat |
| **Use For** | All new products | Only email generation workflow |

### Products vs Outputs

**Terminology:**
- **"Products"** = What we call them in the codebase (`WorkCommsProduct`)
- **"Outputs"** = Legacy terminology (from old `WorkOutput` model, now deleted)
- **Recommendation:** Use "products" going forward

---

## 📁 FILE STRUCTURE

### Product-Related Files

**Server Actions:**
- `lib/actions/workforce-comms.ts` - WorkforceComms 3-layer system
- `lib/actions/work-output.ts` - Legacy (references deleted `WorkOutput` model)

**API Routes:**
- `app/api/workforce-comms/generate/route.ts` - Generate email editions
- `app/api/workforce-comms/*` - WorkforceComms management

**Pages:**
- `app/workforce-comms/[productId]/drafts/[draftId]/page.tsx` - Draft editor
- `app/mywork/outputs/*` - Product viewing (legacy naming)

---

## 🚨 DEPRECATED / DELETED MODELS

### Deleted Models
- ❌ `WorkOutput` - Replaced by `WorkCommsProduct`
- ❌ `WorkSupport` - Removed entirely
- ❌ `WorkEventRouter` - Removed, CompanyX models accessed directly
- ❌ `PromotionalWorkItem` - Replaced by `EventItem`

### Deprecated Fields
- ⚠️ `WorkforceCommsDraft.eventRouterIds` - Use `CompanyWorkLink` instead

---

## ✅ CURRENT STATE SUMMARY

### What We Have Now

1. **CompanyX Models** - Direct access, no router abstraction
2. **WorkCommsProduct** - Unified product model (NEW)
3. **CompanyWorkLink** - Junction table linking CompanyX to products
4. **WorkforceComms** - Legacy 3-layer email system (kept for compatibility)
5. **EventItem** - Event-specific items (replaced PromotionalWorkItem)

### What We Call Things

- **"Products"** = `WorkCommsProduct` (canonical term)
- **"Outputs"** = Legacy term (avoid using)
- **"WorkforceComms"** = Legacy email generation system
- **"CompanyX"** = Company-level happenings (events, campaigns, etc.)

### How They Relate

```
CompanyX (Event/Campaign/etc.)
    ↓
CompanyWorkLink (Junction)
    ↓
WorkCommsProduct (Product)
```

**WorkforceComms is separate** - it's a legacy workflow system that may eventually migrate to use WorkCommsProduct.

---

## 🎯 RECOMMENDATIONS

1. **Use `WorkCommsProduct` for all new products**
2. **Use `CompanyWorkLink` to link products to CompanyX models**
3. **Avoid `WorkforceComms` for new features** (unless specifically building email generation workflow)
4. **Use "products" terminology** instead of "outputs"
5. **Migrate `WorkforceCommsDraft.eventRouterIds`** to use `CompanyWorkLink` when possible

---

**End of Document**

