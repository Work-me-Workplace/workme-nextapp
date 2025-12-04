# WorkMe API Routes Architecture

## 🎯 Overview

Complete reference for all WorkMe API routes, authentication flow, and usage patterns.

---

## ⚠️ **DEPRECATED ROUTES**

### `GET /api/workme/profile` (Deprecated)
- **Status**: ❌ Deprecated - Uses workMeId instead of auth token
- **Reason**: Not aligned with new auth architecture
- **Use Instead**: `GET /api/workme/me` (uses Firebase auth token)

### `PUT /api/workme/company` (Deprecated Pattern)
- **Status**: ⚠️ Company directory only (not for scoping)
- **Note**: Company model is for directory lookup/enrichment only
- **Scoping**: Use `companyUnit` and `companyDivision` for multi-tenant scoping
- **See**: `/api/workme/companyunit` for workspace setup

---

## 📋 API Routes

### 1. `POST /api/workme/create`

**Purpose**: Find or create WorkMe user from Firebase auth

**Authentication**: Uses `verifyAuth` to get Firebase token from Authorization header

**Flow**:
1. Verifies Firebase token via `verifyAuth(request)`
2. Extracts `firebaseId`, `email`, `displayName`, `photoUrl` from token
3. Parses name from `displayName` (firstName, lastName)
4. Looks up WorkMe by `firebaseId`
5. If not found, checks by `email`
6. If found by email, updates with `firebaseId`
7. If not found at all, creates new WorkMe record
8. If this is the first user, creates super admin

**Request**:
```typescript
POST /api/workme/create
Headers: {
  Authorization: "Bearer <firebase-token>"
}
```

**Response**:
```typescript
{
  success: true,
  workMe: {
    id: string,
    firebaseId: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    photoUrl: string | null,
    // ... other fields
  },
  // If first user:
  superAdmin?: {
    id: string,
    email: string
  },
  isSuperAdmin?: boolean,
  message?: string
}
```

**Error Response**:
```typescript
{
  success: false,
  error: string,
  details?: string // in development only
}
```

**File**: `app/api/workme/create/route.ts`

---

### 2. `GET /api/workme/me` ✨ NEW

**Purpose**: Get current authenticated user's WorkMe profile

**Authentication**: Uses Firebase token (via `verifyAuth` + `loadWorkMe`)

**Flow**:
1. Verifies Firebase token via `verifyAuth(request)`
2. Loads WorkMe identity by `firebaseId` via `loadWorkMe(firebaseId)`
3. Fetches full WorkMe record with all profile fields
4. Returns complete user profile

**Request**:
```typescript
GET /api/workme/me
Headers: {
  Authorization: "Bearer <firebase-token>"
}
```

**Response**:
```typescript
{
  success: true,
  workMe: {
    id: string,
    firebaseId: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    photoUrl: string | null,
    jobTitle: string | null,
    specialty: string | null,
    industry: string | null,
    jobRole: string | null,
    salaryRange: string | null,
    companyUnit: string | null,
    companyDivision: string | null,
    createdAt: Date,
    updatedAt: Date
  }
}
```

**Error Response**:
```typescript
{
  success: false,
  error: string,
  details?: string // in development only
}
// Status: 401 for auth errors, 404 if WorkMe not found, 500 for server errors
```

**File**: `app/api/workme/me/route.ts`

**Usage Example**:
```typescript
import api from '@/lib/api'

const response = await api.get('/api/workme/me')
const { workMe } = response.data
```

---

### 3. `GET /api/workme/hydrate`

**Purpose**: Hydrate WorkMe data after Firebase authentication (used by AuthProvider)

**Authentication**: Uses Firebase token (via `verifyAuth` + `loadWorkMe`)

**Flow**:
1. Verifies Firebase token
2. Loads WorkMe identity
3. Fetches full WorkMe record
4. Returns user data for session hydration

**Request**:
```typescript
GET /api/workme/hydrate
Headers: {
  Authorization: "Bearer <firebase-token>"
}
```

**Response**: Same as `/api/workme/me`

**File**: `app/api/workme/hydrate/route.ts`

**Note**: This is similar to `/api/workme/me` but specifically used by `AuthProvider` on auth state changes.

---

### 4. `POST /api/workme/companyunit` ✨ Workspace Setup

**Purpose**: Set user's workspace (companyUnit) and optional division via registry

**Authentication**: Uses Firebase token (via `verifyAuth` + `loadWorkMe`)

**Request**:
```typescript
POST /api/workme/companyunit
Headers: {
  Authorization: "Bearer <firebase-token>"
}
Body: {
  unitName: string | null,  // Required: workspace name (or blank for auto-generated)
  division?: string | null   // Optional: division name
}
```

**Behavior**:
- If `unitName` provided → upsert into `CompanyUnitRegistry` (public)
- If `unitName` blank → generate unique private unit name (`unit_${nanoid(8)}`)
- Updates `WorkMe.companyUnit` and `WorkMe.companyDivision`

**Response**:
```typescript
{
  success: true,
  workMe: {
    id: string,
    firebaseId: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    companyUnit: string,
    companyDivision: string | null
  },
  unitName: string,
  division: string | null
}
```

