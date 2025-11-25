# Apollo Company Enrichment Architecture

**Last Updated**: January 2025  
**Status**: ✅ Active  
**Provider**: Apollo.io  
**Purpose**: Automatically enrich company identity fields (CEO, mission, headcount, directorates, etc.) using Apollo's enrichment API

---

## Overview

The Apollo Company Enrichment system allows Work.me to automatically populate company identity fields by querying Apollo's company database. This enables rich company profiles with leadership information, mission statements, organizational structure, and social links without manual data entry.

### Key Features

- **Automatic Company Enrichment**: Fetch comprehensive company data from Apollo API
- **Leadership Extraction**: Automatically identify CEO/Commander, Deputy/COO, and Chief of Staff
- **Directorate Detection**: Extract organizational units (e.g., "SEA 02", "SEA 05") from employee data
- **Multi-field Mapping**: Map Apollo's data structure to Work.me's Company model
- **Upsert Logic**: Create or update company records seamlessly
- **Frontend UX**: Simple form-based interface for company enrichment

---

## Architecture

### System Components

```
┌─────────────────┐
│  Frontend UX    │  app/(authenticated)/workme/company/enrich/page.tsx
└────────┬────────┘
         │ POST /api/enrich/company
         ▼
┌─────────────────┐
│  API Route      │  app/api/enrich/company/route.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Server Action  │  lib/actions/company-enrichment.ts
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────────────┐
│ Apollo  │ │  Enrichment Service │
│ Client  │ │  companyEnrichment  │
└────┬────┘ │  Service.ts          │
     │      └──────────┬───────────┘
     │                 │
     │                 ▼
     │         ┌──────────────┐
     │         │   Prisma     │
     │         │   Database   │
     │         └──────────────┘
     │
     ▼
┌─────────────────┐
│  Apollo API     │  https://api.apollo.io/v1/mixed_data/company
└─────────────────┘
```

### File Structure

```
workme-nextapp/
├── lib/
│   ├── external/
│   │   └── apolloClient.ts              # Apollo API client
│   ├── server/
│   │   └── companyEnrichmentService.ts   # Data normalization service
│   └── actions/
│       └── company-enrichment.ts         # Server action (upsert logic)
├── app/
│   ├── api/
│   │   └── enrich/
│   │       └── company/
│   │           └── route.ts              # API endpoint
│   └── (authenticated)/
│       └── workme/
│           └── company/
│               └── enrich/
│                   └── page.tsx          # Frontend UX
└── prisma/
    └── schema.prisma                      # Company model with enrichment fields
```

---

## Data Flow

### 1. User Input
User enters company name in the frontend form (`/workme/company/enrich`)

### 2. API Request
Frontend sends POST request to `/api/enrich/company` with:
```json
{
  "companyName": "Naval Sea Systems Command"
}
```

### 3. Authentication
API route verifies user authentication via `verifyAuth()`

### 4. Apollo Enrichment
Server action calls `enrichCompanyApollo()` which:
- Fetches from Apollo API: `POST /v1/mixed_data/company`
- Includes `enrich_people: true` to get employee data
- Returns raw Apollo response

### 5. Data Normalization
`mapApolloToCompany()` transforms Apollo data:
- Extracts leadership roles (CEO, Deputy, Chief of Staff)
- Identifies directorates from employee departments
- Maps fields to Work.me Company model
- Converts arrays to CSV strings where needed

### 6. Database Upsert
`enrichAndUpsertCompany()` performs:
- Upsert by company name (unique constraint)
- Creates new company if doesn't exist
- Updates existing company if found

### 7. Response
Returns enriched company object to frontend for preview

---

## Company Model Fields

### Identity Fields (New)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `missionStatement` | String? | `company.description` | Company mission/description |
| `vision` | String? | Manual/Apollo | Company vision statement |
| `values` | String? | `company.keywords[]` | CSV string of company values |
| `brandTagline` | String? | Manual | Brand tagline |
| `brandLogoUrl` | String? | `company.logo_url` | Company logo URL |
| `brandColorPrimary` | String? | Manual | Primary brand color |
| `brandColorSecondary` | String? | Manual | Secondary brand color |

### Leadership Fields (New)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ceoName` | String? | Employee extraction | CEO/Commander name |
| `ceoTitle` | String? | Employee extraction | CEO/Commander title |
| `deputyName` | String? | Employee extraction | Deputy/COO name |
| `deputyTitle` | String? | Employee extraction | Deputy/COO title |
| `chiefOfStaff` | String? | Employee extraction | Chief of Staff name |

### Organization Fields (New)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `directorates` | String[] | Employee extraction | Array of directorates (e.g., ["SEA 02", "SEA 05"]) |

### Social/Public Fields (New)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `linkedinUrl` | String? | `company.linkedin_url` | LinkedIn company page |
| `twitterUrl` | String? | `company.twitter_url` | Twitter handle/URL |
| `facebookUrl` | String? | `company.facebook_url` | Facebook page URL |
| `phone` | String? | `company.primary_phone.number` or `company.phone` | Primary phone number |

