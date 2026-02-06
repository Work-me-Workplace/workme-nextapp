# X Feed Refactored Flow - Stabilized Architecture

**Date:** 2026-02-06  
**Goal:** Stabilize our own model and architecture to handle handles, then get actual feeds

---

## The Refactored Flow

### Step 1: Set Ecosystem Contact Using Apollo Flow ✅
**Purpose:** Enrich person data from Apollo, then save to our database

**Flow:**
```
User provides email/LinkedIn → Apollo enrichment → Parse Apollo data → Save to EcosystemPerson
```

**Implementation:**
- Use existing `enrichPerson({ email, linkedinUrl })` from Apollo
- Parse Apollo response to extract: name, title, company, etc.
- **Add xHandle extraction** from Apollo (if available)
- Save to `EcosystemPerson` via `/api/ecosystem/savePerson`

### Step 2: Add xHandle as Field ✅
**Status:** Already exists in `EcosystemPerson` model!

```prisma
model EcosystemPerson {
  xHandle   String? @unique  // ✅ Already exists
  xUserId   String? @unique  // ✅ Already exists
  // ... other fields
}
```

**Action Needed:** Extract xHandle from Apollo response (if available)

### Step 3: Use Handle to Get xUserId
**Purpose:** Lookup X user ID from handle using X API

**Flow:**
```
EcosystemPerson.xHandle → X API /2/users/by/username/:username → Store xUserId
```

**Implementation:**
- New endpoint: `/api/x/resolve-user-id` or add to `/api/x/hydrate`
- Takes `handle` or `personId`
- Calls X API to get user ID
- Updates `EcosystemPerson.xUserId`

### Step 4: Use xUserId to Get Tweets
**Purpose:** Fetch tweets from specific handles using xUserId

**Flow:**
```
EcosystemPerson.xUserId → X API /2/users/:id/tweets → Return tweets
```

**Implementation:**
- Update `/api/x/feed` to use `xUserId` instead of handle lookup
- More efficient (one less API call)
- Works better with Free tier limits

### Step 5: Display Tweets & Use Our Backend
**Purpose:** Show tweets in UI, store/process them in our backend

**Flow:**
```
Tweets from X API → Store in our DB (optional) → Display in UI → Process/Analyze
```

**Implementation:**
- Display tweets in `/signal/x/feed` page
- Optionally store tweets in our database for analysis
- Use our backend to process/classify tweets

---

## Current Architecture

### Database Models

```prisma
model EcosystemPerson {
  id        String  @id @default(cuid())
  fullName  String
  xHandle   String? @unique  // ✅ Already exists
  xUserId   String? @unique  // ✅ Already exists
  // ... other fields
}

model MyEcosystemContact {
  id              String @id @default(cuid())
  workMeId        String @db.Uuid
  personId        String
  followForXFeed  Boolean @default(false)  // ✅ Already exists
  stance          String?  // favorable/unfavorable/neutral
  relationshipType String? // media/influencer/etc
  // ... other fields
}
```

### API Endpoints

**Existing:**
- ✅ `/api/ecosystem/savePerson` - Save person (needs Apollo integration)
- ✅ `/api/x/hydrate` - Get profile + tweets for one person
- ✅ `/api/x/feed` - Get tweets from followed contacts (needs refactor)

**New Needed:**
- ⏳ `/api/ecosystem/enrich-and-save` - Apollo enrichment → Save person
- ⏳ `/api/x/resolve-user-id` - Get xUserId from handle

---

## Refactored Implementation Plan

### Phase 1: Apollo Integration for Ecosystem Contacts

**File:** `app/api/ecosystem/enrich-and-save/route.ts`

```typescript
POST /api/ecosystem/enrich-and-save
Body: { email?: string, linkedinUrl?: string }

Flow:
1. Call Apollo enrichPerson({ email, linkedinUrl })
2. Parse Apollo response
3. Extract xHandle from Apollo (if available in twitter_url field)
4. Save to EcosystemPerson via existing savePerson logic
5. Create MyEcosystemContact link
6. Return person + contact
```

**Apollo Response Fields:**
- `person.name` → `fullName`
- `person.title` → `title`
- `person.organization.name` → `companyName`
- `person.twitter_url` → **Extract xHandle** (NEW)
- `person.photo_url` → `profileImage`
- `person.linkedin_url` → Store for reference

### Phase 2: Resolve xUserId from Handle

**File:** `app/api/x/resolve-user-id/route.ts`

```typescript
POST /api/x/resolve-user-id
Body: { personId: string } OR { handle: string }

Flow:
1. Get person from DB (if personId) OR use handle directly
2. Call X API: GET /2/users/by/username/:handle
3. Extract xUserId from response
4. Update EcosystemPerson.xUserId
5. Return updated person
```

### Phase 3: Refactor Feed to Use xUserId

**File:** `app/api/x/feed/route.ts`

**Current:** Looks up user ID for each handle  
**Refactored:** Uses stored xUserId directly

```typescript
// OLD: Lookup user ID for each handle
for (const handle of handles) {
  const userResponse = await fetch(`/2/users/by/username/${handle}...`)
  const userId = userResponse.data.id
  const tweetsResponse = await fetch(`/2/users/${userId}/tweets...`)
}

// NEW: Use stored xUserId
const contacts = await prisma.myEcosystemContact.findMany({
  where: { followForXFeed: true },
  include: {
    person: {
      where: { xUserId: { not: null } } // Only contacts with resolved xUserId
    }
  }
})

for (const contact of contacts) {
  const userId = contact.person.xUserId // Already resolved!
  const tweetsResponse = await fetch(`/2/users/${userId}/tweets...`)
}
```

