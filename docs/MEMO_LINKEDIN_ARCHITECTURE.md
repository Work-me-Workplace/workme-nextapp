# Memo → LinkedIn Architecture

**Date:** 2025-12-17  
**Status:** ✅ Complete  
**Purpose:** Personal work moment capture with optional LinkedIn distribution

---

## Executive Summary

The Memo → LinkedIn system provides a clean separation between:
- **Memo** = Human source of truth for work moments
- **LinkedInPost** = Distribution artifact (user-approved)
- **AI Generation** = Ephemeral (not persisted until user approves)

**Key Principle:** Memo is valuable even if LinkedIn doesn't exist.

---

## 1. Database Models

### Memo Model

```prisma
model Memo {
  id        String   @id @default(cuid())
  workMeId  String   @db.Uuid
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // When it happened
  happenedAt DateTime @default(now())

  // Structured Reflection
  whatHappened String  // Factual description (required)
  whySpecial   String? // Why this moment mattered
  myRole       String? // How the user contributed
  impact       String? // Outcome or effect
  thoughts     String? // Optional reflection / emotion

  // Context
  contextType MemoContextType @default(OTHER)

  // Relations
  workMe        WorkMe         @relation("WorkMeMemos", fields: [workMeId], references: [id], onDelete: Cascade)
  linkedInPosts LinkedInPost[]
}

enum MemoContextType {
  EVENT
  MEETING
  DELIVERY
  RECOGNITION
  OTHER
}
```

**Purpose:** Personal narrative capture. Private by default. Not coupled to LinkedIn.

### LinkedInPost Model

```prisma
model LinkedInPost {
  id        String   @id @default(cuid())
  workMeId  String   @db.Uuid
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relation (nullable)
  memoId String?
  memo   Memo?   @relation(fields: [memoId], references: [id], onDelete: SetNull)

  // Content
  title   String? // Internal label
  content String  // Final, user-approved text

  // State
  status            LinkedInPostStatus @default(DRAFT)
  postedAt          DateTime?
  linkedinPostUrn   String?
  errorMessage      String?

  // Relations
  workMe WorkMe @relation("WorkMeLinkedInPosts", fields: [workMeId], references: [id], onDelete: Cascade)
}

enum LinkedInPostStatus {
  DRAFT
  POSTED
  FAILED
}
```

**Purpose:** Distribution record. Tracks what was posted, when, and status.

**Relationship Rules:**
- One Memo → Many LinkedInPosts
- One LinkedInPost → At most one Memo
- Deleting a Memo sets LinkedInPost.memoId to null (onDelete: SetNull)
- Posted content is never deleted

---

## 2. API Routes

### Memo Routes

#### POST `/api/memo/create`
Create a new memo.

**Body:**
```json
{
  "whatHappened": "string (required)",
  "whySpecial": "string (optional)",
  "myRole": "string (optional)",
  "impact": "string (optional)",
  "thoughts": "string (optional)",
  "contextType": "EVENT | MEETING | DELIVERY | RECOGNITION | OTHER",
  "happenedAt": "ISO date string"
}
```

#### GET `/api/memo/list`
Get all memos for current user. Ordered by `happenedAt` (desc).

**Returns:**
```json
{
  "success": true,
  "memos": [
    {
      "id": "...",
      "whatHappened": "...",
      ...
      "_count": {
        "linkedInPosts": 2
      }
    }
  ]
}
```

#### GET `/api/memo/[id]`
Get a specific memo with all related LinkedIn posts.

#### PUT `/api/memo/[id]`
Update a memo (all fields optional).

#### DELETE `/api/memo/[id]`
Delete a memo. LinkedIn posts remain (memoId set to null).

#### POST `/api/memo/[id]/generate-linkedin`
Generate a LinkedIn post draft from memo (ephemeral, not persisted).

**Body:**
```json
{
  "tone": "professional | appreciative | reflective | celebratory"
}
```

