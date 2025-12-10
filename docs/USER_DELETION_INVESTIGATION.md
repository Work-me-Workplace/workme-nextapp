# User Deletion Investigation Report

**Date:** 2025-01-28  
**Issue:** User account appears to have been deleted from WorkMe application

---

## Executive Summary

After thorough investigation of the codebase, **no direct user deletion code was found**. The WorkMe application does not have any API endpoints or scripts that delete WorkMe users. However, several potential causes have been identified.

---

## Investigation Findings

### 1. No Direct Deletion Code Found

**Searched for:**
- API routes that delete WorkMe users: ❌ None found
- Database operations that delete WorkMe: ❌ None found
- Scripts that delete users: ❌ None found
- Cascade delete operations: ✅ Found (but only FROM WorkMe TO other models, not the reverse)

**Conclusion:** The application does not have built-in user deletion functionality.

---

### 2. Potential Causes

#### A. Missing `companyId` (Most Likely)

**Location:** `lib/server/verifyAuth.ts:77-79`

```typescript
if (!workMe.companyId) {
  console.error('[verifyAuth] ERROR: User does not belong to a company:', workMe.id)
  throw new Error('User must belong to a company. Please contact support.')
}
```

**Impact:** 
- User record still exists in database
- User cannot authenticate or access the app
- Appears as if user is "deleted" but they're actually just locked out

**How this could happen:**
- User was created before `companyId` was required
- User's company was deleted (though schema shows `ON DELETE SET NULL`)
- Migration issue during company assignment

#### B. Unique Constraint Violation

**Constraints:**
- `email` is UNIQUE (schema.prisma:17)
- `firebaseId` is UNIQUE (schema.prisma:16)

**Potential Issue:**
If a user creation/update attempted to set a duplicate `email` or `firebaseId`, Prisma would throw an error. However, this wouldn't delete the user - it would just fail the operation.

**Location:** `app/api/workme/create/route.ts:76-84`

#### C. Database Migration Issue

**Migration:** `20251120234144_make_company_id_required/migration.sql`

This migration made `companyId` required for many tables, but **NOT for WorkMe**. However, the application logic now requires it.

**Potential Issue:**
- If a migration was run incorrectly
- If database constraints were modified manually
- If a rollback occurred

#### D. Manual Database Operation

**Possible scenarios:**
- Direct SQL DELETE statement executed
- Database admin tool used to delete user
- Database restore from backup that didn't include the user

---

### 3. Authentication Flow Analysis

**User Creation Flow:** `app/api/workme/create/route.ts`
- Finds or creates WorkMe by `firebaseId`
- Falls back to email lookup if `firebaseId` not found
- Updates existing record if found by email
- Creates new record if not found

**User Authentication Flow:** `lib/server/verifyAuth.ts`
- Verifies Firebase token
- Looks up WorkMe by `firebaseId`
- **Throws error if WorkMe not found** (line 72-74)
- **Throws error if `companyId` missing** (line 77-79)

---

## Recommended Actions

### 1. Check if User Actually Exists

**Query the database directly:**

```sql
-- Check if user exists by email
SELECT * FROM "WorkMe" WHERE email = 'user@example.com';

-- Check if user exists by firebaseId
SELECT * FROM "WorkMe" WHERE "firebaseId" = 'firebase-uid-here';

-- Check all users without companyId
SELECT id, email, "firebaseId", "companyId", "createdAt" 
FROM "WorkMe" 
WHERE "companyId" IS NULL;
```

### 2. Check Application Logs

**Look for:**
- `[verifyAuth] ERROR: User does not belong to a company`
- `[verifyAuth] Token verification failed`
- `WorkMe record not found`
- Any database errors around the time of the incident

### 3. Check Database Backup/Restore

**Questions to answer:**
- Was a database backup restored?
- Was a migration rolled back?
- Was the database reset/recreated?

### 4. Check Firebase Authentication

**Verify:**
- Does the Firebase user still exist?
- Has the Firebase UID changed?
- Is the Firebase token valid?

### 5. Recovery Steps

**If user exists but lacks `companyId`:**
```sql
-- Assign user to a company (replace with actual IDs)
UPDATE "WorkMe" 
SET "companyId" = 'company-uuid-here' 
WHERE email = 'user@example.com';
```

**If user doesn't exist:**
- User will need to sign up again via `/api/workme/create`
- The endpoint will create a new WorkMe record
- User will need to be assigned to a company

---

## Prevention Measures

### 1. Add User Deletion Protection

**Recommendation:** Add explicit protection against accidental deletion:

```typescript
// Add to schema.prisma
model WorkMe {
  // ... existing fields
  deletedAt DateTime? // Soft delete instead of hard delete
}
```

### 2. Add Audit Logging

**Recommendation:** Log all user-related operations:

```typescript
// Log user lookups, updates, and any deletion attempts
console.log('[AUDIT] WorkMe operation:', {
  operation: 'lookup' | 'update' | 'create' | 'delete',
  workMeId,
  email,
  timestamp: new Date(),
})
```

### 3. Add Database Triggers

**Recommendation:** Add PostgreSQL triggers to log deletions:

```sql
CREATE TABLE workme_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  workme_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_workme_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO workme_audit_log (operation, workme_id, email)
    VALUES ('DELETE', OLD.id, OLD.email);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workme_delete_trigger
AFTER DELETE ON "WorkMe"
FOR EACH ROW EXECUTE FUNCTION log_workme_changes();
```

### 4. Add Health Check Endpoint

**Recommendation:** Create an endpoint to verify user existence:

```typescript
// app/api/workme/check/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const firebaseId = searchParams.get('firebaseId')
  
  const user = await prisma.workMe.findFirst({
    where: {
      OR: [
        email ? { email } : {},
        firebaseId ? { firebaseId } : {},
      ]
    }
  })
  
  return NextResponse.json({ exists: !!user, user })
}
```

---

## Files Reviewed

1. `app/api/workme/create/route.ts` - User creation endpoint
2. `app/api/workme/hydrate/route.ts` - User hydration endpoint
3. `lib/server/verifyAuth.ts` - Authentication verification
4. `prisma/schema.prisma` - Database schema
5. All migration files in `prisma/migrations/`
6. All scripts in `scripts/` directory
7. All API routes for user operations

---

## Next Steps

1. ✅ **Immediate:** Query database to verify if user actually exists
2. ✅ **Immediate:** Check application logs for errors
3. ✅ **Short-term:** Implement audit logging
4. ✅ **Short-term:** Add user existence check endpoint
5. ✅ **Long-term:** Implement soft delete pattern
6. ✅ **Long-term:** Add database triggers for deletion tracking

---

## Questions to Answer

1. **Does the user record exist in the database?**
   - If yes: Check `companyId` field
   - If no: Check when/how it was deleted

2. **Does the Firebase user still exist?**
   - If no: User may have deleted their Firebase account
   - If yes: Check if UID matches database record

3. **When did this happen?**
   - Check logs around that time
   - Check if any migrations were run
   - Check if database was restored

4. **Was there any manual database operation?**
   - Check database admin logs
   - Check if any scripts were run manually
   - Check if database was accessed directly

---

**Status:** Investigation Complete - Awaiting Database Verification



