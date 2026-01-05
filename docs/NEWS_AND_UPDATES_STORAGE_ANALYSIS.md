# News and Updates Storage Analysis

**Date:** 2025-01-15  
**Purpose:** Comprehensive analysis of how news, updates, milestones, and external pressures are stored in the system

---

## Executive Summary

The system currently has **three primary models** for storing news and updates:

1. **CompanyNewsArtifact** - Universal staging area for news articles and press releases
2. **CompanyMilestone** - Discrete company events (keel laying, launches, etc.)
3. **ExternalCompanyPressure** - User-tracked external signals/factors affecting the company (despite name, tracks both opportunities and threats)

**Key Finding:** There is **no unified "External Environment" model** to aggregate and contextualize these different types of information. Each model serves a specific purpose but operates independently.

---

## Current Models

### 1. CompanyNewsArtifact (Universal News Storage)

**Location:** `prisma/schema.prisma` (lines 2040-2087)

**Purpose:** Universal staging area for news articles and press releases. Acts as a central repository that can be referenced by multiple downstream models.

**Key Fields:**
- `companyId` (required) - Owned by Company
- `sourceName`, `sourceUrl`, `headline` - Article metadata
- `rawText` (required) - Full article/press release text
- `aiSummary` - AI-generated one paragraph summary
- `artifactType` - Classification: "unit_update", "milestone", "workforce", "leadership", "industrial_base", "contract", "general"
- `sentiment` - "positive", "negative", "neutral"
- `humanElements` (JSON) - People mentioned: sponsors, leaders, attendees
- `noteworthyItems` (JSON) - Key facts, dates, milestones, locations
- `leaderStatement` (JSON) - Leadership quotes with context
- `createdByWorkMeId` - Who ingested it

**Relations:**
- Can be linked to `CompanyPlatformStatement[]`
- Can be linked to `CompanyPlatformUnitStatement[]`
- Can be linked to `CompanyMilestone[]`

**API Endpoints:**
- `POST /api/utils/news-artifact/create` - Create artifact with full intelligence
- `POST /api/utils/news-artifact/ingest` - Ingest and analyze article (AI processing)
- `POST /api/utils/news-artifact/parse` - Parse artifact into specific model types
- `GET /api/utils/news-artifact/[id]` - Retrieve artifact

**Intelligence Features:**
- AI-powered analysis extracts:
  - Artifact type classification
  - Sentiment analysis
  - Human elements (people mentioned)
  - Noteworthy items (facts, dates, milestones)
  - Leader statements
  - One-paragraph summary

**Use Cases:**
- Ingesting press releases
- Storing news articles
- Referenced by milestones, platform statements, and unit statements
- Can be parsed into other model types (milestones, external pressures, etc.)

---

### 2. CompanyMilestone (Discrete Company Events)

**Location:** `prisma/schema.prisma` (lines 1970-2005)

**Purpose:** Represents discrete company events like keel laying, product launches, mergers, etc. Can be created manually or extracted from news artifacts.

**Key Fields:**
- `companyId` (required) - Owned by Company
- `title` (required) - e.g., "USS Barb (SSN-804) Keel Laying"
- `category` - e.g., "Platform", "Business", "Strategy"
- `milestoneType` - Free-text or derived label (e.g., "KEEL_LAYING", "Product Launch", "Merger")
- `date` - When the milestone occurred
- `description` - Additional context
- `sourceUrl` - Source of information

**Optional Linkages:**
- `platformUnitId` - Links to CompanyPlatformUnit (contextual, not ownership)
- `updateId` - Links to CompanyPlatformUnitUpdate (provenance - which update triggered this)
- `newsArtifactId` - Links to CompanyNewsArtifact (source article/press release)

**Relations:**
- Owned by `Company`
- Optional link to `CompanyPlatformUnit`
- Optional link to `CompanyPlatformUnitUpdate` (unique - one milestone per update)
- Optional link to `CompanyNewsArtifact`

