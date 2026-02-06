# X Free Tier - Scoped Implementation Plan

**Date:** 2026-02-06  
**Current Tier:** FREE  
**Limits:** 100 Posts/month retrieval, 500 writes/month

---

## Current Stack Analysis

### What We Have

1. **Step 1: Tuner (`/signal/x/tune`)**
   - ✅ UI to search/add contacts
   - ✅ Stores contacts with `followForXFeed = true`
   - ✅ Uses `MyEcosystemContact` model

2. **API Endpoints:**
   - ✅ `/api/ecosystem/search` - Search ecosystem persons (DB lookup)
   - ✅ `/api/ecosystem/my-contacts` - List contacts with filters
   - ✅ `/api/ecosystem/contacts` - Create/update contact
   - ✅ `/api/x/hydrate` - Fetch profile + tweets for ONE person
   - ⚠️ `/api/x/feed` - Gets handles but doesn't fetch tweets yet (TODO)
   - ❌ `/api/x/search` - Uses v1.1 users/search (won't work on Free tier)

3. **Database:**
   - ✅ `EcosystemPerson` - Global person registry
   - ✅ `MyEcosystemContact` - User-specific relationships with `followForXFeed` flag

---

## Free Tier Constraints

### What Free Tier CAN Do:
- ✅ `/2/users/by/username/:username` - Get user profile
- ✅ `/2/users/:id/tweets` - Get user's tweets (counts against 100/month limit)
- ✅ Limited to 100 posts retrieval per month total

### What Free Tier CANNOT Do:
- ❌ `/1.1/users/search.json` - Requires Enterprise tier
- ❌ `/2/tweets/search/recent` - Requires Basic+ tier
- ❌ Broad hashtag searches (#navy) - Would return millions, not allowed
- ❌ Filtered streams - Requires Pro tier

---

## Scoped Approach: Handle-Specific Tweets Only

### Goal
**"Tune" specific handles → See their tweets** (not search by hashtag)

### Strategy
1. **Pick handles** via tuner (already working)
2. **Fetch tweets from those specific handles only**
3. **Respect 100 posts/month limit** - Fetch small batches, cache results
4. **No broad searches** - Only handle-specific timelines

---

## Implementation Plan

### Phase 1: Update `/api/x/feed` to Fetch Handle-Specific Tweets

**Current State:**
```typescript
// TODO: Call X API v2 to fetch tweets from these handles
// Returns empty results array
```

**New Implementation:**
```typescript
// For each handle:
// 1. Get user ID via /2/users/by/username/:username
// 2. Get tweets via /2/users/:id/tweets?max_results=5
// 3. Limit to 5 tweets per handle to respect 100/month limit
// 4. Return combined results
```

**Rate Limit Management:**
- 100 posts/month = ~3 posts/day
- If user follows 10 handles → ~0.3 posts/handle/day
- Fetch 5 tweets per handle, cache for 24 hours
- Track usage in database to avoid exceeding limit

### Phase 2: Remove/Disable Broad Search

**Remove:**
- `/api/x/search` endpoint (uses v1.1, won't work on Free tier)
- Any hashtag search functionality

**Keep:**
- `/api/ecosystem/search` - Database search only (doesn't use X API)

### Phase 3: Add Usage Tracking

**Track X API Usage:**
```typescript
// Store in database or cache
interface XApiUsage {
  month: string // "2026-02"
  postsRetrieved: number // Count against 100 limit
  lastReset: Date
}
```

**Before fetching:**
- Check current month's usage
- If >= 100, return error or cached results
- If < 100, fetch and increment counter

---

## Updated `/api/x/feed` Implementation

```typescript
export async function POST(request: Request) {
  // ... auth ...

  // Get contacts with followForXFeed = true
  const contacts = await prisma.myEcosystemContact.findMany({
    where: { 
      workMeId: workMe.id,
      followForXFeed: true,
      person: { xHandle: { not: null } },
    },
    include: { person: true },
  })

  const handles = contacts
    .map(c => c.person.xHandle?.replace('@', ''))
    .filter((h): h is string => h !== null)

  if (handles.length === 0) {
    return NextResponse.json({
      success: true,
      results: [],
      message: 'No handles to follow. Add contacts in /signal/x/tune',
    })
  }

  // Check usage limit (100 posts/month)
  const currentMonth = new Date().toISOString().slice(0, 7) // "2026-02"
  const usage = await getXApiUsage(currentMonth)
  
  if (usage.postsRetrieved >= 100) {
    return NextResponse.json({
      success: true,
      results: [],
      message: 'Monthly limit reached (100 posts). Results will refresh next month.',
      usage,
    })
  }

  // Fetch tweets from handles (limit to stay under 100/month)
  const tweetsPerHandle = Math.floor((100 - usage.postsRetrieved) / handles.length)
  const maxResults = Math.min(tweetsPerHandle, 5) // Max 5 per handle

  const allTweets = []
  
  for (const handle of handles) {
    try {
      // 1. Get user ID
      const userResponse = await fetch(
        `https://api.twitter.com/2/users/by/username/${handle}?user.fields=id`,
        { headers: { 'Authorization': `Bearer ${bearerToken}` } }
      )
      
      if (!userResponse.ok) continue
      
      const userData = await userResponse.json()
      const userId = userData.data?.id
      if (!userId) continue

      // 2. Get tweets (respecting limit)
      const tweetsResponse = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics,text`,
        { headers: { 'Authorization': `Bearer ${bearerToken}` } }
      )

      if (tweetsResponse.ok) {
        const tweetsData = await tweetsResponse.json()
        const tweets = (tweetsData.data || []).map(tweet => ({
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          handle,
          personName: contacts.find(c => c.person.xHandle?.replace('@', '') === handle)?.person.fullName,
          retweetCount: tweet.public_metrics?.retweet_count || 0,
          likeCount: tweet.public_metrics?.like_count || 0,
        }))
        
        allTweets.push(...tweets)
        
        // Update usage counter
        await incrementXApiUsage(currentMonth, tweets.length)
      }
    } catch (error) {
      console.error(`Error fetching tweets for ${handle}:`, error)
      // Continue with other handles
    }
  }

  return NextResponse.json({
    success: true,
    results: allTweets,
    usage: {
      ...usage,
      postsRetrieved: usage.postsRetrieved + allTweets.length,
    },
  })
}
```

---

## What Gets Removed/Changed

### ❌ Remove:
1. `/api/x/search` - Uses v1.1, won't work on Free tier
2. Any hashtag search functionality
3. Broad search queries

### ✅ Keep:
1. `/api/ecosystem/search` - Database search (doesn't use X API)
2. `/api/x/hydrate` - Single person hydration (useful for profile updates)
3. `/api/x/feed` - Handle-specific tweet fetching (updated)

---

## Usage Tracking Implementation

### Option 1: Database Table
```prisma
model XApiUsage {
  id        String   @id @default(cuid())
  workMeId  String   @db.Uuid
  month     String   // "2026-02"
  postsRetrieved Int @default(0)
  lastReset DateTime @default(now())
  
  workMe WorkMe @relation(...)
  
  @@unique([workMeId, month])
  @@index([workMeId])
}
```

### Option 2: Simple Cache (Redis/Memory)
```typescript
// Store in memory or Redis
const usageCache = new Map<string, { postsRetrieved: number, lastReset: Date }>()

function getXApiUsage(workMeId: string, month: string) {
  const key = `${workMeId}:${month}`
  const cached = usageCache.get(key)
  
  // Reset if new month
  if (!cached || cached.lastReset.getMonth() !== new Date().getMonth()) {
    usageCache.set(key, { postsRetrieved: 0, lastReset: new Date() })
    return { postsRetrieved: 0 }
  }
  
  return cached
}
```

---

## Next Steps

1. ✅ **Update `/api/x/feed`** - Implement handle-specific tweet fetching
2. ✅ **Add usage tracking** - Prevent exceeding 100/month limit
3. ✅ **Remove `/api/x/search`** - Not compatible with Free tier
4. ✅ **Update UI** - Show usage limits, handle-specific feeds only
5. ✅ **Test** - Verify it works within Free tier limits

---

## Expected Behavior

### User Flow:
1. User goes to `/signal/x/tune`
2. Searches for person (DB search, not X API)
3. Adds person with `followForXFeed = true`
4. User goes to `/signal/x/feed`
5. System fetches tweets from those specific handles only
6. Returns 5 tweets per handle (or less if near limit)
7. Shows usage: "X/100 posts used this month"

### Limits:
- Max 20 handles × 5 tweets = 100 posts/month (perfect fit!)
- If user adds more handles, reduce tweets per handle
- Cache results for 24 hours to avoid repeated API calls

---

## Summary

**Current State:** Tuner works, feed doesn't fetch tweets yet  
**Goal:** Fetch handle-specific tweets only (no hashtag searches)  
**Constraint:** 100 posts/month limit  
**Solution:** Fetch 5 tweets per handle, track usage, cache results
