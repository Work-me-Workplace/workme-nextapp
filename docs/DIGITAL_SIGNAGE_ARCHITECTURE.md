# Digital Signage Architecture

## Overview

Digital Signage is a MyWork product type that creates display content for workforce communications. The system follows a modular architecture under the MyWork domain pattern.

**Note:** The old `worksupport` method is deprecated. All digital signage functionality is now under `/mywork/digital-signage`.

## Route Structure

### API Routes

All digital signage API routes are under `/api/mywork/digital-signage/`:

- `POST /api/mywork/digital-signage/create` - Create/save digital signage product
- `GET /api/mywork/digital-signage/[id]` - Get digital signage by ID
- `POST /api/digital-signage/parse-raw` - Parse raw text with GPT (Step 1)

**Note:** The parse-raw route remains at `/api/digital-signage/parse-raw` as it's a utility service, not a MyWork-specific route.

### Page Routes

All digital signage pages are under `/mywork/digital-signage/`:

- `/mywork/digital-signage/new` - Sign type selection
- `/mywork/digital-signage/builder/new?type={TYPE}` - Builder form
- `/mywork/digital-signage/[id]` - View/edit digital signage

## Workflow: Workforce Achievement

### Step 1: Parse Raw Text with GPT

**Route:** `POST /api/digital-signage/parse-raw`

**Input:**
```json
{
  "personName": "Peter McCauley",
  "unit": "SEA 05",
  "achievement": "outstanding leadership",
  "details": "Raw citation text, JSON, or article content..."
}
```

**Process:**
1. Takes raw text from `details` field
2. Sends to GPT via `buildDigitalSignFromHighlight` service
3. GPT uses the CommsIQ Signage Build Guide v2.0 system prompt
4. Returns structured output

**Output:**
```json
{
  "success": true,
  "data": {
    "headline": "Peter McCauley — Excellence Award",
    "subhead": "Congratulations, Peter! Recognized by SEA 05 for outstanding leadership...",
    "detailBlock": "NAVSEA Excellence Award · 2025",
    "runtimeGuidance": "1 week",
    "suggestedImageDescription": "Use award presentation handshake photo."
  }
}
```

### Step 2: Review & Edit GPT Output

User can edit all GPT-generated fields:
- `headline` (required)
- `subhead` (optional)
- `detailBlock` (optional)
- `runtimeGuidance` (defaults to "1 week")

### Step 3: Add Photo (Optional)

**Component:** `AssetUploader`

**Process:**
1. User uploads photo file
2. Calls `/api/assets/store` (Vercel Blob storage)
3. Returns asset with `{ id, url, filename }`
4. Stores `imageAssetId` for linking to digital signage

**Success:** Photo URL is stored in `imageAssetId` field

### Step 4: Save Digital Signage

**Route:** `POST /api/mywork/digital-signage/create`

**Input:**
```json
{
  "signType": "WORKFORCE_ACHIEVEMENT",
  "companyUnit": "SEA 05",
  "workforceAchievement": {
    "headline": "Peter McCauley — Excellence Award",
    "subhead": "Congratulations, Peter!...",
    "detailBlock": "NAVSEA Excellence Award · 2025",
    "runtimeGuidance": "1 week",
    "imageAssetId": "asset-id-here"
  }
}
```

**Process:**
1. Validates `headline` is required
2. Creates `ProductDigitalSign` record
3. Creates `ProductDigitalSignWorkforceAchievement` record with all fields
4. Links to `Asset` via `imageAssetId` if provided

**Output:**
```json
{
  "success": true,
  "signage": {
    "id": "...",
    "signType": "WORKFORCE_ACHIEVEMENT",
    "workforceAchievement": { ... }
  }
}
```

## GPT Service: digitalSignEmployeeHighlightBuilder

**Location:** `lib/services/digital-sign-employee-highlight-builder-service.ts`

**System Prompt:** Uses the exact CommsIQ Signage Build Guide v2.0 prompt with:
- Recognition phrase mapping (EXCELLENCE → "Excellence Award", etc.)
- Subhead format: "Congratulations, {FirstName}!"
- Detail block format: "{awardName} · {awardYear}"
- Runtime guidance: always "1 week"
- Image description suggestions

**Input Format:**
```json
{
  "employee": {
    "fullName": "Sarah Johnson",
    "companyUnit": "SEA 05"
  },
  "highlight": {
    "classification": "LEADERSHIP",
    "awardName": "NAVSEA Excellence Award",
    "awardYear": 2025,
    "awardingAgency": "NAVSEA 05",
    "achievement": "outstanding leadership",
    "citationText": "Full citation text..."
  }
}
```

**Output Format:**
```json
{
  "headline": "Sarah Johnson — Leadership Recognition",
  "subhead": "Congratulations, Sarah! Recognized by NAVSEA 05 for outstanding leadership...",
  "detailBlock": "NAVSEA Excellence Award · 2025",
  "runtimeGuidance": "1 week",
  "suggestedImageDescription": "Use award presentation handshake photo."
}
```

## Database Models

### ProductDigitalSign
- `id` (cuid)
- `signType` (enum: WORKFORCE, COMPANY_NEWS, WORKFORCE_ACHIEVEMENT, COMPANY_EVENT)
- `companyUnit` (string)
- `createdByWorkMeId` (FK to WorkMe)

### ProductDigitalSignWorkforceAchievement
- `id` (cuid)
- `signageId` (FK to ProductDigitalSign, unique)
- `headline` (required string)
- `subhead` (optional string)
- `detailBlock` (optional string)
- `runtimeGuidance` (optional string)
- `imageAssetId` (FK to Asset, optional)
- `employeeId` (optional string)
- `highlightId` (optional string)

## Deprecated

- `worksupport` - Old method, no longer used
- `/api/digital-signage/create` (root level) - Moved to `/api/mywork/digital-signage/create`

## File Structure

```
app/
  api/
    mywork/
      digital-signage/
        create/
          route.ts          # Save route (Step 4)
    digital-signage/
      parse-raw/
        route.ts            # GPT parsing route (Step 1)
  mywork/
    digital-signage/
      builder/
        new/
          page.tsx          # Builder form with 3-step workflow
      [id]/
        page.tsx            # View/edit page
      new/
        page.tsx            # Sign type selection

lib/
  services/
    digital-sign-employee-highlight-builder-service.ts  # GPT service

components/
  assets/
    AssetUploader.tsx      # Photo upload component
```

## Key Principles

1. **MyWork Domain Pattern**: All routes under `/mywork/digital-signage/`
2. **GPT-First Workflow**: Always parse raw text with GPT before saving
3. **Editable Output**: User can modify GPT output before saving
4. **Asset System**: Photos use the Asset system (Vercel Blob) via `imageAssetId`
5. **Structured Data**: Save route expects structured data (headline, subhead, etc.), not raw text
