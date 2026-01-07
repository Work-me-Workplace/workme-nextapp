# LinkedIn Environment Variables Setup

**Date:** 2025-01-XX  
**Status:** Required for LinkedIn OAuth integration

---

## 🔐 Required Environment Variables

Add these to your `.env.local` file:

```env
# LinkedIn OAuth Credentials
LINKEDIN_CLIENT_ID=226972426
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/auth/linkedin/callback
```

---

## 📋 Where to Get These Values

### 1. LINKEDIN_CLIENT_ID
✅ **You have this:** `226972426`  
This is the app ID LinkedIn provided in their email.

### 2. LINKEDIN_CLIENT_SECRET
🔑 **Get this from:** LinkedIn Developer Portal
1. Go to https://www.linkedin.com/developers/apps
2. Select your app (ID: 226972426)
3. Go to "Auth" tab
4. Copy the "Client secret" value

### 3. LINKEDIN_REDIRECT_URI
🌐 **Set this to:** Your production domain + callback path

**Examples:**
- Production: `https://app.workme.com/api/auth/linkedin/callback`
- Local dev: `http://localhost:3000/api/auth/linkedin/callback`

**Important:** This must match exactly what you configure in LinkedIn Developer Portal:
1. Go to your app in LinkedIn Developer Portal
2. Go to "Auth" tab
3. Add your redirect URI to "Authorized redirect URLs for your app"

---

## ✅ Verification

After adding the environment variables:

1. **Restart your dev server** (if running)
2. **Test the OAuth flow:**
   - Visit `/api/auth/linkedin/authorize`
   - Should redirect to LinkedIn (not error)

---

## 🔒 Security Notes

- ✅ **Never commit** `.env.local` to git (it's in `.gitignore`)
- ✅ **Client Secret** is sensitive - keep it secure
- ✅ Use different values for dev/staging/production
- ✅ Rotate secrets if compromised

---

## 📝 Example .env.local

```env
# Database
DATABASE_URL=postgresql://...

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=226972426
LINKEDIN_CLIENT_SECRET=abc123xyz789...
LINKEDIN_REDIRECT_URI=https://app.workme.com/api/auth/linkedin/callback

# Other env vars...
```

---

**Status:** Add these to `.env.local` and restart your server.

