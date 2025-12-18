# Email Digest Generator - "The Compiler"

**Last Updated:** 2025-12-17  
**Status:** ⚠️ **PLACEHOLDER** - Needs OpenAI Integration

---

## 🎯 WHAT IS THE GENERATOR?

The **generator** is the function that takes curated `EmailDigestItem` records and **compiles them into actual email content** using AI.

**Location:** `lib/actions/email-digest.ts` → `generateEditionContent()` + `generateEmailDigestContent()`

---

## 🔄 THE GENERATION FLOW

```
USER CLICKS "GENERATE"
  ↓
┌─────────────────────────────────────────────────────────────────┐
│ generateEditionContent(editionId)                               │
│ (Lines 306-381 in lib/actions/email-digest.ts)                 │
└─────────────────────────────────────────────────────────────────┘
  ↓
1. FETCH edition + items + CompanyX data
  ↓
  Query: EmailDigestEdition
    .include({
      items: {
        include: { companyEvent, companyCampaign, companyTraining, ... }
      }
    })
  ↓
  Result: Edition with fully populated items:
  {
    id: "edition-123",
    status: "DRAFT",
    items: [
      {
        order: 1,
        notes: "Emphasize family-friendly",
        companyEvent: { title: "Holiday Party", description: "...", ... }
      },
      {
        order: 2,
        notes: null,
        companyCampaign: { title: "Blood Drive", summary: "...", ... }
      },
      ...
    ]
  }
  ↓
2. UPDATE status → "GENERATING"
  ↓
  await prisma.emailDigestEdition.update({
    where: { id },
    data: { status: 'GENERATING' }
  })
  ↓
3. BUILD PROMPT from items
  ↓
┌─────────────────────────────────────────────────────────────────┐
│ buildPromptFromItems(items)                                     │
│ (Lines 384-423 in lib/actions/email-digest.ts)                 │
└─────────────────────────────────────────────────────────────────┘
  ↓
  Input: Array of items with CompanyX data
  Output: Text prompt
  
  Example:
  "[EVENT] Holiday Party: Annual company holiday celebration...
    Note: Emphasize family-friendly
   [CAMPAIGN] Blood Drive: Help save lives...
   [TRAINING] Cybersecurity Awareness: Complete by Dec 31..."
  ↓
4. CALL AI GENERATOR
  ↓
┌─────────────────────────────────────────────────────────────────┐
│ generateEmailDigestContent(promptText, productTitle)            │
│ (Lines 534-542 in lib/actions/email-digest.ts)                 │
│                                                                 │
│ ⚠️ CURRENTLY A PLACEHOLDER - NEEDS OPENAI                       │
└─────────────────────────────────────────────────────────────────┘
  ↓
  ⚠️ Current: Returns dummy JSON
  ✅ Should: Call OpenAI API
  ↓
  Output: Generated content JSON
  {
    subject: "Weekly Update - December 17, 2025",
    body: "<html>...",
    sections: [...]
  }
  ↓
5. SAVE & UPDATE status → "GENERATED"
  ↓
  await prisma.emailDigestEdition.update({
    where: { id },
    data: {
      status: 'GENERATED',
      contentJson: generatedContent
    }
  })
  ↓
DONE! Edition now has generated content
```

---

## 📝 CURRENT CODE (The Placeholder)

### Location: `lib/actions/email-digest.ts`

### 1. Main Generator Function (Lines 306-381)

```typescript
export async function generateEditionContent(editionId: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    // Get edition with items and related CompanyX data
    const edition = await prisma.emailDigestEdition.findFirst({
      where: { id: editionId, companyId },
      include: {
        product: true,
        items: {
          include: {
            companyEvent: true,
            companyCampaign: true,
            companyTraining: true,
            companyBenefits: true,
            companyImpactEvent: true,
            companyCommunity: true,
            companyCareer: true,
            companyEmployeeCause: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!edition || edition.items.length === 0) {
      return { success: false, error: 'No items selected' }
    }

    // Update status to GENERATING
    await prisma.emailDigestEdition.update({
      where: { id: editionId },
      data: { status: 'GENERATING' },
    })

    // Build prompt from selected items
    const promptText = buildPromptFromItems(edition.items)

    // ⚠️ THIS IS THE PLACEHOLDER CALL
    const generatedContent = await generateEmailDigestContent(
      promptText,
      edition.product.title
    )

    // Update edition with generated content
    await prisma.emailDigestEdition.update({
      where: { id: editionId },
      data: {
        status: 'GENERATED',
        contentJson: generatedContent,
      },
    })

    return { success: true, content: generatedContent }
  } catch (error) {
    // Revert status on error
    await prisma.emailDigestEdition.update({
      where: { id: editionId },
      data: { status: 'DRAFT' },
    })
    return { success: false, error: 'Failed to generate' }
  }
}
```

