# COMPANY MODEL INSPECTION

## COMPANY MODEL

```prisma
model Company {
  id           String        @id @default(uuid())
  name         String        @unique // Company name (unique globally)
  industry     String?
  website      String?
  city         String?
  state        String?
  description  String?
  headcount    Int?
  companyType  CompanyType?
  revenueRange RevenueRange?
  createdAt    DateTime      @default(now())

  // Relations
  employees WorkMe[]

  // Minimal reverse relations (required by Prisma, but NOT to be queried)
  // Company is independent - work outputs reference Company via companyId
  // These relations exist only for Prisma schema validation
  commsOutputs              CommsOutput[]              @relation("CommsOutputCompany")
  objectives                Objective[]                @relation("ObjectiveCompany")
  achievements              Achievement[]              @relation("AchievementCompany")
  workEventRouters          WorkEventRouter[]          @relation("WorkEventRouterCompany")
  workContextCampaigns      WorkContextCampaign[]     @relation("WorkContextCampaignCompany")
  workContextImpactEvents   WorkContextImpactEvent[]   @relation("WorkContextImpactEventCompany")
  workContextTrainings      WorkContextTraining[]     @relation("WorkContextTrainingCompany")
  workEvents                WorkEvent[]               @relation("WorkEventCompany")
  workContextCommunities    WorkContextCommunity[]    @relation("WorkContextCommunityCompany")
  workContextBenefits       WorkContextBenefits[]     @relation("WorkContextBenefitsCompany")
  workContextCareers        WorkContextCareer[]       @relation("WorkContextCareerCompany")
  workContextEmployeeCauses WorkContextEmployeeCause[] @relation("WorkContextEmployeeCauseCompany")
  workSupports              WorkSupport[]             @relation("WorkSupportCompany")
  workOutputs               WorkOutput[]              @relation("WorkOutputCompany")
  workOutputStandalones     WorkOutputStandalone[]    @relation("WorkOutputStandaloneCompany")
  ntks                      NTK[]                     @relation("NTKCompany")
  workforceComms            WorkforceComms[]          @relation("WorkforceCommsCompany")
  workforceCommsDrafts      WorkforceCommsDraft[]     @relation("WorkforceCommsDraftCompany")
  workforceCommsEditions    WorkforceCommsEdition[]   @relation("WorkforceCommsEditionCompany")
  ntkEditions               NTKEdition[]              @relation("NTKEditionCompany")

  @@index([name]) // Index for directory lookups
}
```

## REFERENCES

### Schema Definitions
- `prisma/schema.prisma:21-22` - WorkMe model has optional `companyId` field and `company` relation (read/write)
- `prisma/schema.prisma:135-176` - Company model definition with all fields and reverse relations (schema definition)
- `prisma/schema.prisma:280-281` - CommsOutput references Company via `companyId` (relation definition)
- `prisma/schema.prisma:303-304` - Objective references Company via `companyId` (relation definition)
- `prisma/schema.prisma:324-325` - Achievement references Company via `companyId` (relation definition)
- `prisma/schema.prisma:378-379` - WorkEventRouter references Company via `companyId` (relation definition)
- `prisma/schema.prisma:407-408` - WorkContextCampaign references Company via `companyId` (relation definition)
- `prisma/schema.prisma:429-430` - WorkContextImpactEvent references Company via `companyId` (relation definition)
- `prisma/schema.prisma:453-454` - WorkContextTraining references Company via `companyId` (relation definition)
- `prisma/schema.prisma:499-500` - WorkEvent references Company via `companyId` (relation definition)
- `prisma/schema.prisma:571-572` - WorkContextCommunity references Company via `companyId` (relation definition)
- `prisma/schema.prisma:598-599` - WorkContextBenefits references Company via `companyId` (relation definition)
- `prisma/schema.prisma:621-622` - WorkContextCareer references Company via `companyId` (relation definition)
- `prisma/schema.prisma:648-649` - WorkContextEmployeeCause references Company via `companyId` (relation definition)
- `prisma/schema.prisma:668-669` - WorkSupport references Company via `companyId` (relation definition)
- `prisma/schema.prisma:706-707` - WorkOutput references Company via `companyId` (relation definition)
- `prisma/schema.prisma:761-762` - WorkOutputStandalone references Company via `companyId` (relation definition)
- `prisma/schema.prisma:791-792` - NTK references Company via `companyId` (relation definition)
- `prisma/schema.prisma:821-822` - NTKEdition references Company via `companyId` (relation definition)
- `prisma/schema.prisma:867-868` - WorkforceComms references Company via `companyId` (relation definition)
- `prisma/schema.prisma:898-899` - WorkforceCommsDraft references Company via `companyId` (relation definition)
- `prisma/schema.prisma:922-923` - WorkforceCommsEdition references Company via `companyId` (relation definition)

