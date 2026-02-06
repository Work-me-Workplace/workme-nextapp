# X Feed Rate Limit Management

**Date:** 2026-02-06  
**Tier:** FREE (100 posts/month limit)

---

## Problem

Without limits, a single feed request could fetch too many tweets and hit the monthly limit (100 posts/month) in one go.

---

## Solution: Multi-Layer Limits

### 1. Per-Request Limit (Hard Cap)
**`MAX_TWEETS_PER_REQUEST = 20`**

- Hard cap on total tweets per API call
- Prevents accidentally hitting monthly limit with one request
- Safety buffer for Free tier

### 2. Per-Contact Limit
**`MAX_TWEETS_PER_CONTACT = 5`**

- Max tweets per contact per request
- Prevents one contact from consuming all quota
- Fair distribution across contacts

### 3. Monthly Limit (Soft Cap)
**`FREE_TIER_MONTHLY_LIMIT = 100`**

- Total posts per month
- Calculates `tweetsPerContact = floor(100 / numContacts)`
- Stops if approaching limit (with 10 tweet buffer)

---

## Limit Calculation

```typescript
// Free tier limits
const FREE_TIER_MONTHLY_LIMIT = 100  // Total posts per month
const MAX_TWEETS_PER_REQUEST = 20    // Hard cap per API call
const MAX_TWEETS_PER_CONTACT = 5     // Max per contact

// Calculate per-contact limit
const tweetsPerContact = Math.max(1, Math.floor(100 / contactsWithUserId.length))
const maxResultsPerContact = Math.min(tweetsPerContact, MAX_TWEETS_PER_CONTACT)

// Cap total per request
const maxTotalTweets = Math.min(
  contactsWithUserId.length * maxResultsPerContact,
  MAX_TWEETS_PER_REQUEST
)
```

---

## Examples

### Example 1: 10 Contacts
- `tweetsPerContact = floor(100 / 10) = 10`
- `maxResultsPerContact = min(10, 5) = 5`
- `maxTotalTweets = min(10 * 5, 20) = 20`
- **Result:** 5 tweets per contact, max 20 total

### Example 2: 5 Contacts
- `tweetsPerContact = floor(100 / 5) = 20`
- `maxResultsPerContact = min(20, 5) = 5`
- `maxTotalTweets = min(5 * 5, 20) = 20`
- **Result:** 5 tweets per contact, max 20 total

### Example 3: 2 Contacts
- `tweetsPerContact = floor(100 / 2) = 50`
- `maxResultsPerContact = min(50, 5) = 5`
- `maxTotalTweets = min(2 * 5, 20) = 10`
- **Result:** 5 tweets per contact, max 10 total

---

## Stop Conditions

The feed stops fetching when:

1. **Per-Request Limit Reached:**
   ```typescript
   if (totalFetched >= MAX_TWEETS_PER_REQUEST) {
     // Stop - hit hard cap
   }
   ```

2. **Monthly Limit Approaching:**
   ```typescript
   if (totalFetched >= FREE_TIER_MONTHLY_LIMIT - 10) {
     // Stop - approaching monthly limit (10 tweet buffer)
   }
   ```

3. **All Contacts Processed:**
   - Normal completion after processing all contacts

---

## Usage Response

```json
{
  "success": true,
  "results": [...tweets],
  "usage": {
    "fetched": 15,
    "limit": 100,
    "remaining": 85,
    "maxPerRequest": 20,
    "contactsProcessed": 3,
    "tweetsPerContact": 5,
    "limitReached": false
  }
}
```

**Fields:**
- `fetched` - Tweets fetched in this request
- `limit` - Monthly limit (100)
- `remaining` - Estimated remaining for month
- `maxPerRequest` - Hard cap per request (20)
- `limitReached` - Whether per-request limit was hit

---

## Benefits

1. **Safety** - Hard cap prevents accidental over-fetching
2. **Fair** - Distributes tweets across contacts
3. **Predictable** - Max 20 tweets per request
4. **Free Tier Friendly** - Respects monthly limits

---

## Future Enhancements

### Option 1: Usage Tracking (Database)
Track actual monthly usage in database:
```prisma
model XApiUsage {
  workMeId String
  month    String  // "2026-02"
  postsRetrieved Int
}
```

### Option 2: Caching
Cache tweets for 24 hours to avoid repeated API calls:
- Store tweets in database
- Return cached if < 24 hours old
- Only fetch fresh if cache expired

### Option 3: User Preferences
Let user set per-contact limits:
- Some contacts: 5 tweets
- Important contacts: 10 tweets
- Others: 2 tweets

---

## Summary

**Current Implementation:**
- ✅ Hard cap: 20 tweets per request
- ✅ Per-contact cap: 5 tweets max
- ✅ Monthly limit: 100 posts (soft cap)
- ✅ Stops early if limits reached

**Result:** Safe, predictable, Free tier friendly! 🎯