**API Endpoints:**
- `POST /api/company/milestones/upsert` - Create or update milestone
- `GET /api/company/milestones/list` - List milestones for company
- `POST /api/company/milestones/[id]/generate-digital-product` - Generate digital product from milestone

**Use Cases:**
- Tracking significant company events
- Platform unit milestones (keel laying, sea trials, delivery)
- Business milestones (mergers, acquisitions, launches)
- Strategic milestones (new programs, partnerships)

**Key Design Note:**
Milestones can exist independently (manual creation) or be derived from news artifacts or platform unit updates. The `updateId` field provides provenance tracking.

---

### 3. ExternalCompanyPressure (User-Tracked External Signals)

**Location:** `prisma/schema.prisma` (lines 1584-1600)

**Purpose:** User-managed tracking of external signals, factors, and developments affecting the company. More lightweight and user-driven than news artifacts. Note: Despite the name "pressure," this model tracks both positive and negative external factors (opportunities, threats, trends, regulatory changes, etc.).

**Data Shape:**
```typescript
{
  id: string
  workMeId: string              // User who created it (user-specific)
  source: string                // e.g., "GAO", "Congress", "Industry", "DoD", "Navy"
  category?: string | null      // e.g., "Budget", "Legislation", "Testing", "Ops", "Regulatory"
  summary: string               // Description of the external signal/development
  impact?: string | null        // Why this matters, what it means, significance
  createdAt: DateTime           // When it was tracked
}
```

**Example Data:**
```json
{
  "source": "GAO",
  "category": "Budget",
  "summary": "GAO report recommends increased funding for submarine programs",
  "impact": "Could create opportunities for additional contracts"
}
```

```json
{
  "source": "Congress",
  "category": "Legislation",
  "summary": "New defense authorization bill includes provisions for shipbuilding",
  "impact": "May affect procurement timelines and requirements"
}
```

```json
{
  "source": "Industry",
  "category": "Testing",
  "summary": "Competitor announces successful sea trials completion",
  "impact": "Market positioning and competitive landscape shift"
}
```

**Key Insight:** Despite the name "Pressure," this tracks **neutral external signals** that can represent:
- ✅ **Opportunities** (positive developments, funding increases, new programs)
- ⚠️ **Threats** (competitive moves, budget cuts, regulatory challenges)
- 📊 **Trends** (industry shifts, market changes, technology developments)
- 🏛️ **Regulatory** (GAO reports, congressional actions, policy changes)

**Key Fields:**
- `workMeId` (required) - Owned by WorkMe (user-specific)
- `source` (required) - Source of the signal (e.g., "GAO", "Congress", "Industry", "DoD", "Navy")
- `category` - Optional categorization (e.g., "Budget", "Legislation", "Testing", "Ops", "Regulatory")
- `summary` (required) - Summary of the external signal/development
- `impact` - Optional impact description (why this matters, what it means)
- `createdAt` - When it was created

**Relations:**
- Owned by `WorkMe` (not Company directly - user-specific)

**API Endpoints:**
- `POST /api/external-pressures/create` - Create new external signal
- `GET /api/external-pressures/list` - List signals for user
- `GET /api/external-pressures/[id]` - Get specific signal
- `POST /api/external-pressures/[id]/update` - Update signal

**Use Cases:**
- Tracking GAO reports and recommendations
- Congressional actions and legislation
- Industry trends and developments
- Regulatory changes
- Budget signals
- Market forces
- Competitive intelligence
- User-curated external factors (both opportunities and threats)

**Key Design Note:**
This is **user-specific** (tied to WorkMe, not Company), which means different users can have different views of external signals. This is different from CompanyNewsArtifact which is company-wide.

**Naming Consideration:**
The model name "ExternalCompanyPressure" suggests negative pressure, but the actual data structure and use cases show it tracks **neutral external signals** that can be positive (opportunities) or negative (threats). Consider renaming to:
- `ExternalCompanySignal`
- `ExternalCompanyFactor`
- `ExternalCompanyDevelopment`
- `CompanyExternalSignal`