**Returns:**
```json
{
  "success": true,
  "content": "AI-generated LinkedIn post text",
  "tone": "professional",
  "memo": { "id": "...", "whatHappened": "...", "contextType": "..." }
}
```

### LinkedIn Routes

#### POST `/api/linkedin/draft`
Create a LinkedIn post draft (first persistence point).

**Body:**
```json
{
  "memoId": "string (optional)",
  "title": "string (optional)",
  "content": "string (required)"
}
```

#### GET `/api/linkedin/list`
Get all LinkedIn posts for current user.

**Query params:**
- `status` - Filter by status (DRAFT | POSTED | FAILED)
- `memoId` - Filter by source memo

#### GET `/api/linkedin/[id]`
Get a specific LinkedIn post.

#### PUT `/api/linkedin/[id]`
Update a LinkedIn post (only allowed for DRAFT or FAILED).

#### DELETE `/api/linkedin/[id]`
Delete a LinkedIn post draft (only allowed for DRAFT or FAILED).

#### POST `/api/linkedin/[id]/post`
Post to LinkedIn. Updates status to POSTED or FAILED.

**Note:** Currently a placeholder implementation. Real LinkedIn API integration requires OAuth and credentials.

---

## 3. UI Pages

### `/mywork/memos`
**Memo List Page**

**Features:**
- Browse all memos (ordered by date)
- Context type badges (Event, Meeting, etc.)
- Quick view of memo details
- Shows count of LinkedIn posts created from each memo
- Delete memos inline
- "Capture Work Moment" CTA

### `/mywork/memos/new`
**Create Memo Page**

**Features:**
- Date picker (when it happened)
- Context type selector
- 5 reflection fields:
  1. What happened? (required)
  2. Why did this matter?
  3. What was your role?
  4. What was the impact?
  5. Personal reflections (optional)
- Save/Cancel actions

### `/mywork/memos/[id]`
**Memo Detail Page**

**Features:**
- View mode: Display all memo fields
- Edit mode: Update any field
- Delete memo option
- **Primary CTA:** "Draft LinkedIn Post" button (prominent, gradient background)
- LinkedIn posts history (if any)
  - Shows all posts created from this memo
  - Status badges (Draft, Posted, Failed)
  - Links to post detail pages

### `/mywork/memos/[id]/linkedin/draft`
**LinkedIn Draft Generation Page**

**Features:**
- Tone selector (Professional, Appreciative, Reflective, Celebratory)
- "Generate LinkedIn Post" button (AI call)
- Editable post preview
  - Optional internal title
  - Editable content textarea
  - Character count
- Regenerate option (ephemeral - nothing saved)
- Actions:
  - "Save Draft" - Creates LinkedInPost record
  - "Save & Post to LinkedIn" - Creates and posts immediately
- **Important note:** Nothing persisted until user saves

### `/mywork/linkedin/[id]`
**LinkedIn Post Detail Page**

**Features:**
- Status display (Draft, Posted, Failed)
- Link to source memo (if exists)
- View mode: Display post content
- Edit mode: Update title/content (only for DRAFT/FAILED)
- Actions:
  - Edit (only for non-posted)
  - Delete (only for DRAFT/FAILED)
  - "Post to LinkedIn" button (for DRAFT/FAILED)
- Posted status display (with timestamp and URN)
- Failed status display (with error message and retry option)

---

## 4. UX Flow

### Primary Flow: Capture → Generate → Post

```
1. User clicks "Capture Work Moment"
   ↓
2. Fill out memo form (what/why/role/impact/thoughts)
   ↓
3. Save memo (private, personal)
   ↓
4. View memo detail
   ↓
5. Click "Draft LinkedIn Post"
   ↓
6. Select tone + Generate (AI, ephemeral)
   ↓
7. Edit generated content (still ephemeral)
   ↓
8. Click "Save Draft" or "Save & Post"
   ↓
9. LinkedIn post record created
   ↓
10. If "Post to LinkedIn" → Post to LinkedIn API
```

### Key UX Principles

