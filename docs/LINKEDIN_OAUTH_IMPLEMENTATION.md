# LinkedIn OAuth Integration - Implementation

**Date:** 2025-01-XX  
**Status:** ✅ **COMPLETE**  
**Scope:** Minimal LinkedIn integration - OAuth + Posting only

---

## 🎯 Overview

This implementation provides a minimal LinkedIn integration that supports:
- ✅ OAuth connection flow
- ✅ Token management (no refresh tokens)
- ✅ Posting to LinkedIn via UGC Posts API
- ❌ No analytics
- ❌ No company pages
- ❌ No profile sync

---

## 📋 Implementation Checklist

- [x] Add LinkedIn OAuth fields to WorkMe model
- [x] Create OAuth authorization route
- [x] Create OAuth callback route
- [x] Implement LinkedIn API posting
- [x] Create helper service for LinkedIn API calls
- [x] Add LinkedIn connection status endpoint

---

## 🗄️ Database Changes

### WorkMe Model Updates

Added three fields to `WorkMe` model:

```prisma
// LinkedIn OAuth (minimal required fields)
linkedinUserId        String? // LinkedIn user ID from /v2/userinfo
linkedinAccessToken   String? // Access token (no refresh token support)
linkedinTokenExpiresAt DateTime? // When token expires (5184000 seconds = 60 days)
```

**Migration Required:**
```bash
npx prisma migrate dev --name add_linkedin_oauth_fields
```

---

## 🔐 Environment Variables

Required environment variables:

```env
LINKEDIN_CLIENT_ID=226972426
LINKEDIN_CLIENT_SECRET=******
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/auth/linkedin/callback
```

---

## 🛣️ API Routes

### 1. GET `/api/auth/linkedin/authorize`

**Purpose:** Initiates LinkedIn OAuth flow

**Flow:**
1. User clicks "Connect LinkedIn"
2. Backend redirects to LinkedIn authorization page
3. User approves → LinkedIn redirects to callback

**Authentication:** Required (Firebase)

**Response:** Redirects to LinkedIn OAuth page

**Example:**
```
GET /api/auth/linkedin/authorize
→ Redirects to: https://www.linkedin.com/oauth/v2/authorization?...
```

---

### 2. GET `/api/auth/linkedin/callback`

**Purpose:** Handles OAuth callback and stores credentials

**Flow:**
1. LinkedIn redirects with `code` and `state`
2. Exchange `code` for `access_token`
3. Fetch LinkedIn user ID via `/v2/userinfo`
4. Store credentials on WorkMe record
5. Redirect to app with success/error

**Authentication:** Not required (OAuth callback)

**Query Parameters:**
- `code` - Authorization code from LinkedIn
- `state` - CSRF protection + workMeId
- `error` - OAuth error (if any)

**Response:** Redirects to app with status

**Example:**
```
GET /api/auth/linkedin/callback?code=XXXX&state=YYYY
→ Redirects to: /mywork/linkedin?linkedinConnected=true
```

---

### 3. GET `/api/auth/linkedin/status`

**Purpose:** Check LinkedIn connection status

**Authentication:** Required (Firebase)

**Response:**
```json
{
  "success": true,
  "connected": true,
  "expired": false,
  "linkedinUserId": "abc123",
  "expiresAt": "2025-03-15T10:00:00Z"
}
```

---

### 4. POST `/api/linkedin/[id]/post`

**Purpose:** Post LinkedInPost content to LinkedIn

**Flow:**
1. Verify post belongs to user
2. Verify post is DRAFT or FAILED
3. Check LinkedIn connection
4. Check token expiration
5. Post to LinkedIn UGC Posts API
6. Update post status (POSTED or FAILED)

**Authentication:** Required (Firebase)

**Request Body:** None (uses existing LinkedInPost record)

**Response (Success):**
```json
{
  "success": true,
  "linkedInPost": {
    "id": "...",
    "status": "POSTED",
    "postedAt": "2025-01-15T10:00:00Z",
    "linkedinPostUrn": "urn:li:ugcPost:123456789"
  },
  "message": "Post published to LinkedIn successfully"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "linkedInPost": {
    "id": "...",
    "status": "FAILED",
    "errorMessage": "LinkedIn post failed: 401 Unauthorized"
  },
  "error": "LinkedIn post failed: 401 Unauthorized",
  "requiresReconnect": true
}
```

---

## 🔧 Service Functions

### `lib/services/linkedinOAuth.ts`

#### `getLinkedInAuthUrl(redirectUri, state)`
Generates LinkedIn OAuth authorization URL.