---

## Data Flow Patterns

### Pattern 1: News Artifact → Milestone
```
1. User ingests article → CompanyNewsArtifact created
2. AI analyzes article → artifactType, sentiment, noteworthyItems extracted
3. User/System extracts milestone info → CompanyMilestone created
4. Milestone links back to newsArtifactId
```

**Example:** Press release about keel laying → News artifact created → Milestone extracted → Milestone references artifact

### Pattern 2: News Artifact → Platform Statement → Update → Milestone
```
1. Article ingested → CompanyNewsArtifact
2. Article parsed for platform info → CompanyPlatformUnitStatement
3. Statement analyzed → CompanyPlatformUnitUpdate
4. Update contains milestone signal → CompanyMilestone
5. All linked via newsArtifactId and updateId
```

### Pattern 3: Manual External Signal
```
1. User identifies external signal/factor (GAO report, congressional action, industry trend)
2. User creates ExternalCompanyPressure directly
3. No news artifact required
4. User-specific (not company-wide)
5. Can be positive (opportunity) or negative (threat)
```

---

## Gaps and Recommendations

### Gap 1: No Unified "External Environment" Model

**Current State:**
- News artifacts are company-wide but focused on articles/press releases
- External signals (pressures) are user-specific and lightweight
- Milestones are company-wide but focused on discrete events
- No aggregation layer to view "external environment" holistically

**Recommendation: Create `ExternalEnvironment` Model**

```prisma
model ExternalEnvironment {
  id        String   @id @default(cuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Aggregation of different sources
  newsArtifacts     CompanyNewsArtifact[]
  milestones        CompanyMilestone[]
  externalSignals   ExternalCompanyPressure[] // Would need to change ownership model (or rename model)
  
  // Environment-level intelligence
  environmentType   String? // "competitive", "regulatory", "market", "industry"
  timeframe        String? // "current", "upcoming", "historical"
  impactLevel      String? // "high", "medium", "low"
  aiSummary        String? // Aggregated summary of environment
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([companyId])
  @@index([environmentType])
}
```

**Benefits:**
- Unified view of external factors
- Can aggregate news artifacts, milestones, and pressures
- Company-wide context (not user-specific)
- AI-powered environment summaries
- Better for strategic planning and analysis

**Alternative Approach:**
Instead of a new model, create a **virtual aggregation service** that queries across:
- CompanyNewsArtifact (filtered by artifactType, sentiment, date range)
- CompanyMilestone (filtered by category, date range)
- ExternalCompanyPressure/ExternalSignal (aggregated across all users in company)

This would be a read-only view without requiring schema changes.

---

### Gap 2: ExternalCompanyPressure Ownership Model & Naming

**Current Issue:**
- ExternalCompanyPressure is owned by `WorkMe` (user-specific)
- This means different users see different external signals
- No company-wide view of external signals
- **Naming issue:** "Pressure" implies negative, but data tracks neutral signals (can be opportunities or threats)

**Recommendation:**
- **Option A:** Rename to `ExternalCompanySignal` or `CompanyExternalSignal` and add `companyId` (make it company-wide)
- **Option B:** Keep user-specific but add aggregation layer and rename for clarity
- **Option C:** Create separate `CompanyExternalSignal` model for company-wide signals, keep user-specific version

**Consideration:**
If signals are meant to be user-curated insights, keeping them user-specific makes sense. But if they represent objective external factors (GAO reports, congressional actions, industry trends), they should be company-wide. The name should reflect that these are neutral signals, not just "pressures."

---

### Gap 3: No Temporal Organization

**Current State:**
- All models have `createdAt` but no unified temporal organization
- No way to view "what's happening now" vs "what happened last quarter"
- No forecasting or trend analysis

**Recommendation:**
- Add temporal fields to ExternalEnvironment model
- Create time-based views (current, upcoming, historical)
- Add trend analysis capabilities

---

### Gap 4: Limited Cross-Model Intelligence

