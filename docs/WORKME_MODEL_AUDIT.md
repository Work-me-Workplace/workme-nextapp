# WorkMe Model Audit

**Date:** 2025-01-04  
**Issue:** User reported concerns about WorkMe model structure

---

## ✅ Audit Results

### 1. WorkMe Model - **CLEAN** ✅

The `WorkMe` model is correctly structured:

```prisma
model WorkMe {
  id         String   @id @default(uuid())
  firebaseId String?  @unique
  email      String   @unique
  createdAt  DateTime @default(now())

  // Relations only - NO direct companyUnit/companyDivision fields
  workMeCompanyId String?
  workMeCompany   WorkMeCompany? @relation(...)
  profile WorkProfile?
  workEntries WorkEntry[]
  mySkills MySkills?
  // ... other relations
}
```

**Status:** ✅ **CORRECT** - No `companyUnit` or `companyDivision` fields on WorkMe model.

---

### 2. WorkProfile Model - **CORRECT** ✅

The `WorkProfile` model uses **relationships** (foreign keys), not direct fields:

```prisma
model WorkProfile {
  id              String  @id @default(cuid())
  userId          String  @unique
  // ... personal fields ...
  
  // Workforce affiliation (registry pattern) - THESE ARE RELATIONSHIPS
  companyUnitId   String?  // Foreign key
  divisionUnitId  String?  // Foreign key

  user      WorkMe         @relation(fields: [userId], references: [id])
  company   CompanyUnit?   @relation(fields: [companyUnitId], references: [id])  // ✅ RELATIONSHIP
  division  DivisionUnit?   @relation(fields: [divisionUnitId], references: [id]) // ✅ RELATIONSHIP
}
```

**Status:** ✅ **CORRECT** - `companyUnitId` and `divisionUnitId` are foreign keys with proper `@relation` directives. They ARE relationships to `CompanyUnit` and `DivisionUnit` models.

---

### 3. Specialty Fields - **NONE FOUND** ✅

**Search Results:**
- ❌ No `specialty` field on `WorkMe` model
- ❌ No `specialty` field on `WorkProfile` model
- ✅ Only reference: `myStrengthsRaw String? // "What are your specialties?"` in `MySkills` model (this is a user input field, not a deprecated field)

**Status:** ✅ **CLEAN** - No deprecated specialty fields found.

---

### 4. Profile Hydration Issue - **FIXED** ✅

**Problem:** Profile API was not always returning `company` and `division` in the response, causing the profile page to not hydrate properly.

**Fix Applied:**
- Updated `/api/workme/profile` GET endpoint to always include `company: null` and `division: null` in the response when profile doesn't exist
- Fixed the company/division loading logic to always return these fields (even if null)

**Status:** ✅ **FIXED** - Profile API now consistently returns company/division fields.

---

## Summary

| Issue | Status | Notes |
|-------|--------|-------|
| WorkMe has companyUnit/companyDivision as fields | ✅ **FALSE** | WorkMe model is clean - no such fields |
| WorkProfile has companyUnit/companyDivision as fields | ✅ **FALSE** | They are relationships (foreign keys with @relation) |
| Specialty fields in WorkMe/WorkProfile | ✅ **NONE** | No specialty fields found |
| Profile hydration issue | ✅ **FIXED** | API now always returns company/division fields |

---

## Conclusion

The schema is **correctly structured**:
- ✅ WorkMe model is pure identity (no company fields)
- ✅ WorkProfile uses relationships (foreign keys) to CompanyUnit and DivisionUnit
- ✅ No deprecated specialty fields
- ✅ Profile hydration fixed

If you're seeing `companyUnit` or `companyDivision` as direct String fields (not foreign keys), it may be:
1. An old migration that hasn't been applied
2. A database that's out of sync with the schema
3. A different model you're looking at (many other models use `companyUnit String?` for scoping, which is correct for those models)

**Recommendation:** Run `npx prisma migrate dev` to ensure database is in sync with schema.