### API Routes
- `app/api/workme/company/route.ts:46-50` - GET: find company by name for lookup (read)
- `app/api/workme/company/route.ts:59-61` - PUT: create company if not exists (write)
- `app/api/workme/company/route.ts:67-70` - PUT: update company if exists (write)
- `app/api/workme/company/route.ts:81` - PUT: link WorkMe to company via `companyId` (write)
- `app/api/workme/company/route.ts:84` - PUT: include company in WorkMe response (read)
- `app/api/workme/company/route.ts:113-124` - GET: search companies by name (read/filter)

### Authentication & Authorization
- `lib/server/verifyAuth.ts:60-70` - verifyAuth includes company relation when fetching WorkMe (read)
- `lib/server/verifyAuth.ts:77-79` - verifyAuth enforces companyId requirement (validation)
- `lib/server/verifyAuth.ts:84-85` - verifyAuth returns companyId and companyName (read)

### Server Actions & Services
- `lib/actions/typed-contexts.ts:20-27` - createWorkContextCampaign uses companyId from verifyAuth (write)
- `lib/actions/typed-contexts.ts:46` - createWorkContextCampaign passes companyId to create (write)
- `lib/actions/typed-contexts.ts:66-72` - createWorkContextImpactEvent uses companyId from verifyAuth (write)
- `lib/actions/typed-contexts.ts:89` - createWorkContextImpactEvent passes companyId to create (write)
- `lib/actions/typed-contexts.ts:109-115` - createWorkContextTraining uses companyId from verifyAuth (write)
- `lib/actions/typed-contexts.ts:134` - createWorkContextTraining passes companyId to create (write)
- `lib/actions/typed-contexts.ts:154-177` - createWorkEvent uses companyId from verifyAuth (write)
- `lib/actions/typed-contexts.ts:186` - createWorkEvent passes companyId to create (write)
- `lib/actions/typed-contexts.ts:209-215` - createWorkContextCommunity uses companyId from verifyAuth (write)
- `lib/actions/typed-contexts.ts:233` - createWorkContextCommunity passes companyId to create (write)
- `lib/actions/typed-contexts.ts:255-270` - createWorkContextBenefits uses companyId from verifyAuth (write)
- `lib/actions/typed-contexts.ts:279` - createWorkContextBenefits passes companyId to create (write)
- `lib/actions/typed-contexts.ts:299-305` - createWorkContextCareer uses companyId from verifyAuth (write)
- `lib/actions/typed-contexts.ts:327` - createWorkContextCareer passes companyId to create (write)
- `lib/actions/typed-contexts.ts:347-366` - createWorkContextEmployeeCause uses companyId from verifyAuth (write)
- `lib/actions/typed-contexts.ts:375` - createWorkContextEmployeeCause passes companyId to create (write)
- `lib/actions/work-output.ts:21-23` - createWorkOutput verifies companyId from verifyAuth (validation)
- `lib/actions/work-output.ts:37` - createWorkOutput filters by companyId for multi-tenant security (filter)
- `lib/actions/work-output.ts:56` - createWorkOutput passes companyId to create (write)
- `lib/actions/work-output.ts:83` - updateWorkOutput filters by companyId for multi-tenant security (filter)
- `lib/actions/work-output.ts:98` - updateWorkOutput passes companyId to update (write)
- `lib/actions/work-output.ts:124-126` - getWorkOutputs verifies companyId from verifyAuth (validation)
- `lib/actions/work-output.ts:133` - getWorkOutputs filters by companyId for multi-tenant security (filter)
- `lib/actions/work-output.ts:169-171` - deleteWorkOutput verifies companyId from verifyAuth (validation)
- `lib/actions/work-output.ts:178` - deleteWorkOutput filters by companyId for multi-tenant security (filter)
- `lib/actions/work-output.ts:207` - getWorkOutputById selects companyId for validation (read)
- `lib/actions/work-output.ts:215-239` - getWorkOutputById extracts companyId from auth or WorkMe (read)
- `lib/actions/work-output.ts:245` - getWorkOutputById filters by companyId for multi-tenant security (filter)
- `lib/actions/work-output.ts:264-266` - duplicateWorkOutput verifies companyId from verifyAuth (validation)
- `lib/actions/work-output.ts:273` - duplicateWorkOutput filters by companyId for multi-tenant security (filter)
- `lib/actions/work-output.ts:295-297` - updateWorkOutputStatus verifies companyId from verifyAuth (validation)
- `lib/actions/work-output.ts:305` - updateWorkOutputStatus filters by companyId for multi-tenant security (filter)
- `lib/actions/work-output.ts:316` - updateWorkOutputStatus passes companyId to update (write)

