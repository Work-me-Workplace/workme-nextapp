# Global Artifacts Schema & Flow

## Schema Model: `CompanyNewsArtifact`

**Location:** `prisma/schema.prisma` (lines 2315-2356)

### Model Structure

```prisma
model CompanyNewsArtifact {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  companyId String  // REQUIRED - filters by company
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // Article metadata
  sourceName String? // "USNI News", "HII Release", "DoD Release"
  sourceUrl  String? // URL of the article/press release
  headline   String? // Article headline or title

  // Content
  rawText   String // REQUIRED - Full article/press release text
  aiSummary String? // AI-generated one paragraph summary

  // Article Intelligence
  artifactType    String? // "unit_update", "milestone", "workforce", "leadership", etc.
  sentiment       String? // "positive", "negative", "neutral"
  humanElements   Json? // e.g., {"sponsor": "Pamela Bove", "leaders": ["SECNAV"]}
  noteworthyItems Json? // e.g., {"key_facts": [...], "dates": [...]}
  leaderStatement Json? // e.g., {"statement": "...", "leader": "SECNAV Del Toro"}

  // Creator tracking
  createdByWorkMeId String? @db.Uuid
  createdBy         WorkMe? @relation("CompanyNewsArtifactCreator", ...)

  // Relations - can be used by multiple entities
  platformStatements     CompanyPlatformStatement[]
  platformUnitStatements CompanyPlatformUnitStatement[]
  milestones             CompanyMilestone[]
  externalEnv            CompanyExternalEnv[]
}
```

## Flow: Article Creation → Display

### 1. Article Creation

**API Route:** `POST /api/utils/news-artifact/create`  
**File:** `app/api/utils/news-artifact/create/route.ts`

**What happens:**
1. User provides article text (via URL or paste)
2. API creates `CompanyNewsArtifact` record with:
   - `companyId` (from authenticated user's WorkMe)
   - `rawText` (required)
   - `headline`, `sourceUrl`, `sourceName` (optional)
   - `artifactType`, `sentiment`, `aiSummary` (optional, can be set later)

**Key Point:** `companyId` is REQUIRED - articles are scoped to a company

### 2. Article Display (Global Artifacts Page)

**Page:** `/mycompany/articles`  
**File:** `app/mycompany/articles/page.tsx`

**API Route:** `GET /api/utils/news-artifact/list`  
**File:** `app/api/utils/news-artifact/list/route.ts`

**What happens:**
1. Page calls API with user's `companyId` (from authenticated WorkMe)
2. API queries: `prisma.companyNewsArtifact.findMany({ where: { companyId } })`
3. Returns all artifacts for that company
4. Page displays them in a list

**Filters:**
- `artifactType` (unit_update, milestone, workforce, etc.)
- `sentiment` (positive, negative, neutral)

## The Problem: Why Articles Might Not Show

### Issue 1: CompanyId Mismatch
- Articles are created with a `companyId`
- API filters by authenticated user's `companyId`
- **If they don't match, articles won't show**

### Issue 2: Articles Created Without CompanyId
- If `companyId` is null or missing during creation
- Articles won't be queryable (though schema requires it)

### Issue 3: Articles Created Before CompanyId Was Required
- Old articles might have wrong/null `companyId`
- Need to check database directly

## How to Debug

### Check What CompanyId Articles Have:
```sql
SELECT id, headline, companyId, createdAt 
FROM "CompanyNewsArtifact" 
ORDER BY createdAt DESC 
LIMIT 10;
```

### Check What CompanyId User Has:
- Check browser console logs: `[API GET /api/utils/news-artifact/list] Querying with: { companyId: ... }`
- Check authenticated user's WorkMe record

### Check If Articles Exist:
```sql
SELECT COUNT(*) FROM "CompanyNewsArtifact";
```

## Where Articles Are Created

1. **Clip Page** (`/signal/clip`)
   - Creates basic `CompanyNewsArtifact` (no parsing)
   - Routes to parse page

2. **Unit Update Page** (`/mycompany/platforms/[id]/units/[unitId]/update`)
   - Ingests article → creates `CompanyNewsArtifact` → creates unit update

3. **Milestone Creation** (`/mycompany/milestones/new`)
   - Can create `CompanyNewsArtifact` first, then milestone

## Summary

- **Model:** `CompanyNewsArtifact` (company-scoped)
- **Required Fields:** `companyId`, `rawText`
- **Key Filter:** Articles are filtered by `companyId` - must match authenticated user's company
- **Storage:** PostgreSQL database, table `CompanyNewsArtifact`
- **Relations:** Can link to platform statements, unit statements, milestones, external env
