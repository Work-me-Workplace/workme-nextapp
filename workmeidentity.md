# WorkMe Identity & User Model Architecture

## Overview

WorkMe uses **Firebase Authentication** for user identity, with **WorkMe** as the primary user model in the database. All user-scoped data references the WorkMe record via `workMeId` (stored as `userId` in the schema).

---

## Core Identity Model: WorkMe

### Schema Definition

```prisma
model WorkMe {
  id          String   @id @default(uuid())      // Primary key - this is the workMeId
  firebaseId  String?  @unique                   // Firebase Auth UID (optional, unique)
  email       String   @unique                   // User email (unique)
  firstName   String?
  lastName    String?
  photoUrl    String?
  companyId   String?
  company     Company? @relation(...)
  // ... other fields
  createdAt   DateTime @default(now())
}
```

### Key Points

- **`id`** = Primary key (UUID) - This is the `workMeId` used throughout the app
- **`firebaseId`** = Firebase Authentication UID (optional, unique)
- **`email`** = User email (unique identifier)

---

## User-Scoped Models

All achievement-related models store the WorkMe ID in a `userId` field:

### Models Using `userId` (which is actually `workMeId`):

1. **Achievement**
   ```prisma
   model Achievement {
     id        String   @id @default(cuid())
     userId    String   // This is the WorkMe.id (workMeId)
     // ... other fields
   }
   ```

2. **Objective**
   ```prisma
   model Objective {
     id        String   @id @default(cuid())
     userId    String   // This is the WorkMe.id (workMeId)
     // ... other fields
   }
   ```

3. **CommsOutput**
   ```prisma
   model CommsOutput {
     id        String   @id @default(cuid())
     userId    String   // This is the WorkMe.id (workMeId)
     // ... other fields
   }
   ```

4. **CompanyCampaign**
   ```prisma
   model CompanyCampaign {
     id        String   @id @default(cuid())
     userId    String   // This is the WorkMe.id (workMeId)
     // ... other fields
   }
   ```

**Note:** The schema uses `userId` as the field name, but it always stores the `WorkMe.id` value (the UUID primary key).

---

## Authentication Flow

### 1. User Signs In/Up

**Pages:**
- `/signin` - Sign in with Google or Email
- `/signup` - Sign up with Google or Email

**Process:**
1. User authenticates with Firebase (Google OAuth or Email/Password)
2. Firebase returns user object with `uid`, `email`, `displayName`, `photoURL`
3. Client calls `/api/workme/create` with Firebase user data

### 2. WorkMe Record Creation/Lookup

**API Route:** `/api/workme/create`

**Logic:**
```typescript
// Try to find by firebaseId first
let workMe = await prisma.workMe.findUnique({
  where: { firebaseId }
})

// If not found, try by email
if (!workMe) {
  workMe = await prisma.workMe.findUnique({
    where: { email }
  })
  
  // If found by email, update with firebaseId
  if (workMe) {
    workMe = await prisma.workMe.update({
      where: { id: workMe.id },
      data: { firebaseId }
    })
  }
}

// If still not found, create new WorkMe
if (!workMe) {
  workMe = await prisma.workMe.create({
    data: {
      firebaseId,
      email,
      firstName,
      lastName,
      photoUrl
    }
  })
}
```

### 3. Session Storage

After successful authentication, store in `localStorage`:
- `firebaseId` - Firebase Auth UID
- `workMeId` - WorkMe.id (UUID primary key) - **This is what we use for queries**
- `email` - User email
- `firebaseToken` - Firebase ID token

---

## Server Actions & User Context

### Current Implementation

Server actions use a placeholder `getUserId()` function that returns `'user-1'`.

### Required Update

Server actions should get `workMeId` from:
1. **Cookies** (set by middleware after auth)
2. **Headers** (for API routes)
3. **Session** (if using NextAuth or similar)

**Helper Function:** `lib/getWorkMeId.ts`

```typescript
// Server-side (server actions, API routes)
export async function getWorkMeId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('workMeId')?.value || null
}

// Client-side
export function getWorkMeIdFromStorage(): string | null {
  return localStorage.getItem('workMeId')
}
```

### Example: Updated Server Action

```typescript
'use server'

import { getWorkMeId } from '../getWorkMeId'

export async function createAchievement(data: AchievementData) {
  const workMeId = await getWorkMeId()
  
  if (!workMeId) {
    return { success: false, error: 'Not authenticated' }
  }

  const achievement = await prisma.achievement.create({
    data: {
      ...data,
      userId: workMeId, // This is WorkMe.id
    }
  })

  return { success: true, achievement }
}
```

---

## Data Model Relationships

```
WorkMe (User Identity)
├── id (UUID) ← Primary key, used as workMeId
├── firebaseId (Firebase UID)
└── email

Achievement
├── userId → WorkMe.id
├── objectiveId → Objective.id
├── commsOutputId → CommsOutput.id
└── companyCampaignId → CompanyCampaign.id

Objective
└── userId → WorkMe.id

CommsOutput
└── userId → WorkMe.id

CompanyCampaign
└── userId → WorkMe.id
```

---

## Firebase Admin SDK Setup

### Environment Variables (Vercel)

Set `FIREBASE_SERVICE_ACCOUNT_KEY` as a JSON string containing your service account key:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### Usage

```typescript
// lib/firebaseAdmin.ts
import { admin, auth } from '@/lib/firebaseAdmin'

// Get Firebase user by UID
const firebaseUser = await auth.getUser(firebaseId)

// Create Firebase user
const newUser = await auth.createUser({
  email: 'user@example.com',
  displayName: 'John Doe'
})
```

---

## Summary

1. **WorkMe** = Primary user model, identified by `id` (UUID)
2. **firebaseId** = Links WorkMe to Firebase Auth (optional, unique)
3. **All user data** = Stored with `userId` field containing `WorkMe.id`
4. **Authentication** = Firebase handles auth, WorkMe stores user profile
5. **Session** = `workMeId` stored in localStorage/cookies for server actions

---

## Next Steps

1. ✅ Firebase Client SDK setup
2. ✅ Sign in/Sign up pages
3. ✅ WorkMe creation API
4. ✅ Firebase Admin SDK setup
5. ⏳ Update server actions to use `getWorkMeId()` instead of placeholder
6. ⏳ Add middleware to set `workMeId` cookie after auth
7. ⏳ Add authentication checks to protected routes

