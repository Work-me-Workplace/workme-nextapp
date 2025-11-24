# Event AI Ingestion Pipeline

**Last Updated:** 2025-01-24  
**Purpose:** Parse unstructured event text into structured WorkEvent + EventItem data using OpenAI

---

## Architecture

### Universal Ingestion Pattern

All ingestion endpoints follow this pattern:

```
/api/ingest/{domain}/{feature}/{method}
```

**Example:**
- `/api/ingest/event/ai` - Event domain, AI method

This pattern allows for future ingestion endpoints:
- `/api/ingest/event/manual`
- `/api/ingest/campaign/ai`
- `/api/ingest/training/ai`

---

## API Endpoint

### POST /api/ingest/event/ai

**Location:** `app/api/ingest/event/ai/route.ts`

**Request Body:**
```typescript
{
  rawText: string
  userContext?: {
    eventDate?: string
    category?: string
    startTime?: string
    endTime?: string
  }
}
```

**Response (Success):**
```typescript
{
  success: true
  data: {
    event: ParsedWorkEvent
    items: ParsedEventItem[]
  }
}
```

**Response (Error):**
```typescript
{
  success: false
  error: string
}
```

**Key Features:**
- ✅ Does NOT save to database (pure parsing endpoint)
- ✅ Uses OpenAI GPT-4o-mini (configurable via `OPENAI_MODEL` env var)
- ✅ Structured JSON output via `response_format: { type: 'json_object' }`
- ✅ Validates response structure
- ✅ Handles OpenAI-specific errors (rate limits, auth, etc.)

---

## AI System Prompt

**Exact prompt as specified:**

```
You convert messy government or corporate event announcements into structured data.
Parse the high-level details into a WorkEvent object and break any agenda/schedule
information into EventItem entries. Use human-readable time strings. Use null for 
missing fields. Preserve POC details, logistics, and sequence. Do not fabricate.
```

**User Prompt Template:**
- Includes `rawText` verbatim
- Includes `userContext` if provided
- Instructions to infer missing information where obvious

---

## Expected AI Output Structure

```typescript
{
  "event": {
    "title": string,
    "description": string | null,
    "eventDate": string | null,           // "2025-12-17"
    "startTime": string | null,           // "11:30 a.m."
    "endTime": string | null,             // "1:30 p.m."
    "eventCategory": string | null,
    "registrationRequired": string | null, // "Yes" or "No"
    "registrationLink": string | null,
    "speakers": string[] | null,
    "foodProvided": string | null,        // "Yes" or "No"
    "foodTypes": string | null,
    "promotionNeeds": string[] | null,
    "pocFirstName": string | null,
    "pocLastName": string | null,
    "pocEmail": string | null,
    "pocPhone": string | null,
    "location": string | null
  },
  "items": [
    {
      "title": string,
      "description": string | null,
      "metadata": object | null
    }
  ]
}
```

---

## Frontend Integration

### EventAIForm Component

**Location:** `components/events/EventAIForm.tsx`

**Features:**
- Large textarea for `rawText` input
- Optional user context fields (eventDate, category, startTime, endTime)
- Optional file upload (UI ready, OCR not yet implemented)
- "Parse With AI" button
- Displays parsed event items count
- Auto-fills EventManualForm with parsed data

**Flow:**
1. User pastes event text
2. Optionally provides context hints
3. Clicks "Parse With AI"
4. POST to `/api/ingest/event/ai`
5. Receives `{ event, items }`
6. Auto-fills form with event data
7. Stores EventItems in component state
8. User can edit before submitting

### EventManualForm Component

**Location:** `components/events/EventManualForm.tsx`

**Updates:**
- Accepts `initialEventItems?: ParsedEventItem[]` prop
- Displays event items preview
- Stores items in component state (not yet saved to DB)

---

## TypeScript Types

**Location:** `lib/types/event-ingestion.ts`

**Exports:**
- `EventIngestionRequest` - Request body type
- `ParsedWorkEvent` - Parsed event structure
- `ParsedEventItem` - Parsed item structure
- `EventIngestionResponse` - Response data structure
- `EventIngestionAPIResponse` - Success response
- `EventIngestionAPIError` - Error response

---

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `OPENAI_MODEL` - Model to use (default: `gpt-4o-mini`)

---

## Error Handling

The endpoint handles:
- Missing `rawText` → 400 Bad Request
- Missing `OPENAI_API_KEY` → 500 with clear error
- Invalid OpenAI API key → 500 with auth error
- Rate limit exceeded → 429 with retry message
- Invalid JSON response → 500 with parse error
- Missing required fields → 500 with validation error

---

## Future Enhancements

### File Upload OCR
- Currently accepts file upload but doesn't process
- Future: Extract text from images using OCR (Tesseract, Google Vision, etc.)

### EventItem Persistence
- Currently stores EventItems in component state
- Future: Save EventItems to database when WorkEvent is created

### Batch Processing
- Future: Support multiple events in single request
- Future: Support CSV/Excel file parsing

---

## Usage Example

```typescript
// Frontend call
const response = await fetch('/api/ingest/event/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rawText: "Holiday Open House\nDecember 17, 2025\n11:30 AM - 1:30 PM\nMain Auditorium\nRSVP required...",
    userContext: {
      eventDate: "2025-12-17",
      category: "Holiday Open House"
    }
  })
})

const result = await response.json()
if (result.success) {
  const { event, items } = result.data
  // Use event and items to populate form
}
```

---

## Integration Notes

### Current State
- ✅ API endpoint implemented and tested
- ✅ Frontend integration complete
- ✅ TypeScript types defined
- ✅ Error handling in place
- ⏳ EventItems stored in state (not yet persisted)
- ⏳ File OCR not yet implemented

### Next Steps
1. Implement EventItem creation when WorkEvent is saved
2. Add OCR for image file uploads
3. Add validation for parsed data before form submission
4. Add preview/edit UI for EventItems before submission

---

**End of Event AI Ingestion Documentation**