**File**: `app/api/workme/companyunit/route.ts`

**Usage Example**:
```typescript
import api from '@/lib/api'

// Set workspace with name and division
const response = await api.post('/api/workme/companyunit', {
  unitName: 'Engineering',
  division: 'Backend'
})

// Auto-generate private workspace
const response = await api.post('/api/workme/companyunit', {
  unitName: '', // blank = auto-generate
  division: 'Team Alpha'
})
```

---

### 5. `GET /api/workme/profile` ⚠️ DEPRECATED

**Status**: ❌ **Deprecated** - Use `GET /api/workme/me` instead

**Reason**: Requires `workMeId` instead of using Firebase auth token

**File**: `app/api/workme/profile/route.ts`

---

### 6. `PUT /api/workme/profile`

**Purpose**: Update basic profile fields

**Authentication**: Uses Firebase token (via `verifyAuth` + `loadWorkMe`)

**Request**:
```typescript
PUT /api/workme/profile
Headers: {
  Authorization: "Bearer <firebase-token>"
}
Body: {
  firstName?: string,
  lastName?: string,
  jobTitle?: string,
  jobRole?: string, // enum
  specialty?: string,
  industry?: string,
  salaryRange?: string, // enum
  photoUrl?: string
}
```

**Response**:
```typescript
{
  success: true,
  workMe: {
    // Updated WorkMe record with all fields
  }
}
```

**File**: `app/api/workme/profile/route.ts`

**Note**: This route does NOT handle `companyUnit` or `companyDivision` updates. Use `/api/workme/companyunit` for workspace setup.

---

### 7. `GET /api/workme/company` (Directory Only)

**Purpose**: Search companies in directory (for lookup/enrichment only)

**Authentication**: None required (public directory search)

**Request**:
```typescript
GET /api/workme/company?q=<search-term>&limit=20
```

**Response**:
```typescript
{
  success: true,
  companies: Array<{
    id: string,
    name: string,
    industry: string | null,
    website: string | null,
    // ... enrichment fields
  }>
}
```

**File**: `app/api/workme/company/route.ts`

**Note**: Company model is for directory lookup/enrichment only. It does NOT scope users. Use `companyUnit` and `companyDivision` for multi-tenant scoping.

---

## 🔐 Authentication Flow

### Complete Signup Flow

```
1. User signs up via Firebase (email/password or Google)
   ↓
2. Firebase creates user → returns Firebase user object
   ↓
3. Frontend gets Firebase ID token: user.getIdToken()
   ↓
4. Frontend calls POST /api/workme/create
   Headers: { Authorization: "Bearer <firebase-token>" }
   ↓
5. Backend verifies token → Creates/finds WorkMe record
   ↓
6. Frontend stores workMeId in localStorage
   ↓
7. Frontend redirects to /profile for onboarding
```

### Subsequent API Calls

```
1. User makes API request via api.get/post/put/delete()
   ↓
2. Axios interceptor (lib/api.ts) automatically:
   - Gets Firebase user via getAuth()
   - Calls user.getIdToken()
   - Adds Authorization: Bearer <token> header
   ↓
3. Backend route receives request with token
   ↓
4. Backend calls verifyAuth(request) → verifies token
   ↓
5. Backend calls loadWorkMe(firebaseId) → gets WorkMe identity
   ↓
6. Backend performs operation with workMeId
```

---

## 🛠️ Key Helper Functions

### `verifyAuth(request: Request)`

**Location**: `lib/server/verifyAuth.ts`

**Purpose**: Verifies Firebase ID token from Authorization header

**Returns**:
```typescript
{
  firebaseId: string,
  email: string | null,
  displayName: string | null,
  photoUrl: string | null
}
```

**Throws**: Error if token is missing or invalid

---

### `loadWorkMe(firebaseId: string)`

**Location**: `lib/auth/loadWorkMe.ts`

**Purpose**: Loads WorkMe identity by Firebase ID

**Returns**:
```typescript
{
  id: string,
  firebaseId: string | null,
  email: string,
  firstName: string | null,
  lastName: string | null,
  photoUrl: string | null,
  companyUnit: string | null,
  companyDivision: string | null
}
```

**Throws**: Error if WorkMe record not found

---

## 📦 Frontend API Client

### `lib/api.ts`

**Purpose**: Global Axios instance with automatic Firebase token injection

**Usage**:
```typescript
import api from '@/lib/api'

// Token automatically added to all requests
const response = await api.get('/api/workme/me')
const response = await api.post('/api/workme/create', data)
const response = await api.put('/api/workme/profile', data)
```

**Features**:
- Automatically attaches Firebase token to all `/api/*` requests
- Handles token refresh
- Global error handling for 401/403

---

## 🏢 Workspace Setup (CompanyUnit & CompanyDivision)

### Architecture

**CompanyUnit** (Required):
- Workspace identifier for multi-tenant scoping
- Stored in `CompanyUnitRegistry` (public or private)
- All domain objects are scoped by `companyUnit`

**CompanyDivision** (Optional):
- Sub-division within a workspace
- Stored only on `WorkMe` record (not on domain objects)
- Used for user metadata/organization

