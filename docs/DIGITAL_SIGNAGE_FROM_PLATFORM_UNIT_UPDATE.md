# Digital Signage from Platform Unit Updates

## Overview

This feature allows you to create digital signage products directly from platform unit updates (like "JFK builders trials", "Sea Trials", "Keel Laid", etc.).

## How It Works

### Data Flow

1. **Platform Unit Updates** (`CompanyPlatformUnitUpdate`) are stored with:
   - Status updates (e.g., "Builder's Trials", "Sea Trials")
   - Narrative summaries
   - Progress percentages
   - Dates (keel laid, sea trials start, delivery, commissioning)
   - Links to source statements/articles

2. **Digital Signage Generation** creates a `ProductDigitalSign` with:
   - Type: `COMPANY_NEWS`
   - Headline: Built from unit name + status update
   - Subheadline: Platform class + shipyard + date
   - Body: Narrative summary or AI summary from statement
   - Link: Source URL from statement

### Service Layer

**File:** `lib/services/digital-product-from-platform-unit-update-service.ts`

The service:
- Fetches the platform unit update with related data
- Builds headline from status update (e.g., "USS JFK Builder's Trials")
- Constructs subheadline with platform class, shipyard, and date
- Uses narrative summary or AI summary for body text
- Creates a `COMPANY_NEWS` type digital signage product

### API Endpoint

**Route:** `POST /api/company/products/platform/unit/update/[updateId]/generate-digital-signage`

**Request Body:**
```json
{
  "companyUnit": "optional-unit-name"
}
```

**Response:**
```json
{
  "success": true,
  "digitalSign": {
    "id": "...",
    "signType": "COMPANY_NEWS",
    "companyNews": {
      "headline": "USS JFK Builder's Trials",
      "subheadline": "Virginia Class | General Dynamics Electric Boat | January 15, 2026",
      "body": "...",
      "link": "..."
    }
  },
  "platformUnit": { ... },
  "update": { ... }
}
```

### UI Integration

**Page:** `/mycompany/platforms/updates`

Each platform unit update card now has a **"Create Sign"** button that:
1. Calls the API endpoint
2. Generates the digital signage product
3. Navigates to the digital signage view page (`/mywork/digital-signage/[id]`)

## Usage

### From Platform Unit Updates Page

1. Navigate to `/mycompany/platforms/updates`
2. Find the platform unit update you want to create signage from
3. Click the **"Create Sign"** button
4. You'll be redirected to the digital signage view/edit page

### Programmatically

```typescript
import { digitalProductFromPlatformUnitUpdateService } from '@/lib/services/digital-product-from-platform-unit-update-service'

const result = await digitalProductFromPlatformUnitUpdateService({
  updateId: 'update-id-here',
  createdByWorkMeId: 'workme-id',
  companyUnit: 'optional-unit-name'
})
```

## Example: "JFK Builders Trials"

If you have a platform unit update with:
- **Status Update:** "Builder's Trials"
- **Unit:** USS JFK (SSN-795)
- **Platform:** Virginia Class
- **Narrative Summary:** "The USS John F. Kennedy successfully completed builder's trials..."

The generated digital signage will have:
- **Headline:** "USS JFK Builder's Trials"
- **Subheadline:** "Virginia Class | [Shipyard] | [Date]"
- **Body:** The narrative summary or AI summary
- **Link:** Source URL if available

## Related Files

- Service: `lib/services/digital-product-from-platform-unit-update-service.ts`
- API Route: `app/api/company/products/platform/unit/update/[updateId]/generate-digital-signage/route.ts`
- UI: `app/mycompany/platforms/updates/page.tsx`
- Builder Service: `lib/services/digital-signage-product-builder-service.ts`
- Similar Service (for milestones): `lib/services/digital-product-from-company-milestone-delivery-service.ts`

## Notes

- Digital signage products are created as `COMPANY_NEWS` type
- The service prioritizes narrative summary over AI summary
- If no narrative summary exists, it builds body from status update, progress, and notes
- The digital sign is not directly linked to the platform unit update in the schema (could be added as future enhancement)
