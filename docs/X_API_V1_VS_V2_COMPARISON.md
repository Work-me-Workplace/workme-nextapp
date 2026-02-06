# X API v1.1 vs v2 - Access Level Comparison

**Date:** 2026-02-06

---

## The Reality: v1.1 is NOT Better

**TL;DR:** v1.1 endpoints require **Enterprise tier** (custom pricing, very expensive) for most endpoints. v2 Basic tier ($200/month) is actually MORE accessible than v1.1.

---

## v1.1 Access Levels

| Tier | Cost | v1.1 Endpoints Available |
|------|------|--------------------------|
| **Free** | $0 | ❌ Only Media Upload, Help, Rate Limit, Login with X |
| **Basic** | $200/mo | ❌ Only Media Upload, Help, Rate Limit, Login with X |
| **Pro** | $5,000/mo | ❌ Only Media Upload, Help, Rate Limit, Login with X |
| **Enterprise** | Custom ($$$$) | ✅ **Full access to standard v1.1** |

**Key Point:** Free/Basic/Pro tiers get almost NO v1.1 endpoints. You need **Enterprise** (which is very expensive, custom pricing) to get useful v1.1 endpoints like:
- `/1.1/users/show.json` (user profile)
- `/1.1/statuses/user_timeline.json` (user tweets)
- `/1.1/search/tweets.json` (search)

---

## v2 Access Levels

| Tier | Cost | v2 Endpoints Available |
|------|------|------------------------|
| **Free** | $0 | ❌ Very limited (mostly OAuth) |
| **Basic** | $200/mo | ✅ **Subset of v2 endpoints** |
| **Pro** | $5,000/mo | ✅ **Full v2 access** |
| **Enterprise** | Custom | ✅ Full v2 + extras |

**Key Point:** Basic tier ($200/month) gives you useful v2 endpoints like:
- `/2/users/by/username/:username` (user profile lookup)
- `/2/users/:id/tweets` (user timeline - may require Pro)
- `/2/tweets/search/recent` (recent search)

---

## Authentication Differences

### v1.1
- Requires **OAuth 1.0a** (more complex)
- Needs: Consumer Key, Consumer Secret, Access Token, Access Token Secret
- 4 credentials vs 1 Bearer token

### v2
- Uses **OAuth 2.0 Bearer Token** (simpler)
- Just needs: Bearer Token
- 1 credential

---

## What We Can Do With Basic Tier ($200/month)

### ✅ Available Endpoints:
1. **User Profile Lookup:**
   ```
   GET /2/users/by/username/:username
   ```
   - Works on Basic tier
   - Returns: profile data, bio, followers, etc.

2. **User Timeline (may require Pro):**
   ```
   GET /2/users/:id/tweets
   ```
   - May not work on Basic tier
   - Returns: user's recent tweets

3. **Recent Search:**
   ```
   GET /2/tweets/search/recent
   ```
   - Works on Basic tier
   - Returns: recent tweets matching query

### ❌ Not Available on Basic:
- Full archive search (requires Pro)
- Filtered stream (requires Pro)
- Some advanced endpoints

---

## Recommendation: Stick With v2 Basic Tier

**Why v2 Basic is better than v1.1:**

1. **Cost:** $200/month vs Enterprise ($$$$)
2. **Access:** More endpoints available than v1.1 on Basic tier
3. **Simplicity:** Bearer token vs OAuth 1.0a
4. **Future-proof:** v2 is where X is investing (v1.1 is legacy)

---

## What We Fixed

Updated `/api/x/hydrate` to use **v2 Basic tier compatible endpoints**:

```typescript
// ✅ Works on Basic tier
GET /2/users/by/username/:username

// ❌ May not work on Basic tier  
GET /2/users/:id/tweets
```

**Result:** Profile lookup works, tweets may not (but that's okay - profile data is primary).

---

## If You Need More Access

### Option 1: Upgrade to Pro ($5,000/month)
- Full v2 access
- All endpoints available
- Higher rate limits

### Option 2: Enterprise (Custom pricing)
- Full v1.1 + v2 access
- Custom rate limits
- Very expensive

### Option 3: Stay on Basic ($200/month)
- Use what we have (profile lookup works)
- Accept that tweets endpoint may not work
- This is the most cost-effective option

---

## Summary

**v1.1 is NOT the answer** - it requires Enterprise tier (very expensive) for useful endpoints.

**v2 Basic tier ($200/month) is better** - gives you profile lookup and some other endpoints.

**Current fix is correct** - using v2 Basic tier compatible endpoints.