---

### 2. Prompt Builder (Lines 384-423)

```typescript
function buildPromptFromItems(items: any[]): string {
  const summaries: string[] = []

  items.forEach((item) => {
    // Get the linked CompanyX record
    const source =
      item.companyEvent ||
      item.companyCampaign ||
      item.companyTraining ||
      item.companyBenefits ||
      item.companyImpactEvent ||
      item.companyCommunity ||
      item.companyCareer ||
      item.companyEmployeeCause

    if (source) {
      // Determine type
      const type = item.companyEvent
        ? 'EVENT'
        : item.companyCampaign
        ? 'CAMPAIGN'
        : item.companyTraining
        ? 'TRAINING'
        : item.companyBenefits
        ? 'BENEFITS'
        : item.companyImpactEvent
        ? 'IMPACT EVENT'
        : item.companyCommunity
        ? 'COMMUNITY'
        : item.companyCareer
        ? 'CAREER'
        : 'EMPLOYEE CAUSE'

      // Format: [TYPE] Title: Description
      summaries.push(
        `[${type}] ${source.title}: ${source.summary || source.description || 'No description'}`
      )
      
      // Add user notes if provided
      if (item.notes) {
        summaries.push(`  Note: ${item.notes}`)
      }
    }
  })

  return summaries.join('\n')
}
```

**Example Output:**
```
[EVENT] Holiday Party: Annual company holiday celebration for employees and families
  Note: Emphasize family-friendly aspect
[CAMPAIGN] Blood Drive: Help save lives by donating blood, ends December 22
[TRAINING] Cybersecurity Awareness Training: Complete mandatory training by Dec 31
  Note: Deadline is Dec 31
```

---

### 3. ⚠️ THE PLACEHOLDER (Lines 534-542)

```typescript
async function generateEmailDigestContent(
  promptText: string,
  productTitle: string
): Promise<any> {
  // TODO: Implement actual OpenAI API integration
  // For now, return a placeholder structure
  return {
    subject: `${productTitle} - ${new Date().toLocaleDateString()}`,
    body: `This is a placeholder generated email digest.\n\nContent:\n${promptText.substring(0, 500)}...\n\nTODO: Integrate with OpenAI API to generate actual content.`,
    generatedAt: new Date().toISOString(),
  }
}
```

**What it should do:**
- Call OpenAI API with the prompt
- Get structured email content back
- Return formatted result

**What it currently does:**
- Returns dummy text with truncated prompt

---

## ✅ WHAT NEEDS TO BE IMPLEMENTED

### Replace Placeholder with Real OpenAI Integration

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function generateEmailDigestContent(
  promptText: string,
  productTitle: string
): Promise<{
  subject: string
  body: string
  sections: Array<{
    type: string
    sourceId: string
    title: string
    content: string
  }>
  generatedAt: string
}> {
  // System prompt defining the AI's role
  const systemPrompt = `You are a workforce communications expert creating engaging email digests.
  
Your task:
- Create professional, engaging email content from the provided items
- Maintain a friendly, informative tone
- Organize content into clear sections
- Include calls-to-action where appropriate
- Format for HTML email display

Return JSON with this structure:
{
  "subject": "Email subject line",
  "body": "Full HTML email body",
  "sections": [
    {
      "type": "event|campaign|training|etc",
      "title": "Section title",
      "content": "HTML content for this section"
    }
  ]
}`

  // User prompt with the actual items
  const userPrompt = `Create an email digest with these items:\n\n${promptText}\n\nEmail series title: "${productTitle}"`

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  // Parse response
  const content = response.choices[0].message.content
  const parsed = JSON.parse(content || '{}')

  return {
    subject: parsed.subject || `${productTitle} - ${new Date().toLocaleDateString()}`,
    body: parsed.body || '',
    sections: parsed.sections || [],
    generatedAt: new Date().toISOString(),
  }
}
```

---

## 🎨 EXAMPLE: What the Generator Produces

### Input (from buildPromptFromItems):
```
[EVENT] Holiday Party: Annual company holiday celebration for employees and families
  Note: Emphasize family-friendly aspect
[CAMPAIGN] Blood Drive: Help save lives by donating blood, ends December 22
[TRAINING] Cybersecurity Awareness Training: Complete mandatory training by Dec 31
  Note: Deadline is Dec 31
