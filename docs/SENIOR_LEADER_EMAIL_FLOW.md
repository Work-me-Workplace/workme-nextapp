# Senior Leader Email Flow Documentation

## Model Verification

### Current Database Model

**Main Model: `ProductSeniorLeaderEmail`**
- Location: `prisma/schema.prisma`
- Purpose: Product artifact for senior leader emails - "what did the boss say"
- This is a PRODUCT, not a signal
- Always includes topic parsing (SeniorLeaderTopics)

**Content Model: `ProductSeniorLeaderEmailContent`** (1:1 relationship)
- Location: `prisma/schema.prisma`
- Fields:
  - `title` (String?) - Optional title
  - `actualSubjectLine` (String?) - Actual email subject line
  - `content` (String) - Full pasted text, untouched - **This is your "BodyofEmail"**
  - `role` (SeniorLeaderRole enum) - **Role enum - user selects this first**
  - `companyEmployeeId` (String?) - Foreign key to `CompanyEmployee` - **The actual person selected after role lookup**

**Senior Leader Role Enum: `SeniorLeaderRole`**
- Location: `prisma/schema.prisma`
- Values: `SES`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `EXECUTIVE_DIRECTOR`, `CHIEF`, `DEPUTY_CHIEF`, `COMMANDER`, `DEPUTY_COMMANDER`, `OTHER`

**Company Employee Model: `CompanyEmployee`** (Person Lookup)
- Location: `prisma/schema.prisma`
- Purpose: Existing employee model used for person lookup
- Fields: `fullName`, `title`, `email`, `companyId`, `companyUnit`, etc.
- Used to lookup people by role/title after selecting role enum

### Model Comparison

| Your Expected Field | Current Model Field | Status | Notes |
|---------------------|---------------------|--------|-------|
| `Title` | `title` (String?) | ✅ Matches | Optional field |
| `actualSubjectLine` | `actualSubjectLine` (String?) | ✅ Matches | Subject line field |
| `from` (role enum → person) | `role` (enum) + `companyEmployeeId` (FK) | ✅ Matches | Role enum first, then lookup person |
| `BodyofEmail` | `content` (String) | ✅ Matches | Required field |
| `MyWorkSeniorLeader` | `ProductSeniorLeaderEmail` | ✅ Matches | This is the main model |

### Model Architecture & Flow

**Flow:**
1. User selects **role** (enum: SES, DIRECTOR, etc.)
2. System does **lookup** of `CompanyEmployee` records matching that role (by `title` field)
3. User **selects the actual person** from the lookup results
4. Email is created with `role` + `companyEmployeeId`

**Benefits:**
- Role enum provides consistent categorization
- Lookup filters existing `CompanyEmployee` records (no duplicate person data)
- Person selection from existing company employees (employee-first architecture)
- Can hydrate `CompanyEmployee` from Apollo if needed

## Flow Documentation

### Current Flow (Topic Parsing Happens Immediately)

```
User Input (UI)
    ↓
/mywork/seniorleader/build (page.tsx)
    ↓
Form Submission
    ↓
POST /api/mywork/senior-leader-email/create
    ↓
┌─────────────────────────────────────┐
│ 1. Validate content (required)     │
│ 2. Parse topics IMMEDIATELY        │ ← Currently happens here
│    (parseSeniorLeaderTopics)       │
│ 3. Create ProductSeniorLeaderEmail  │
│    + ProductSeniorLeaderEmailContent│
│    + SeniorLeaderTopic[]            │
└─────────────────────────────────────┘
    ↓
Save to Database (Prisma)
    ↓
Redirect to /mywork/products
```

### Desired Flow (Save First, Parse Later)

```
User Input (UI)
    ↓
/mywork/seniorleader/build (page.tsx)
    ↓
Form Submission
    ↓
POST /api/mywork/senior-leader-email/create
    ↓
┌─────────────────────────────────────┐
│ 1. Validate content (required)     │
│ 2. Create ProductSeniorLeaderEmail  │ ← Save first
│    + ProductSeniorLeaderEmailContent│
│    (NO topics yet)                  │
└─────────────────────────────────────┘
    ↓
Save to Database (Prisma)
    ↓
Return success
    ↓
[Later] POST /api/mywork/senior-leader-email/[id]/parse-topics
    ↓
Parse topics and create SeniorLeaderTopic[]
```