### Address Fields (New)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `country` | String? | `company.address.country` | Company country |

### Existing Fields (Enhanced)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `name` | String | User input | Company name (unique) |
| `industry` | String? | `company.industry` | Industry classification |
| `website` | String? | `company.website_url` or `company.domain` | Company website |
| `city` | String? | `company.address.city` | Company city |
| `state` | String? | `company.address.state` | Company state |
| `description` | String? | `company.description` | Company description |
| `headcount` | Int? | `company.estimated_num_employees` | Estimated employee count |

---

## Apollo API Integration

### Endpoint

**URL**: `https://api.apollo.io/v1/mixed_data/company`  
**Method**: `POST`  
**Authentication**: 
- Header: `X-Api-Key: {APOLLO_API_KEY}`
- Header: `Authorization: Bearer {APOLLO_API_TOKEN}`

### Request Body

```json
{
  "name": "Naval Sea Systems Command",
  "enrich_people": true
}
```

### Response Structure

```typescript
{
  company?: {
    id?: string
    name?: string
    description?: string
    estimated_num_employees?: number
    industry?: string
    website_url?: string
    domain?: string
    linkedin_url?: string
    twitter_url?: string
    facebook_url?: string
    phone?: string
    address?: {
      city?: string
      state?: string
      country?: string
    }
    keywords?: string[]
    employees?: Array<{
      id?: string
      first_name?: string
      last_name?: string
      name?: string
      title?: string
      seniority?: string
      department?: string
      employment_history?: Array<{
        title?: string
        company_name?: string
        department?: string
      }>
    }>
    logo_url?: string
    primary_phone?: {
      number?: string
    }
  }
  people?: Array<{
    // Same structure as company.employees
  }>
}
```

---

## Leadership Extraction Logic

### Role Matching

The system uses fuzzy matching to identify leadership roles from employee titles:

#### CEO/Commander
Matches if title contains:
- "commander"
- "chief executive"
- "ceo"
- "executive director" (but not "deputy executive director")

#### Deputy/COO
Matches if title contains:
- "deputy"
- "chief operating"
- "coo"
- "executive director" + "deputy"

#### Chief of Staff
Matches if title contains:
- "chief of staff"
- "chief-of-staff"

### Extraction Priority

1. First match wins (stops after finding CEO, Deputy, or Chief of Staff)
2. Uses full name from `name` field or combines `first_name` + `last_name`
3. Stores both name and title for reference

---

## Directorate Extraction

### Pattern Matching

Extracts directorates using regex pattern: `/SEA\s*\d+/gi`

### Sources

1. **Employee Department**: Checks `employee.department` field
2. **Employment History**: Checks `employee.employment_history[].department`
3. **Employment History Title**: Checks `employee.employment_history[].title`

### Example

If employee has:
- `department: "SEA 02 Engineering"`
- `employment_history[0].department: "SEA 05 Operations"`

Result: `directorates: ["SEA 02", "SEA 05"]`

### Deduplication

- Uses `Set` to ensure unique directorates
- Sorts alphabetically before returning

---

## Field Mapping Details

### Values Field

**Source**: `company.keywords[]` (array)  
**Target**: `values` (CSV string)  
**Transformation**: `keywords.join(', ')`

Example:
- Apollo: `["Innovation", "Excellence", "Service"]`
- Work.me: `"Innovation, Excellence, Service"`

### Website Field

**Priority**:
1. `company.website_url` (if exists)
2. `https://${company.domain}` (if domain exists)
3. `undefined` (if neither exists)

### Phone Field

**Priority**:
1. `company.primary_phone.number` (if exists)
2. `company.phone` (fallback)
3. `undefined` (if neither exists)

### Mission Statement

**Source**: `company.description`  
**Note**: Apollo's `description` field is mapped to both `missionStatement` and `description` in Work.me

---

## API Reference

### POST /api/enrich/company

**Authentication**: Required (Bearer token via `verifyAuth()`)

**Request Body**:
```json
{
  "companyName": "Naval Sea Systems Command"
}
```

**Response** (Success):
```json
{
  "success": true,
  "company": {
    "id": "uuid",
    "name": "Naval Sea Systems Command",
    "missionStatement": "...",
    "ceoName": "John Doe",
    "ceoTitle": "Commander",
    "directorates": ["SEA 02", "SEA 05"],
    // ... other fields
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "Error message"
}
```

**Status Codes**:
- `200` - Success
- `400` - Missing or invalid `companyName`
- `401` - Unauthorized (missing/invalid token)
- `500` - Server error (Apollo API failure, etc.)

---

## Frontend UX

### Route

`/workme/company/enrich`

### Features

1. **Company Name Input**: Text field for company name
2. **Enrich Button**: Triggers enrichment API call
3. **Loading State**: Shows "Enriching..." during API call
4. **Error Handling**: Displays error messages if enrichment fails
5. **Preview Section**: Shows all enriched fields in organized sections:
   - Basic Information (name, industry, headcount, website)
   - Location (city, state, country, phone)
   - Leadership (CEO, Deputy, Chief of Staff)
   - Identity (mission, vision, values, directorates)
   - Social Links (LinkedIn, Twitter, Facebook)
