# X API Access Level Issue - Fix Summary

**Date:** 2026-02-06  
**Issue:** 403 error - "You currently have access to a subset of X API V2 endpoints"

---

## Problem

The `/api/x/hydrate` endpoint was using X API v2 endpoints that require **Elevated** or **Pro** tier access:
- `/2/users/:id` - Direct user ID lookup (requires Elevated/Pro)
- `/2/users/:id/tweets` - User timeline (may require Elevated/Pro)

But the account has **Basic** tier access ($200/month), which has limited v2 endpoint access.

---

## Solution

Updated the code to use **Basic tier compatible endpoints**:

### 1. Profile Lookup
**Before:** `/2/users/:id` (requires Elevated/Pro)  
**After:** `/2/users/by/username/:username` (works on Basic tier)

### 2. Error Handling
- Added proper error messages when 403 occurs
- Distinguishes between access level issues vs other errors
- Provides helpful guidance to user

### 3. Fallback Logic
- Prefer username lookup (more reliable on Basic tier)
- Store `xUserId` when we get it from API response
- Continue with partial data if tweets endpoint fails

---

## X API Tier Comparison

| Tier | Cost | v2 Endpoints | Notes |
|------|------|--------------|-------|
| **Free** | $0 | Very limited | Mostly v1.1, OAuth only |
| **Basic** | $200/mo | Subset of v2 | `/2/users/by/username` works, `/2/users/:id` may not |
| **Pro** | $5,000/mo | Full v2 access | All endpoints available |
| **Enterprise** | Custom | Full + extras | Firehose, decahose, etc. |

---

## What Changed

### `/api/x/hydrate/route.ts`

1. **Switched to username-based lookup:**
   ```typescript
   // OLD (may not work on Basic tier)
   const profileUrl = `https://api.twitter.com/2/users/${searchUserId}?user.fields=...`
   
   // NEW (works on Basic tier)
   const profileUrl = `https://api.twitter.com/2/users/by/username/${cleanHandle}?user.fields=...`
   ```

2. **Better error handling:**
   - Catches 403 errors specifically
   - Provides clear error messages
   - Continues with partial data when possible

3. **Stores xUserId:**
   - When we get user ID from API, store it for future use
   - Allows faster lookups next time

---

## Testing

After this fix, the endpoint should:
1. ✅ Work with Basic tier accounts
2. ✅ Use username lookup (more reliable)
3. ✅ Provide clear error messages if access level is insufficient
4. ✅ Still work if tweets endpoint fails (profile data is primary)

---

## If Still Getting 403

If you're still getting 403 errors, check:

1. **API Key Type:**
   - Bearer tokens work with v2 endpoints
   - Make sure you're using Bearer token, not OAuth 1.0a

2. **Endpoint Availability:**
   - `/2/users/by/username/:username` should work on Basic tier
   - `/2/users/:id/tweets` may require Pro tier

3. **Rate Limits:**
   - Basic tier: 10,000 posts/month read limit
   - Check if you've hit the limit

4. **Upgrade Options:**
   - If you need full v2 access: Upgrade to Pro ($5,000/month)
   - If you need more read capacity: Consider Pro tier

---

## Alternative Approaches

If Basic tier is too limited:

1. **Use v1.1 endpoints** (requires OAuth 1.0a):
   - `/1.1/users/show.json` - Profile lookup
   - `/1.1/statuses/user_timeline.json` - User tweets
   - Requires consumer key + secret + access token + access token secret

2. **Upgrade to Pro tier:**
   - Full v2 access
   - Higher rate limits
   - All endpoints available

3. **Use third-party services:**
   - Some services provide X API access as a proxy
   - May have better rate limits or pricing

---

## Next Steps

1. ✅ Code updated to use Basic tier compatible endpoints
2. ⏳ Test with your X API credentials
3. ⏳ Verify username lookup works
4. ⏳ Check if tweets endpoint works (may still require Pro tier)