1. **Memo is always valuable** - Even if never posted to LinkedIn
2. **AI is ephemeral** - Nothing saved until user explicitly saves
3. **Multiple iterations allowed** - Regenerate freely before saving
4. **Separation of concerns** - Memo editing ≠ LinkedIn post editing
5. **Posted content is immutable** - Cannot edit after posting
6. **Deleting memo doesn't delete posts** - LinkedIn posts remain

---

## 5. Architectural Guardrails

### ✅ What We Built

1. **Memo never depends on LinkedIn** - Standalone value
2. **LinkedInPost never edits Memo** - One-way relationship
3. **AI is user-invoked** - Never automatic
4. **Persistence only after approval** - User controls everything
5. **Clear separation** - Personal truth vs. public distribution

### ❌ What We Did NOT Build

1. ❌ Auto-posting to LinkedIn
2. ❌ AI suggestions without user request
3. ❌ Engagement metrics (likes, comments)
4. ❌ LinkedIn OAuth integration (placeholder only)
5. ❌ Memo editing from LinkedIn post
6. ❌ Automatic LinkedIn post generation on memo save

---

## 6. Navigation

**Sidebar: Mywork Section**
- Work Memos (new, first in list)
- Work Products
- Stuff I'm Working On
- Team Members

**Breadcrumb Navigation:**
- Memos List → Memo Detail → LinkedIn Draft
- Memos List → LinkedIn Post Detail
- Memo Detail → LinkedIn Draft → LinkedIn Post Detail

---

## 7. Data Patterns

### Memo Data Pattern
```typescript
const memo = {
  id: "clx...",
  workMeId: "uuid...",
  whatHappened: "Led project kickoff meeting with 12 stakeholders",
  whySpecial: "First time coordinating across 3 divisions",
  myRole: "Technical lead and facilitator",
  impact: "Aligned everyone on Q1 objectives, saved 2 weeks",
  thoughts: "Learned the value of pre-meeting prep",
  contextType: "MEETING",
  happenedAt: "2025-12-15T10:00:00Z",
  createdAt: "2025-12-15T14:30:00Z",
  linkedInPosts: [...]
}
```

### LinkedIn Post Data Pattern
```typescript
const linkedInPost = {
  id: "clx...",
  workMeId: "uuid...",
  memoId: "clx...",
  title: "Project Kickoff Success",
  content: "Yesterday I had the opportunity to lead...",
  status: "POSTED",
  postedAt: "2025-12-16T09:00:00Z",
  linkedinPostUrn: "urn:li:share:123456789",
  errorMessage: null,
  memo: { ... }
}
```

---

## 8. Future Enhancements

### Phase 2 (Future)
- ✅ LinkedIn OAuth integration
- ✅ Real LinkedIn API posting
- ✅ Draft scheduling (post at specific time)
- ✅ Multiple LinkedIn accounts
- ✅ LinkedIn engagement metrics
- ✅ Post analytics (views, reactions, comments)

### Phase 3 (Future)
- ✅ Memo templates
- ✅ Memo sharing (within WorkMe)
- ✅ Memo collections/tags
- ✅ Export memos to PDF
- ✅ Weekly digest of memos
- ✅ Memo reminders ("Haven't captured anything this week")

---

## 9. Implementation Summary

### What Was Created

**Database:**
- ✅ Memo model (5 reflection fields, context type, timestamp)
- ✅ LinkedInPost model (content, status, timestamps, URN)
- ✅ Enums: MemoContextType, LinkedInPostStatus
- ✅ Relations: WorkMe → Memos, WorkMe → LinkedInPosts, Memo → LinkedInPosts

**API Routes (10 endpoints):**
- ✅ POST /api/memo/create
- ✅ GET /api/memo/list
- ✅ GET /api/memo/[id]
- ✅ PUT /api/memo/[id]
- ✅ DELETE /api/memo/[id]
- ✅ POST /api/memo/[id]/generate-linkedin
- ✅ POST /api/linkedin/draft
- ✅ GET /api/linkedin/list
- ✅ GET /api/linkedin/[id]
- ✅ PUT /api/linkedin/[id]
- ✅ DELETE /api/linkedin/[id]
- ✅ POST /api/linkedin/[id]/post