6. **Save Button**: Applies enrichment (company already saved via upsert)

### UI Sections

- **Input Form**: Company name input + Enrich button
- **Preview Grid**: 2-column responsive grid showing enriched data
- **Action Button**: "Apply / Save" button (redirects to dashboard)

---

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Apollo API Credentials
APOLLO_API_KEY=your_apollo_api_key_here
APOLLO_API_TOKEN=your_apollo_api_token_here
```

### Getting Apollo Credentials

1. Sign up for Apollo.io account
2. Navigate to Settings → API
3. Generate or copy your API key and token
4. Add to environment variables

### Database Migration

Run Prisma migration to add new Company fields:

```bash
npx prisma migrate dev --name add_company_identity_fields
```

---

## Usage Examples

### Example 1: Enrich Government Agency

**Input**: "Naval Sea Systems Command"

**Expected Results**:
- ✅ CEO/Commander extracted from employee data
- ✅ Directorates extracted (SEA 02, SEA 05, etc.)
- ✅ Mission statement populated
- ✅ Headcount estimated
- ✅ Website and social links populated

### Example 2: Enrich Tech Company

**Input**: "Google"

**Expected Results**:
- ✅ CEO name and title extracted
- ✅ Industry: "Technology"
- ✅ Headcount: Large number
- ✅ Website: google.com
- ✅ Social links (LinkedIn, Twitter)

### Example 3: Enrich Space Agency

**Input**: "NASA"

**Expected Results**:
- ✅ Leadership roles extracted
- ✅ Mission statement populated
- ✅ Directorates (if applicable)
- ✅ Social media links

---

## Error Handling

### Apollo API Errors

- **Missing API Key**: Throws error if `APOLLO_API_KEY` not set
- **Missing API Token**: Throws error if `APOLLO_API_TOKEN` not set
- **API Failure**: Returns error message with status code
- **Network Errors**: Caught and returned as user-friendly messages

### Data Validation

- **Empty Company Name**: Returns 400 error
- **Invalid Company Name**: Apollo API may return empty response (handled gracefully)
- **Missing Fields**: All fields are optional - enrichment continues even if some fields missing

### Resilience

- **Leadership Extraction**: Continues if no leadership roles found
- **Directorate Extraction**: Returns empty array if no directorates found
- **Field Mapping**: Only populates fields that Apollo returns (doesn't overwrite with undefined)

---

## Testing

### Test Cases

1. **"Naval Sea Systems Command"**
   - Verify CEO extraction
   - Verify directorates (SEA patterns)
   - Verify mission statement

2. **"NASA"**
   - Verify leadership extraction
   - Verify mission/vision
   - Verify headcount

3. **"Google"**
   - Verify tech company fields
   - Verify social links
   - Verify website

### Manual Testing

1. Navigate to `/workme/company/enrich`
2. Enter company name
3. Click "Enrich"
4. Verify preview shows all populated fields
5. Click "Apply / Save"
6. Verify company saved in database

---

## Architecture Decisions

### Why Upsert?

- Companies may already exist in database
- Enrichment should update existing records, not create duplicates
- Uses `name` as unique identifier (enforced by schema)

### Why Server Actions?

- Server-side only (never exposed to client)
- Direct database access via Prisma
- Type-safe with TypeScript

### Why Separate Enrichment Service?

- Separation of concerns (API client vs. data transformation)
- Reusable normalization logic
- Easier to test and maintain

### Why Fuzzy Leadership Matching?

- Apollo titles vary in format
- "Commander" vs "CEO" vs "Executive Director"
- Flexible matching ensures we catch variations

### Why Directorate Regex?

- Government agencies use standardized patterns (SEA 02, SEA 05)
- Regex is flexible enough to catch variations
- Can be extended for other patterns if needed

---

## Future Enhancements

### Potential Improvements

1. **Batch Enrichment**: Enrich multiple companies at once
2. **Scheduled Enrichment**: Auto-refresh company data periodically
3. **Enrichment History**: Track when companies were last enriched
4. **Manual Override**: Allow users to manually edit enriched fields
5. **Brand Color Detection**: Extract brand colors from logo (image analysis)
6. **Additional Patterns**: Support more directorate/unit patterns beyond SEA
7. **Enrichment Quality Score**: Rate completeness of enrichment data

---

## Related Documentation

- [Company Model Inspection](./COMPANY_MODEL_INSPECTION.md) - Complete Company model reference
- [Authentication Architecture](./AUTH-ARCHITECTURE.md) - Auth system details
- [Work.me Development Guide](../WORKME_DEV_GUIDE.md) - General development patterns

---

## Support

For issues or questions:
1. Check Apollo API documentation: https://apolloio.github.io/apollo-api-docs/
2. Verify environment variables are set correctly
3. Check API response in browser network tab
4. Review server logs for Apollo API errors