### API Routes (Context & Ingest)
- `app/api/context/route.ts:16-20` - GET: extracts companyId from verifyAuth (read)
- `app/api/context/route.ts:26` - GET: filters WorkEventRouter by companyId (filter)
- `app/api/context/route.ts:44` - GET: passes companyId to getTypedContext factory (filter)
- `app/api/context/route.ts:55` - GET: includes companyId in response (read)
- `app/api/context/[contextId]/route.ts:21-28` - GET: extracts companyId and filters by it (filter)
- `app/api/context/[contextId]/route.ts:38-39` - GET: passes companyId to getWorkEventRouter (filter)
- `app/api/context/[contextId]/route.ts:89-98` - PUT: extracts companyId and filters by it (filter)
- `app/api/context/[contextId]/route.ts:108-109` - PUT: passes companyId to getWorkEventRouter (filter)
- `app/api/context/[contextId]/route.ts:144` - PUT: includes companyId in update data (write)
- `app/api/context/[contextId]/route.ts:192-199` - DELETE: extracts companyId and filters by it (filter)
- `app/api/context/[contextId]/route.ts:210` - DELETE: passes companyId to deleteTypedContext (filter)
- `app/api/ingest/event/ai/route.ts:36-40` - POST: extracts companyId from verifyAuth (read)
- `app/api/ingest/event/ai/route.ts:209` - POST: passes companyId to createWorkEvent (write)
- `app/api/ingest/event/save/route.ts:20-26` - POST: extracts companyId from verifyAuth (read)
- `app/api/ingest/event/save/route.ts:34` - POST: passes companyId to createWorkEvent (write)
- `app/api/ingest/event/save/route.ts:81` - POST: passes companyId to createWorkEventRouter (write)
- `app/api/workforce-comms/generate/route.ts:14` - POST: extracts companyId from verifyAuth (read)
- `app/api/workforce-comms/generate/route.ts:44-47` - POST: validates product.companyId matches auth companyId (validation)
- `app/api/workforce-comms/generate/route.ts:65` - POST: passes companyId to createWorkforceCommsEdition (write)
- `app/api/workforce-comms/generate/route.ts:73` - POST: passes companyId to getTypedContext factory (filter)
- `app/api/workforce-comms/generate/route.ts:100` - POST: includes companyId in response (read)

### Server Utilities
- `lib/server/get-work-context.ts:13-24` - getWorkEventRouter filters by companyId for multi-tenant security (filter)
- `lib/server/get-work-context.ts:33` - getWorkEventRouter logs companyId for debugging (read)
- `lib/server/gptJsonMapperService.ts:59` - TypeScript interface includes companyId field (type definition)
- `lib/server/gptJsonMapperService.ts:289` - mapWorkEventData accepts companyId parameter (write)
- `lib/server/gptJsonMapperService.ts:315` - mapWorkEventData passes companyId to mapped data (write)