## Route Information

### Current Routes

**UI Route:**
- **Path:** `/mywork/seniorleader/build`
- **File:** `app/mywork/seniorleader/build/page.tsx`
- **Purpose:** Form to ingest/create senior leader email
- **Note:** There is **NO** `/myworkproduct/senior/create` route. The actual route is `/mywork/seniorleader/build`

**API Route:**
- **Path:** `POST /api/mywork/senior-leader-email/create`
- **File:** `app/api/mywork/senior-leader-email/create/route.ts`
- **Current Behavior:** Creates product + parses topics immediately
- **Desired Behavior:** Create product only, parse topics separately

### Where It Saves

**Database Tables:**
1. `ProductSeniorLeaderEmail` - Main product record
   - Fields: `id`, `createdAt`, `updatedAt`, `archivedAt`, `companyUnit`, `createdByWorkMeId`
2. `ProductSeniorLeaderEmailContent` - Content details (1:1)
   - Fields: `id`, `seniorLeaderEmailProductId`, `title`, `content`, `saidBy`, `role`
3. `SeniorLeaderTopic[]` - Parsed topics (currently created immediately)
   - Fields: `id`, `seniorLeaderEmailProductId`, `topic`, `description`, `createdAt`

**After Save:**
- Redirects to `/mywork/products` (list view)
- Product appears in the products list

## Topic Parser Service

**Location:** `lib/services/senior-leader-topic-parser.ts`

**Current Usage:**
- Called automatically in `/api/mywork/senior-leader-email/create` route (line 37)
- Parses topics immediately upon creation

**Function Signature:**
```typescript
export async function parseSeniorLeaderTopics(
  content: string
): Promise<TopicParseResult>
```

**Returns:**
- 3-7 high-level themes
- Each topic has: `topic` (string) and `description` (string | null)

**Existing Parse Endpoint (for Signals):**
- `POST /api/signal/[id]/parse-topics` - Parses topics for SignalArtifact
- Could be used as reference for creating similar endpoint for products

## Implementation Notes

### To Implement "Save First, Parse Later":

1. **Modify Create Route:**
   - Remove topic parsing from `POST /api/mywork/senior-leader-email/create`
   - Only create `ProductSeniorLeaderEmail` + `ProductSeniorLeaderEmailContent`
   - Don't create `SeniorLeaderTopic[]` records

2. **Create Parse Endpoint:**
   - New route: `POST /api/mywork/senior-leader-email/[id]/parse-topics`
   - Similar to `/api/signal/[id]/parse-topics`
   - Parse topics and create `SeniorLeaderTopic[]` records

3. **Update UI (Optional):**
   - Add "Parse Topics" button on product detail page
   - Or parse topics automatically after save (background job)

### Role-Based Person Selection Flow:

1. **Select Role (Enum):**
   - User first selects `SeniorLeaderRole` enum (SES, DIRECTOR, etc.)
   - This determines which category of senior leader

2. **Lookup People by Role:**
   - System queries `CompanyEmployee` records
   - Filters by `title` field matching the selected role
   - Can use fuzzy matching (similar to `matchLeadershipRole` in `companyEnrichmentService.ts`)
   - Example: Role = "DIRECTOR" → Lookup employees with title containing "Director"

3. **Select Person:**
   - User selects from the filtered `CompanyEmployee` results
   - Email is created with `role` + `companyEmployeeId`

4. **Optional: Hydrate from Apollo:**
   - If `CompanyEmployee` doesn't exist, can create/hydrate from Apollo
   - Apollo provides: employment_history, title, company info
   - Similar to company enrichment pattern

## Related Files

- **Schema:** `prisma/schema.prisma` (lines 1839-1895)
- **Create Route:** `app/api/mywork/senior-leader-email/create/route.ts`
- **UI Page:** `app/mywork/seniorleader/build/page.tsx`
- **Topic Parser:** `lib/services/senior-leader-topic-parser.ts`
- **Products List:** `app/mywork/products/page.tsx`
- **Signal Parse Route (reference):** `app/api/signal/[id]/parse-topics/route.ts`