```

### Output (stored in edition.contentJson):
```json
{
  "subject": "Weekly Workforce Update - December 17, 2025",
  "body": "<html><body><h1>Your Weekly Update</h1><p>Here's what's happening this week...</p>...",
  "sections": [
    {
      "type": "event",
      "sourceId": "holiday-party-123",
      "title": "🎄 Holiday Party - This Friday!",
      "content": "<p>Join us for our annual <strong>family-friendly</strong> holiday celebration...</p>"
    },
    {
      "type": "campaign",
      "sourceId": "blood-drive-456",
      "title": "🩸 Blood Drive - Last Chance!",
      "content": "<p>Help save lives by donating blood before December 22...</p>"
    },
    {
      "type": "training",
      "sourceId": "cybersec-789",
      "title": "🔒 Cybersecurity Training Due Dec 31",
      "content": "<p>Don't forget to complete your mandatory training by the deadline...</p>"
    }
  ],
  "generatedAt": "2025-12-17T10:30:00.000Z"
}
```

---

## 🔌 INTEGRATION POINTS

### Where the Generator is Called

**API Route:** `/app/api/workforce/enduring/email-digest/[emailDigestId]/editions/[editionId]/generate/route.ts` (to be created)

**Current Call Location:** None yet - need to create generate endpoint

**Proposed Flow:**
```
User clicks "Generate" button in curation UI
  ↓
POST /api/workforce/enduring/email-digest/[id]/editions/[editionId]/generate
  ↓
Call generateEditionContent(editionId)
  ↓
Returns generated content
  ↓
Redirect to preview page
```

---

## 🚨 CURRENT ISSUES

1. **No OpenAI Integration** - Just returns placeholder text
2. **No Error Handling** - If OpenAI fails, what happens?
3. **No Retry Logic** - Should retry on failures
4. **No Cost Tracking** - OpenAI calls cost money
5. **No Rate Limiting** - Could spam OpenAI API
6. **No Content Validation** - What if OpenAI returns invalid JSON?
7. **No Preview Before Save** - Immediately saves to DB

---

## 🎯 IMPLEMENTATION CHECKLIST

### Phase 1: Basic OpenAI Integration ⚠️ TO DO
- [ ] Install OpenAI SDK (`npm install openai`)
- [ ] Add `OPENAI_API_KEY` to `.env`
- [ ] Replace `generateEmailDigestContent()` placeholder with real OpenAI call
- [ ] Test with sample items
- [ ] Handle JSON parsing errors

### Phase 2: Robust Error Handling
- [ ] Add try/catch for OpenAI API errors
- [ ] Add retry logic (3 attempts)
- [ ] Revert edition status on failure
- [ ] Log errors for debugging

### Phase 3: Content Validation
- [ ] Validate OpenAI response structure
- [ ] Ensure required fields exist
- [ ] Sanitize HTML content
- [ ] Check for malicious content

### Phase 4: Optimization
- [ ] Add streaming for large digests
- [ ] Cache frequently used prompts
- [ ] Track OpenAI usage/costs
- [ ] Add rate limiting

### Phase 5: UI Integration
- [ ] Create generate API endpoint
- [ ] Add "Generate" button to curation page
- [ ] Show loading state during generation
- [ ] Redirect to preview after generation

---

## 📊 RELATED SYSTEMS

WorkMe has several other AI generators. We can learn from them:

### Similar Generators in Codebase:
1. **Senior Leader Email Generator** (`lib/services/senior-leader-digest-ai-service.ts`)
   - Also generates email digests
   - Uses OpenAI
   - Has structured prompt templates

2. **Memo LinkedIn Generator** (`app/api/memo/[id]/generate-linkedin/route.ts`)
   - Generates LinkedIn posts from memos
   - Similar OpenAI pattern

3. **Platform Update Parser** (`lib/services/platform-update-service.ts`)
   - Parses content with AI
   - Good error handling example

**Recommendation:** Review `senior-leader-digest-ai-service.ts` - it's the closest analog

---

## 🎬 NEXT STEPS

### Immediate (to unblock development):
1. **Install OpenAI SDK**
   ```bash
   npm install openai
   ```

2. **Add API key to .env**
   ```
   OPENAI_API_KEY=sk-...
   ```

3. **Replace placeholder function** (lines 534-542 in `lib/actions/email-digest.ts`)

4. **Test generation** with sample data

### After OpenAI is working:
5. Build curation UI (select items)
6. Build preview UI (show generated content)
7. Add regeneration capability
8. Add send/delivery

---

**End of Document**