**Benefits:**
- One less API call per handle (saves on rate limits)
- Faster (no username lookup needed)
- More reliable (xUserId doesn't change)

### Phase 4: Display & Process Tweets

**File:** `app/signal/x/feed/page.tsx`

**Features:**
- Display tweets from followed contacts
- Show person info (name, handle, profile image)
- Show tweet metrics (likes, retweets)
- Filter by stance/relationship type
- Process tweets with our backend (AI classification, etc.)

---

## Updated Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Apollo Enrichment                                  │
├─────────────────────────────────────────────────────────────┤
│ User Input: email or linkedinUrl                           │
│     ↓                                                       │
│ Apollo API: enrichPerson({ email, linkedinUrl })           │
│     ↓                                                       │
│ Parse: Extract name, title, company, xHandle (from twitter_url) │
│     ↓                                                       │
│ Save: POST /api/ecosystem/enrich-and-save                  │
│     ↓                                                       │
│ Creates: EcosystemPerson + MyEcosystemContact              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 2: Resolve xUserId (if xHandle exists)                │
├─────────────────────────────────────────────────────────────┤
│ EcosystemPerson.xHandle                                     │
│     ↓                                                       │
│ X API: GET /2/users/by/username/:handle                    │
│     ↓                                                       │
│ Extract: xUserId from response                              │
│     ↓                                                       │
│ Update: EcosystemPerson.xUserId                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 3: Set followForXFeed = true                          │
├─────────────────────────────────────────────────────────────┤
│ User selects contacts to follow                            │
│     ↓                                                       │
│ Update: MyEcosystemContact.followForXFeed = true             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 4: Fetch Tweets                                        │
├─────────────────────────────────────────────────────────────┤
│ Query: MyEcosystemContact where followForXFeed = true      │
│     AND person.xUserId IS NOT NULL                          │
│     ↓                                                       │
│ For each contact:                                           │
│   X API: GET /2/users/:xUserId/tweets                       │
│     ↓                                                       │
│ Return: Combined tweets sorted by date                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 5: Display & Process                                  │
├─────────────────────────────────────────────────────────────┤
│ Display tweets in UI                                        │
│     ↓                                                       │
│ Process with our backend (AI classification, etc.)          │
│     ↓                                                       │
│ Store results in our database (optional)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Apollo Integration ✅
- [ ] Create `/api/ecosystem/enrich-and-save` endpoint
- [ ] Extract xHandle from Apollo `twitter_url` field
- [ ] Integrate with existing `savePerson` logic
- [ ] Test Apollo → EcosystemPerson flow

### Phase 2: Resolve xUserId ⏳
- [ ] Create `/api/x/resolve-user-id` endpoint
- [ ] Add "Resolve User ID" button in UI (optional)
- [ ] Auto-resolve on save if xHandle exists
- [ ] Test handle → xUserId lookup

### Phase 3: Refactor Feed ⏳
- [ ] Update `/api/x/feed` to use xUserId directly
- [ ] Remove handle → userId lookup loop
- [ ] Filter contacts where xUserId IS NOT NULL
- [ ] Test feed with resolved xUserIds

### Phase 4: Display & Process ⏳
- [ ] Update `/signal/x/feed` page to display tweets
- [ ] Add filtering by stance/relationship type
- [ ] Add tweet processing (AI classification, etc.)
- [ ] Test end-to-end flow

---

## Apollo xHandle Extraction

**Apollo Response Structure:**
```json
{
  "person": {
    "twitter_url": "https://twitter.com/navalnews",
    "twitter_handle": "navalnews",  // May or may not exist
    // ... other fields
  }
}
```

**Extraction Logic:**
```typescript
function extractXHandle(apolloPerson: any): string | null {
  // Try twitter_handle first
  if (apolloPerson.twitter_handle) {
    return apolloPerson.twitter_handle.replace('@', '')
  }
  
  // Extract from twitter_url
  if (apolloPerson.twitter_url) {
    const match = apolloPerson.twitter_url.match(/twitter\.com\/([^/?]+)/)
    if (match && match[1]) {
      return match[1].replace('@', '')
    }
  }
  
  return null
}
```

---

## Benefits of This Approach

1. **Stable Data Model** - Person data in our DB first
2. **Efficient** - xUserId stored, no repeated lookups
3. **Reliable** - Handle → xUserId resolution happens once
4. **Scalable** - Can process tweets with our backend
5. **Free Tier Friendly** - Fewer API calls = better rate limit usage

---

## Summary

**Current State:**
- ✅ Models exist (`EcosystemPerson` has `xHandle` and `xUserId`)
- ✅ Apollo enrichment exists
- ⚠️ Not integrated together
- ⚠️ Feed does handle lookup every time

**Refactored State:**
- ✅ Apollo → Save Person (with xHandle)
- ✅ Handle → xUserId (resolve once)
- ✅ xUserId → Tweets (efficient)
- ✅ Display & Process (our backend)

**Next Steps:**
1. Create Apollo enrichment endpoint for ecosystem contacts
2. Add xUserId resolution endpoint
3. Refactor feed to use stored xUserId
4. Update UI to display tweets