**Current State:**
- Each model has its own AI intelligence (news artifacts have sentiment, milestones have types)
- No cross-model analysis (e.g., "What milestones correlate with positive news?")

**Recommendation:**
- Add ExternalEnvironment model with aggregated intelligence
- Cross-model analysis service
- Pattern detection across news artifacts, milestones, and pressures

---

## Current Architecture Strengths

### ✅ Flexible News Artifact System
- Universal staging area works well
- Can be referenced by multiple downstream models
- Rich AI intelligence extraction

### ✅ Provenance Tracking
- Milestones can link back to updates and news artifacts
- Good traceability of where information came from

### ✅ Separation of Concerns
- News artifacts = raw content storage
- Milestones = structured events
- External pressures = user insights

---

## Recommended Next Steps

### Phase 1: Analysis & Design
1. **Define External Environment Requirements**
   - What information should be included?
   - Should it be company-wide or user-specific?
   - What intelligence/analysis is needed?

2. **Review ExternalCompanyPressure Ownership**
   - Decide if pressures should be company-wide or user-specific
   - Consider use cases for both approaches

### Phase 2: Implementation Options

**Option A: Virtual Aggregation (No Schema Changes)**
- Create service/API that aggregates across existing models
- Provides unified view without database changes
- Faster to implement
- Less persistent (computed on-demand)

**Option B: ExternalEnvironment Model (Schema Changes)**
- Add new model to schema
- Migrate/create relationships
- More persistent and queryable
- Better for long-term analysis

**Option C: Hybrid Approach**
- Keep existing models as-is
- Add ExternalEnvironment as aggregation layer
- Link to existing models via relations
- Best of both worlds

---

## Related Models (For Context)

### CompanyPlatformUnitStatement
- Links to CompanyNewsArtifact
- Represents platform-specific statements/articles
- Can generate CompanyPlatformUnitUpdate

### CompanyPlatformUnitUpdate
- Can trigger CompanyMilestone creation
- Tracks progress/status updates
- Links back to statements and news artifacts

### ExternalEvidence
- Part of ProductFamily system
- Stores OSINT-verified evidence
- Different purpose (product-focused) but similar concept

---

## Questions for Consideration

1. **Should ExternalEnvironment be company-wide or user-specific?**
   - News artifacts: Company-wide ✅
   - Milestones: Company-wide ✅
   - External pressures: User-specific ⚠️
   - Recommendation: Company-wide for strategic planning

2. **What's the relationship between ExternalEnvironment and ExternalCompanyPressure/Signal?**
   - Should external signals feed into environment?
   - Should environment aggregate signals?
   - Should they be separate concepts?
   - Should we rename "Pressure" to "Signal" or "Factor"?

3. **How should temporal organization work?**
   - Current vs. historical
   - Upcoming/forecasted events
   - Trend analysis

4. **What level of AI intelligence is needed?**
   - Aggregated summaries?
   - Pattern detection?
   - Predictive analysis?
   - Risk assessment?

---

## Summary

**Current State:**
- ✅ CompanyNewsArtifact: Universal news storage (company-wide)
- ✅ CompanyMilestone: Discrete events (company-wide)
- ✅ ExternalCompanyPressure: User-tracked external signals (user-specific, but name suggests only negative)
- ❌ No unified External Environment model

**Recommendation:**
1. **Rename/Reframe:** Consider renaming `ExternalCompanyPressure` to `ExternalCompanySignal` or `CompanyExternalSignal` to reflect that it tracks neutral external factors (both opportunities and threats), not just "pressures"

2. **Create ExternalEnvironment:** Model or service that aggregates:
   - News artifacts (filtered by type, sentiment, timeframe)
   - Milestones (filtered by category, date range)
   - External signals (aggregated across users or made company-wide)

3. **Consider Ownership:** Make external signals company-wide if they represent objective external factors (GAO reports, congressional actions, industry trends) rather than user-specific insights

This would provide a unified view of the external environment for strategic planning and analysis.

