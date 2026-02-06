# Ecosystem Contact Model - Universal Contact Tracking

**Date:** 2026-02-05  
**Status:** Schema Enhancement Plan

---

## Overview

The `EcosystemPerson` + `MyEcosystemContact` models form a **universal contact tracking system** that can handle:
- Media/journalists
- Influencers
- Analysts
- Competitors
- Partners
- Regulators
- Anyone who can be favorable or unfavorable to the organization

This is **bigger than just X feed follows** - it's a comprehensive relationship intelligence system.

---

## Current Schema

### EcosystemPerson (Global Person Registry)
```prisma
model EcosystemPerson {
  id        String  @id @default(cuid())
  fullName  String
  xHandle   String? @unique
  xUserId   String? @unique
  title     String?
  seniority String?
  domain    String?  // e.g., "defense", "naval", "technology"
  beat      String?  // Journalist beat (e.g., "shipbuilding", "acquisition")
  
  companyName String?
  companyId   String?
  yearsAt     Int?
  influence   Int?  // Influence score (1-10)
  
  profileImage String?
  bio          String?
  followers    Int?
  
  topics              String[] @default([])
  affinityIndustry    String?  // Industry affinity
  affinityToMyOrg     String?  // Favorable/unfavorable to organization (GLOBAL)
  latestSignalSummary String?
  
  updatedSummary String?
  lastHydratedAt DateTime?
  
  workMeContacts MyEcosystemContact[]
  company        EcosystemCompany?
}
```

### MyEcosystemContact (User-Specific Relationship)
```prisma
model MyEcosystemContact {
  id       String @id @default(cuid())
  workMeId String @db.Uuid
  personId String

  notes String?
  tags  String[] @default([])

  // NEW: Relationship tracking (user-specific)
  stance String? // "favorable", "unfavorable", "neutral", "unknown"
  relationshipType String? // "media", "influencer", "analyst", "competitor", "partner", "regulator"
  
  // NEW: X Feed integration
  followForXFeed Boolean @default(false) // Include in X feed signals?
  
  // NEW: User-specific metadata
  lastInteractedAt DateTime?
  priority Int? // User-assigned priority (1-10)

  workMe WorkMe @relation(...)
  person EcosystemPerson @relation(...)
}
```

---

## Key Design Decisions

### 1. Two-Level Model

**EcosystemPerson** = Global person registry (one person, many users can track them)
- Contains **global** attributes (X handle, bio, influence, etc.)
- `affinityToMyOrg` = Global assessment (could be AI-inferred or crowd-sourced)

**MyEcosystemContact** = User-specific relationship (one person per user)
- Contains **user-specific** attributes (stance, notes, tags, priority)
- `stance` = How THIS user views this person's relationship to THEIR organization
- `followForXFeed` = Whether THIS user wants X feed signals from this person

### 2. Favorable/Unfavorable Tracking

**At Person Level (Global):**
- `affinityToMyOrg` (String?) - Free text or structured value
  - Examples: "favorable", "unfavorable", "neutral", "critical", "supportive"

**At Contact Level (User-Specific):**
- `stance` (String?) - Enum-like values
  - "favorable" - This person is supportive/positive toward my org
  - "unfavorable" - This person is critical/negative toward my org
  - "neutral" - No clear stance
  - "unknown" - Haven't assessed yet

### 3. Relationship Types

`relationshipType` field supports categorization:
- "media" - Journalist, reporter, news outlet
- "influencer" - Social media influencer, thought leader
- "analyst" - Industry analyst, researcher
- "competitor" - Competitor organization
- "partner" - Partner organization
- "regulator" - Regulatory body, government official
- "customer" - Customer/client
- "vendor" - Vendor/supplier

### 4. X Feed Integration

Instead of separate `XFeedFollow` model, use:
- `MyEcosystemContact.followForXFeed` = Boolean flag
- Filter `MyEcosystemContact` where `followForXFeed = true` AND `person.xHandle IS NOT NULL`
- This keeps everything in one unified model

---

## Use Cases

### Use Case 1: Media Contact Tracking
```
EcosystemPerson:
  - fullName: "Justin Katz"
  - xHandle: "justin_katz"
  - domain: "defense"
  - beat: "naval shipbuilding"
  - affinityToMyOrg: "neutral" (global assessment)

MyEcosystemContact (for User A):
  - stance: "favorable"
  - relationshipType: "media"
  - followForXFeed: true
  - notes: "Covers our programs regularly"
  - priority: 8
```

### Use Case 2: Competitor Tracking
```
EcosystemPerson:
  - fullName: "John Smith"
  - title: "VP Engineering"
  - companyName: "Competitor Corp"
  - affinityToMyOrg: "unfavorable" (competitor)

MyEcosystemContact (for User A):
  - stance: "unfavorable"
  - relationshipType: "competitor"
  - followForXFeed: true  // Track their public statements
  - notes: "Watch for competitive intelligence"
```

### Use Case 3: Influencer Tracking
```
EcosystemPerson:
  - fullName: "Naval News"
  - xHandle: "navalnews"
  - domain: "naval"
  - influence: 9
  - affinityToMyOrg: "favorable"

MyEcosystemContact (for User A):
  - stance: "favorable"
  - relationshipType: "media"
  - followForXFeed: true
  - priority: 10
```

---

## API Endpoints Needed

### 1. List My Contacts (with filters)
```
GET /api/ecosystem/my-contacts
Query params:
  - stance?: favorable | unfavorable | neutral | unknown
  - relationshipType?: media | influencer | analyst | ...
  - followForXFeed?: true | false
  - hasXHandle?: true | false
```

### 2. Create/Update Contact
```
POST /api/ecosystem/contacts
Body: {
  personId: string,
  stance?: string,
  relationshipType?: string,
  followForXFeed?: boolean,
  notes?: string,
  tags?: string[],
  priority?: number
}
```

### 3. Get X Feed Follows
```
GET /api/x/follows
Returns: MyEcosystemContact[] where followForXFeed = true AND person.xHandle IS NOT NULL
```

### 4. Search Ecosystem Persons
```
GET /api/ecosystem/search?q=justin+katz
Returns: EcosystemPerson[] matching search
```

---

## Migration from XFeedFollow

If `XFeedFollow` was already created, migrate data:

```sql
-- Migrate XFeedFollow to MyEcosystemContact
INSERT INTO "MyEcosystemContact" (id, "workMeId", "personId", "followForXFeed", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  xf."workMeId",
  ep.id,
  true,
  xf."createdAt",
  xf."updatedAt"
FROM "XFeedFollow" xf
LEFT JOIN "EcosystemPerson" ep ON ep."xHandle" = xf.handle
WHERE ep.id IS NOT NULL;

-- Then drop XFeedFollow table
DROP TABLE "XFeedFollow";
```

---

## Benefits of This Approach

1. **Unified Model** - One model for all external contacts
2. **Relationship Intelligence** - Track favorable/unfavorable at user level
3. **Flexible** - Supports media, influencers, competitors, partners, etc.
4. **X Feed Integration** - Simple boolean flag, no separate model
5. **Scalable** - Can add more relationship types and fields as needed
6. **User-Specific** - Each user can have different stance/notes for same person

---

## Next Steps

1. ✅ Add fields to `MyEcosystemContact` schema
2. ✅ Remove `XFeedFollow` model
3. Update API endpoints to use `MyEcosystemContact`
4. Update UI to show stance, relationshipType, followForXFeed
5. Migrate any existing `XFeedFollow` data
6. Update X feed endpoint to use `MyEcosystemContact.followForXFeed`