**UI Pages (5 pages):**
- ✅ /mywork/memos (list)
- ✅ /mywork/memos/new (create)
- ✅ /mywork/memos/[id] (detail + edit)
- ✅ /mywork/memos/[id]/linkedin/draft (AI generation)
- ✅ /mywork/linkedin/[id] (post detail + edit)

**Navigation:**
- ✅ Added "Work Memos" to sidebar (Mywork section)
- ✅ Breadcrumb navigation throughout

**AI Integration:**
- ✅ OpenAI integration for LinkedIn post generation
- ✅ Tone selector (4 tone options)
- ✅ Ephemeral generation (not persisted)
- ✅ Regeneration support

---

## 10. Testing Checklist

### Basic Flow
- [ ] Create a memo
- [ ] View memo list
- [ ] View memo detail
- [ ] Edit a memo
- [ ] Delete a memo

### LinkedIn Flow
- [ ] Generate LinkedIn post from memo
- [ ] Try different tones
- [ ] Regenerate multiple times
- [ ] Edit generated content
- [ ] Save as draft
- [ ] View draft in LinkedIn post detail
- [ ] Edit draft
- [ ] Post to LinkedIn (placeholder)
- [ ] View posted status

### Edge Cases
- [ ] Create LinkedIn post without memo
- [ ] Delete memo with LinkedIn posts (posts remain)
- [ ] Edit posted LinkedIn post (should be blocked)
- [ ] Delete posted LinkedIn post (should be blocked)
- [ ] Retry failed post
- [ ] Cancel during AI generation

---

## 11. Key Files

### Database
- `prisma/schema.prisma` - Models: Memo, LinkedInPost

### API Routes
- `app/api/memo/create/route.ts`
- `app/api/memo/list/route.ts`
- `app/api/memo/[id]/route.ts`
- `app/api/memo/[id]/generate-linkedin/route.ts`
- `app/api/linkedin/draft/route.ts`
- `app/api/linkedin/list/route.ts`
- `app/api/linkedin/[id]/route.ts`
- `app/api/linkedin/[id]/post/route.ts`

### UI Pages
- `app/mywork/memos/page.tsx`
- `app/mywork/memos/new/page.tsx`
- `app/mywork/memos/[id]/page.tsx`
- `app/mywork/memos/[id]/linkedin/draft/page.tsx`
- `app/mywork/linkedin/[id]/page.tsx`

### Components
- `components/mywork/SidebarNav.tsx` - Navigation (updated)

---

## 12. Architecture Compliance

This implementation follows WorkMe architectural principles:

✅ **WorkMe = Identity Layer**
- Memos and LinkedIn posts belong to WorkMe (via workMeId)
- Personal data, not company-scoped

✅ **Modular Intelligence**
- Memo is a standalone module attached to WorkMe
- LinkedInPost is separate module (distribution)
- Clear separation of concerns

✅ **User-Centric**
- User controls all AI generation
- User approves all posts
- User owns all data

✅ **Privacy First**
- Memos are private by default
- LinkedIn posting is explicit opt-in
- No automatic sharing

---

## 13. Memo vs. LinkedIn Post Comparison

| Aspect | Memo | LinkedInPost |
|--------|------|--------------|
| **Purpose** | Personal source of truth | Public distribution |
| **Visibility** | Private | Public (when posted) |
| **Editability** | Always editable | Only drafts editable |
| **Deletion** | Can delete anytime | Only drafts deletable |
| **AI Involved** | No | Yes (optional) |
| **Value** | Valuable alone | Derived from Memo |
| **Lifecycle** | Permanent (until deleted) | Draft → Posted (or Failed) |
| **Fields** | 5 reflection fields | Title + content |
| **Relationship** | 1 Memo → Many Posts | 1 Post → 0-1 Memo |

---

**Status:** ✅ Complete  
**Next Steps:** Test all flows, add LinkedIn OAuth integration

