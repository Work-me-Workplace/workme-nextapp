# WorkMe Architecture

## Core Principle: Single-Tenant Container Model

**WorkMe is the single tenant.** All data is scoped to a single `containerId` that represents the WorkMe platform itself.

---

## Container Model

### WorkMe as Container

- **Single tenant** - One WorkMe platform, one container
- **Container ID** - Hardcoded or system-generated ID that represents the WorkMe platform
- **All companies tied to container** - Companies are shared/global entities within the container
- **Users link to companies** - Users don't own company data, they reference it

### Why This Matters

**Companies are NOT user-owned data.** 

Users don't say "I work at Starbucks and here's their annual revenue." Instead:
- Companies exist in a **company directory** (tied to container)
- Users **link** to existing companies
- Company data is **shared** across all users who work there
- Company information is **curated** through a directory process

---

## API Route Structure

All WorkMe routes follow the pattern: `/api/workme/{action}`

### Core Routes

#### `POST /api/workme/create`
**Purpose**: Find or create WorkMe user from Firebase auth

**Flow**:
1. Receive Firebase user data (firebaseId, email, name, photo)
2. Find existing WorkMe by firebaseId or email
3. If found, return existing
4. If not found, create new WorkMe
5. Return WorkMe record

**Service**: Uses Firebase service for auth validation

---

#### `PUT /api/workme/profile`
**Purpose**: Upsert the rest of the user profile

**Fields**:
- jobTitle
- jobRole (INDIVIDUAL_CONTRIBUTOR, MANAGER, etc.)
- specialty
- industry
- salaryRange
- annualSalary
- workLocation
- city
- state

**Note**: This is separate from `/create` because profile setup happens after initial auth.

---

#### `PUT /api/workme/company`
**Purpose**: Link user to a company (or create company if needed)

**Flow**:
1. User provides company name (or selects from directory)
2. System looks up company in directory (by containerId)
3. If company exists, link user to it
4. If company doesn't exist, create it in directory (tied to containerId)
5. Update user's companyId

**Key Point**: Users don't define company revenue/details - that's directory data.

---

## Company Directory Model

### Company as Shared Entity

Companies are **container-scoped shared entities**:

```prisma
model Company {
  id          String   @id @default(uuid())
  containerId String   // WorkMe container ID (single tenant)
  name        String   // Company name
  // ... company details (industry, revenue, etc.)
  
  employees   WorkMe[] // Users who work here
}
```

### Company Directory Process

1. **Lookup First** - When user says "I work at Starbucks", system looks up in directory
2. **Create if Missing** - If not found, create company record (tied to containerId)
3. **Link User** - Link user's companyId to company
4. **Shared Data** - Company details (revenue, industry, etc.) are shared across all employees

### Why Not User-Owned?

**Users don't know company revenue/details.** 

Instead:
- Company directory is **curated** (can be updated by admins or through verified sources)
- Users just **link** to companies
- Company data is **shared** - if 100 people work at Starbucks, they all reference the same company record

---

## Firebase Service

Firebase authentication is handled through a **service layer** (not direct imports in routes).

### Service Pattern

```typescript
// lib/services/firebase.ts
export class FirebaseService {
  static async verifyToken(token: string): Promise<FirebaseUser>
  static async getUserByUid(uid: string): Promise<FirebaseUser>
  // ... other Firebase operations
}
```

### Usage in Routes

```typescript
// app/api/workme/create/route.ts
import { FirebaseService } from '@/lib/services/firebase'

const firebaseUser = await FirebaseService.verifyToken(token)
```

---

## Data Flow

### User Signup Flow

1. **Firebase Auth** → User authenticates with Firebase
2. **Create WorkMe** → `POST /api/workme/create` finds/creates WorkMe record
3. **Profile Setup** → `PUT /api/workme/profile` sets career details
4. **Company Link** → `PUT /api/workme/company` links to company (or creates in directory)

### Company Linking Flow

1. **User Input** → "I work at Starbucks"
2. **Directory Lookup** → Search companies by containerId + name
3. **Create or Link** → If exists, link; if not, create in directory
4. **Update User** → Set user's companyId

---

## Key Architectural Decisions

1. **Single-Tenant Container** - WorkMe is the container, all data scoped to containerId
2. **Company Directory** - Companies are shared entities, not user-owned
3. **Firebase Service** - Authentication handled through service layer
4. **Route Naming** - All routes follow `/api/workme/{action}` pattern
5. **Separate Concerns** - Create, Profile, Company are separate endpoints

---

## Schema Updates Needed

1. **Add containerId to Company model**
2. **Company name should be unique per container** (not globally unique)
3. **WorkMe.companyId links to Company** (many-to-one)

---

## Summary

- **WorkMe = Single tenant container**
- **Companies = Shared directory entities** (tied to container)
- **Users = Link to companies** (don't own company data)
- **Firebase = Service layer** (not direct imports)
- **Routes = `/api/workme/{action}`** pattern