#### `exchangeCodeForToken(code, redirectUri)`
Exchanges authorization code for access token.

**Returns:**
```typescript
{
  access_token: string;
  expires_in: number; // 5184000 seconds = 60 days
}
```

#### `getLinkedInUserId(accessToken)`
Fetches LinkedIn user ID from `/v2/userinfo`.

**Returns:** `string` (LinkedIn user ID)

#### `postToLinkedIn(accessToken, linkedinUserId, content)`
Posts content to LinkedIn via UGC Posts API.

**Payload:**
```json
{
  "author": "urn:li:person:{linkedinUserId}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "{content}"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Returns:**
```typescript
{
  id: string; // URN format: urn:li:ugcPost:{id}
}
```

#### `isTokenExpired(expiresAt)`
Checks if LinkedIn token is expired.

**Returns:** `boolean`

---

## 🔄 OAuth Flow

### Step 1: User Initiates Connection

```
User clicks "Connect LinkedIn"
  ↓
GET /api/auth/linkedin/authorize
  ↓
Redirects to LinkedIn OAuth page
```

### Step 2: User Approves

```
User approves on LinkedIn
  ↓
LinkedIn redirects to: /api/auth/linkedin/callback?code=XXXX&state=YYYY
```

### Step 3: Token Exchange

```
Callback route:
  1. Decode state → get workMeId
  2. Exchange code → access_token
  3. Fetch LinkedIn user ID
  4. Store: linkedinUserId, linkedinAccessToken, linkedinTokenExpiresAt
  5. Redirect to app with success
```

### Step 4: Posting

```
User clicks "Post to LinkedIn"
  ↓
POST /api/linkedin/[id]/post
  ↓
Check connection & token expiration
  ↓
POST to LinkedIn UGC Posts API
  ↓
Update LinkedInPost status
```

---

## 🚨 Error Handling

### OAuth Errors

- **Access Denied:** User denies permission → `?error=access_denied`
- **Invalid State:** State parameter invalid → `?error=invalid_state`
- **State Expired:** State older than 10 minutes → `?error=state_expired`
- **Token Exchange Failed:** API error → `?error=token_exchange_failed`

### Posting Errors

- **Not Connected:** `401` → "LinkedIn not connected. Please connect LinkedIn first."
- **Token Expired:** `401` → "LinkedIn token expired. Please reconnect LinkedIn."
- **API Error:** `500` → Error message from LinkedIn API
- **Unauthorized:** `401` → `requiresReconnect: true` flag

---

## 🔒 Security Considerations

1. **State Parameter:** CSRF protection + workMeId encoding
2. **State Expiration:** 10-minute timeout prevents replay attacks
3. **Server-Side Only:** Token exchange never exposed to client
4. **Token Storage:** Encrypted at rest (database)
5. **No Refresh Tokens:** When expired, user must reconnect

---

## 📝 Usage Examples

### Connect LinkedIn

```typescript
// Frontend: Redirect user to authorize endpoint
window.location.href = '/api/auth/linkedin/authorize';
```

### Check Connection Status

```typescript
const response = await fetch('/api/auth/linkedin/status');
const { connected, expired, linkedinUserId } = await response.json();

if (!connected || expired) {
  // Show "Connect LinkedIn" button
}
```

### Post to LinkedIn

```typescript
const response = await fetch(`/api/linkedin/${postId}/post`, {
  method: 'POST',
});

const result = await response.json();

if (result.success) {
  console.log('Posted!', result.linkedInPost.linkedinPostUrn);
} else if (result.requiresReconnect) {
  // Show reconnect button
}
```

---

## 🧪 Testing Checklist

- [ ] OAuth authorization flow
- [ ] OAuth callback with valid code
- [ ] OAuth callback with invalid state
- [ ] OAuth callback with expired state
- [ ] Token exchange success
- [ ] Token exchange failure
- [ ] Userinfo fetch success
- [ ] Posting with valid token
- [ ] Posting with expired token
- [ ] Posting with no connection
- [ ] Error handling (401, 500, etc.)

---

## 📚 Related Documentation

- [Memo → LinkedIn Architecture](./MEMO_LINKEDIN_ARCHITECTURE.md)
- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)

---

## 🎯 Next Steps (Future)

- [ ] UI for "Connect LinkedIn" button
- [ ] UI for connection status display
- [ ] UI for "Post to LinkedIn" button
- [ ] Error handling UI (reconnect prompts)
- [ ] Token expiration warnings

---

**Status:** ✅ Implementation complete. Ready for UI integration and testing.

