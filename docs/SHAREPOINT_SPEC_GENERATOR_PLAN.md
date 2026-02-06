# SharePoint Spec Generator - Simplified Design Plan

## Overview
Simple SharePoint proposal generator with two input modes:
1. **Build with AI** - Raw text input → AI infers structure → JSON output
2. **Manual** - User specifies pages and descriptions → JSON output

## Data Model

### Simple Structure
```typescript
interface SharePointSpec {
  name: string           // Title/Name of the SharePoint build
  description: string     // Overall description
  rawJson: string         // OpenAI return in JSON format
}
```

### JSON Format (rawJson)
The AI should return JSON in this structure:
```json
{
  "title": "SharePoint Content Proposal: [Title]",
  "executiveSummary": "...",
  "contentPages": [
    {
      "pageNumber": 1,
      "title": "Content Page #1",
      "description": "..."
    },
    {
      "pageNumber": 2,
      "title": "Content Page #2", 
      "description": "..."
    },
    {
      "pageNumber": 3,
      "title": "Content Page #3",
      "description": "..."
    }
  ],
  "conclusion": "..."
}
```

## Input Modes

### Mode 1: Build with AI

**Input:**
- Single textarea for raw text
- User describes SharePoint build in natural language
- Example:
  ```
  This is a SharePoint build for main page and new associated pages.
  We need a homepage with company updates, a products page showcasing 
  our new offerings, and a contact page with team information.
  ```

**Processing:**
- Send raw text to OpenAI API
- Use structured output (JSON mode)
- AI infers:
  - Title/Name
  - Executive Summary
  - Number of pages needed
  - Page titles and descriptions
  - Conclusion

**Output:**
- Structured JSON in the format above
- Display formatted view
- Allow editing before finalizing
- Copy/Download options

### Mode 2: Manual Entry

**Input:**
- Name/Title field
- Description field
- Dynamic page builder:
  - Add Page button
  - For each page:
    - Page Title
    - Page Description
  - Remove page option

**Processing:**
- User builds pages one by one
- Form validation
- Construct JSON structure from form data

**Output:**
- Same JSON format as AI mode
- Copy/Download options

## UI Flow

### Initial Screen
```
┌─────────────────────────────────────────────┐
│  SharePoint Spec Generator                 │
├─────────────────────────────────────────────┤
│                                             │
│  Choose your input method:                  │
│                                             │
│  [ Build with AI ]  [ Manual Entry ]       │
│                                             │
└─────────────────────────────────────────────┘
```

### Build with AI Flow
1. User selects "Build with AI"
2. Form appears:
   ```
   Name/Title: [________________]
   Description: [________________]
   
   Raw Text Input:
   [Large textarea]
   "This is a SharePoint build for main page..."
   
   [Generate Spec] button
   ```
3. User enters name, description, and raw text
4. Click "Generate Spec"
5. API call to OpenAI with structured output
6. Display generated JSON:
   ```
   SharePoint Content Proposal: [Title]
   
   Executive Summary:
   [AI-generated summary]
   
   Content Page #1: [Page Title]
   [Page description]
   
   Content Page #2: [Page Title]
   [Page description]
   
   ...
   
   Conclusion:
   [AI-generated conclusion]
   ```
7. User can edit if needed
8. Copy/Download JSON

### Manual Entry Flow
1. User selects "Manual Entry"
2. Form appears:
   ```
   Name/Title: [________________]
   Description: [________________]
   
   Pages:
   ┌─────────────────────────────────┐
   │ Page 1                          │
   │ Title: [________________]       │
   │ Description: [________________] │
   │ [Remove]                        │
   └─────────────────────────────────┘
   
   [+ Add Page] button
   
   [Generate Spec] button
   ```
3. User fills in name, description
4. User adds pages with titles and descriptions
5. Click "Generate Spec"
6. JSON is constructed from form data
7. Display formatted view
8. Copy/Download JSON

## Technical Implementation

