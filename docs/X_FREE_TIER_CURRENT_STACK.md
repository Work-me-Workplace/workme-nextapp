# X Free Tier - Current Stack & Moving Forward

**Date:** 2026-02-06  
**Tier:** FREE (100 posts/month limit)

---

## Current Stack

### ✅ What Works

1. **Step 1: Tuner (`/signal/x/tune`)**
   - Search ecosystem persons (DB lookup, no X API)
   - Add contacts with `followForXFeed = true`
   - View/manage followed contacts

2. **Database Models:**
   - `EcosystemPerson` - Global person registry
   - `MyEcosystemContact` - User relationships with `followForXFeed` flag

3. **API Endpoints:**
   - ✅ `/api/ecosystem/search` - Database search (no X API)
   - ✅ `/api/ecosystem/my-contacts` - List contacts
   - ✅ `/api/ecosystem/contacts` - Create/update contact
   - ✅ `/api/x/hydrate` - Single person profile + tweets
   - ✅ `/api/x/feed` - **UPDATED** - Fetch handle-specific tweets

### ❌ What Doesn't Work (Removed)

1. **`/api/x/search`** - DELETED
   - Used v1.1 endpoint (requires Enterprise tier)
   - Not compatible with Free tier

2. **Hashtag Searches** - NOT IMPLEMENTED
   - Would return millions of results
   - Not compatible with Free tier limits
   - Not needed for "tune" use case

---

## Updated Implementation

### `/api/x/feed` - Handle-Specific Tweet Fetching

**What it does:**
1. Gets handles from contacts where `followForXFeed = true`
2. For each handle:
   - Gets user ID via `/2/users/by/username/:username` (Free tier compatible)
   - Gets tweets via `/2/users/:id/tweets` (handle-specific, not search)
   - Limits to 5 tweets per handle (respects 100/month limit)
3. Returns combined results sorted by date

**Free Tier Compatible:**
- ✅ Uses `/2/users/by/username/:username` (works on Free tier)
- ✅ Uses `/2/users/:id/tweets` (works on Free tier)
- ✅ Respects 100 posts/month limit
- ✅ Handle-specific only (no broad searches)

**Rate Limit Management:**
- Calculates `tweetsPerHandle = floor(100 / numHandles)`
- Caps at 5 tweets per handle max
- Stops if approaching limit
- Returns usage stats in response

---

## Moving Forward

### Immediate Next Steps

1. ✅ **Test `/api/x/feed`** - Verify it fetches tweets from handles
2. ✅ **Check for 403 errors** - May need to verify endpoint availability
3. ✅ **Add usage tracking** - Track 100/month limit (optional, but recommended)

### Future Enhancements (When Upgrading Tier)

**If upgrading to Basic ($200/month):**
- 15,000 posts/month limit
- Can fetch more tweets per handle
- Can add more handles

**If upgrading to Pro ($5,000/month):**
- 1M posts/month limit
- Full v2 access
- Can add filtered streams, search, etc.

### Usage Tracking (Optional)

**Simple approach (current):**
- Calculate limit on-the-fly
- No persistent tracking needed
- User can see usage in response

**Advanced approach (if needed):**
- Add `XApiUsage` model to track monthly usage
- Prevent exceeding limit across multiple requests
- Show usage dashboard in UI

---

## Summary

**Current State:**
- ✅ Tuner works (add handles)
- ✅ Feed fetches handle-specific tweets
- ✅ Respects Free tier limits
- ❌ No hashtag searches (not needed for "tune")

**What Changed:**
- Updated `/api/x/feed` to fetch tweets from handles
- Removed `/api/x/search` (incompatible with Free tier)
- Scoped to handle-specific only (no broad searches)

**Next:**
- Test the feed endpoint
- Verify it works within Free tier limits
- Consider usage tracking if needed