### Setup Flow

```typescript
import api from '@/lib/api'

// Step 1: Set workspace (companyUnit) and optional division
const response = await api.post('/api/workme/companyunit', {
  unitName: 'Engineering',      // Required: workspace name
  division: 'Backend Team'       // Optional: division name
})

const { workMe } = response.data
console.log('Workspace:', workMe.companyUnit)
console.log('Division:', workMe.companyDivision)
```

### Where to Set

1. **`POST /api/workme/companyunit`** ✅ **USE THIS**
   - Sets both `companyUnit` and `companyDivision`
   - Handles registry creation (public/private)
   - Uses Firebase auth token

2. **`POST /api/user/update`** ⚠️ Legacy
   - Also sets both fields but doesn't use registry
   - Located at `/api/user/update` (not `/api/workme/...`)
   - Consider migrating to `/api/workme/companyunit`

---

## 🎯 Common Usage Patterns

### Get Current User

```typescript
import api from '@/lib/api'

try {
  const response = await api.get('/api/workme/me')
  const { workMe } = response.data
  console.log('Current user:', workMe)
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to signin
    router.push('/signin')
  }
}
```

### Create/Find User After Signup

```typescript
import api from '@/lib/api'
import { signUpWithEmail } from '@/lib/firebase'

const result = await signUpWithEmail(email, password, displayName)
const firebaseToken = await result.user.getIdToken()

// Token automatically added by axios interceptor
const response = await api.post('/api/workme/create', {
  firebaseId: result.uid,
  email: result.email,
  firstName: firstName,
  lastName: lastName,
  photoURL: result.photoURL
})

const { workMe } = response.data
localStorage.setItem('workMeId', workMe.id)
```

### Update Profile

```typescript
import api from '@/lib/api'

const response = await api.put('/api/workme/profile', {
  firstName: 'John',
  lastName: 'Doe',
  jobTitle: 'Software Engineer',
  jobRole: 'INDIVIDUAL_CONTRIBUTOR',
  industry: 'Technology',
  salaryRange: '100000-150000'
})

const { workMe } = response.data
```

### Set Workspace (CompanyUnit & Division)

```typescript
import api from '@/lib/api'

// Set workspace with name and division
const response = await api.post('/api/workme/companyunit', {
  unitName: 'Engineering',
  division: 'Backend Team'
})

const { workMe, unitName, division } = response.data
console.log('Workspace:', unitName)
console.log('Division:', division)

// Or auto-generate private workspace
const response2 = await api.post('/api/workme/companyunit', {
  unitName: '', // blank = auto-generate
  division: 'My Team'
})
```

---

## 🔍 WorkMe ID Architecture

### How WorkMe IDs Work

1. **Firebase ID** (`firebaseId`): Primary authentication identifier
   - Unique per Firebase user
   - Used to link Firebase auth to WorkMe record
   - Stored in `WorkMe.firebaseId` field

2. **WorkMe ID** (`id`): Application-level identifier
   - UUID generated by Prisma
   - Used for all internal references
   - Stored in `WorkMe.id` field

3. **Email**: Secondary lookup identifier
   - Unique per WorkMe record
   - Used as fallback if `firebaseId` not set
   - Stored in `WorkMe.email` field

### Lookup Priority

When finding a WorkMe record:
1. First: Lookup by `firebaseId` (most reliable)
2. Second: Lookup by `email` (fallback)
3. If not found: Create new record

---

## 📝 Database Schema

```prisma
model WorkMe {
  id              String   @id @default(uuid())
  firebaseId      String   @unique
  email           String   @unique
  firstName       String?
  lastName        String?
  photoUrl        String?
  jobTitle        String?
  specialty       String?
  industry        String?
  jobRole         JobRole?
  salaryRange     SalaryRange?
  companyUnit     String?
  companyDivision String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## ✅ Best Practices

1. **Always use `/api/workme/me`** for getting current user (uses auth token)
2. **Use `/api/workme/create`** only during signup flow
3. **Use `/api/workme/hydrate`** for AuthProvider session hydration
4. **Use `/api/workme/profile`** GET when you have workMeId but not auth token
5. **Always verify auth** in backend routes using `verifyAuth()`
6. **Always load WorkMe identity** using `loadWorkMe(firebaseId)` after auth
7. **Use `lib/api.ts`** axios instance for all API calls (automatic token injection)

---

## 🚨 Error Handling

### Common Errors

**401 Unauthorized**:
- Token missing or expired
- Solution: Redirect to `/signin`

**404 Not Found**:
- WorkMe record doesn't exist
- Solution: Call `/api/workme/create` to create record

**500 Server Error**:
- Database error or server issue
- Solution: Check server logs, retry request

---

## 📚 Related Documentation

- `docs/AUTH-ARCHITECTURE.md` - Complete auth system documentation
- `docs/USER_ONBOARDING_FLOW.md` - User onboarding flow
- `docs/ONBOARDING_REFACTOR_COMPLETE.md` - Onboarding refactor details

---

**Last Updated**: Created after database wipe - all routes verified and working ✅