### Scripts & Testing
- `scripts/test-training-workforce-comms-connection.ts:21-23` - Test script finds company for testing (read)
- `scripts/test-training-workforce-comms-connection.ts:32` - Test script filters WorkMe by companyId (filter)
- `scripts/test-training-workforce-comms-connection.ts:40` - Test script logs company.name (read)
- `scripts/test-training-workforce-comms-connection.ts:50` - Test script passes companyId to create WorkforceComms (write)
- `scripts/test-training-workforce-comms-connection.ts:66` - Test script passes companyId to create WorkContextTraining (write)
- `scripts/test-training-workforce-comms-connection.ts:78` - Test script passes companyId to create WorkEventRouter (write)
- `scripts/test-training-workforce-comms-connection.ts:97` - Test script passes companyId to create WorkOutput (write)
- `scripts/verify-phase3c.ts:264-267` - Audit script queries companies (read)
- `scripts/migration-audit.ts:249-251` - Migration audit queries companies (read)
- `scripts/migration-audit.ts:270` - Migration audit logs WorkMe records without companyId (read)
- `scripts/detailed-migration-audit.ts:28` - Detailed audit logs company.name from WorkMe relation (read)
- `scripts/detailed-migration-audit.ts:38-39` - Detailed audit queries companies with employees (read)
- `scripts/detailed-migration-audit.ts:79` - Detailed audit logs creator.company.name (read)
- `scripts/detailed-migration-audit.ts:124` - Detailed audit logs creator.company.name (read)
- `scripts/detailed-migration-audit.ts:187` - Detailed audit logs WorkMe records without companyId (read)

### Documentation
- `docs/WorkEvent.md:73-74` - Documentation shows WorkEvent.companyId relation (reference)
- `docs/WorkEvent.md:82` - Documentation shows companyId index (reference)
- `docs/WorkEvent.md:214` - Documentation shows companyId in example data (reference)
- `docs/AUTH-ARCHITECTURE.md:19-20` - Documentation shows WorkMe.companyId relation (reference)
- `docs/AUTH-ARCHITECTURE.md:82` - Documentation shows verifyAuth returning companyId (reference)
- `docs/AUTH-ARCHITECTURE.md:115` - Documentation shows missing companyId error example (reference)
- `docs/AUTH-ARCHITECTURE.md:137` - Documentation shows verifyAuth returning companyId (reference)
- `docs/AUTH-ARCHITECTURE.md:176` - Documentation shows verifyAuth returning companyId (reference)
- `docs/AUTH-ARCHITECTURE.md:217` - Documentation mentions companyId requirement (reference)
- `docs/AUTH-ARCHITECTURE.md:274` - Documentation shows verifyAuth returning companyId (reference)
- `docs/AUTH-ARCHITECTURE.md:309` - Documentation shows missing companyId error example (reference)
- `docs/AUTH-ARCHITECTURE.md:322` - Documentation shows verifyAuth returning companyId (reference)
- `docs/AUTH-ARCHITECTURE.md:406` - Documentation shows companyId null error (reference)
- `docs/WorkWorldArchitecture.md:27` - Documentation mentions company scoping (reference)
- `PHASE2_SCHEMA_CHANGES.md:146-176` - Migration documentation lists companyId relations (reference)
- `SYSTEM_AUDIT_REPORT.md:630-665` - Audit report lists companyId relations (reference)
- `WORKME_DEV_GUIDE.md:154` - Development guide mentions Company.name search (reference)

## NOTES

- **Company.name is unique globally** and indexed for directory lookups
- **All work output models reference Company** via `companyId` with cascade delete
- **verifyAuth enforces companyId requirement** - users must belong to a company (Phase 2 requirement)
- **Multi-tenant filtering by companyId** is consistently applied throughout API routes and server actions
- **CompanyRegistry (WorkWorld architecture) is separate** from Company model and uses different IDs
- **Company model has no `updatedAt` field** - only `createdAt` exists