### API Endpoint
```typescript
POST /api/mywork/sharepoint-spec/generate

Body: {
  mode: 'ai' | 'manual',
  name: string,
  description: string,
  rawText?: string,        // For AI mode
  pages?: Array<{          // For manual mode
    title: string,
    description: string
  }>
}

Response: {
  success: boolean,
  spec: {
    name: string,
    description: string,
    rawJson: string        // JSON string of the proposal structure
  }
}
```

### OpenAI Integration
```typescript
// AI Prompt Template
const prompt = `
You are a SharePoint content proposal generator. 
Based on the user's description, create a SharePoint site proposal.

User Description:
"${rawText}"

Generate a JSON proposal with this structure:
{
  "title": "SharePoint Content Proposal: [appropriate title]",
  "executiveSummary": "[2-3 sentence summary of the SharePoint build]",
  "contentPages": [
    {
      "pageNumber": 1,
      "title": "[Page title]",
      "description": "[Detailed description of what this page contains]"
    },
    // ... more pages as needed
  ],
  "conclusion": "[1-2 sentence conclusion]"
}

Infer the number of pages needed from the description. 
Each page should have a clear purpose and description.
Return ONLY valid JSON, no markdown formatting.
`;

// Use OpenAI with response_format: { type: "json_object" }
```

### Data Structure
```typescript
interface SharePointSpec {
  name: string
  description: string
  rawJson: string  // JSON string containing the proposal
}

interface ProposalJSON {
  title: string
  executiveSummary: string
  contentPages: Array<{
    pageNumber: number
    title: string
    description: string
  }>
  conclusion: string
}
```

## Example Use Cases

### Example 1: AI Mode Input
```
Name: Q4 Company Updates Site
Description: SharePoint site for Q4 company announcements

Raw Text:
"This is a SharePoint build for main page and new associated pages. 
We need a homepage with Q4 results announcement, a products page 
showcasing new offerings launched this quarter, a team page with 
leadership updates, and a resources page with downloadable materials."
```

**Expected AI Output:**
```json
{
  "title": "SharePoint Content Proposal: Q4 Company Updates Site",
  "executiveSummary": "A comprehensive SharePoint site to communicate Q4 company results, new product launches, leadership updates, and provide resources to stakeholders.",
  "contentPages": [
    {
      "pageNumber": 1,
      "title": "Homepage - Q4 Results",
      "description": "Main landing page featuring Q4 financial results, key achievements, and navigation to other sections."
    },
    {
      "pageNumber": 2,
      "title": "Products Page",
      "description": "Showcase of new products and offerings launched during Q4, with details, images, and specifications."
    },
    {
      "pageNumber": 3,
      "title": "Team & Leadership",
      "description": "Updates on leadership changes, team highlights, and organizational announcements."
    },
    {
      "pageNumber": 4,
      "title": "Resources",
      "description": "Downloadable materials including reports, presentations, fact sheets, and other Q4-related documents."
    }
  ],
  "conclusion": "This SharePoint site will serve as the central hub for Q4 communications, ensuring stakeholders have easy access to all relevant information and updates."
}
```

### Example 2: Manual Mode
```
Name: Employee Onboarding Portal
Description: SharePoint site for new employee onboarding

Pages:
1. Welcome Page - Introduction to the company and onboarding process
2. Policies & Procedures - HR policies, code of conduct, safety guidelines
3. Training Resources - Links to training modules, videos, and materials
4. Team Directory - Contact information for key team members
5. FAQ - Common questions and answers for new employees
```

## Implementation Steps

1. **Update UI** - Add mode toggle (AI/Manual)
2. **AI Mode Form** - Name, Description, Raw Text textarea
3. **Manual Mode Form** - Name, Description, Dynamic page builder
4. **API Endpoint** - `/api/mywork/sharepoint-spec/generate`
5. **OpenAI Integration** - Structured JSON output
6. **JSON Display** - Format and show the proposal
7. **Copy/Download** - Export functionality

## Next Steps

1. ✅ Document the simplified model
2. Update the spec generator page with mode toggle
3. Implement AI mode with OpenAI integration
4. Implement manual mode with page builder
5. Add JSON formatting and display
6. Test with examples
7. Add copy/download functionality
