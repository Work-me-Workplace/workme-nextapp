# MVP1 Architecture Refactor - Status Report

## ✅ Completed

### Prisma Schema
- ✅ Removed `CompanyUnit` model
- ✅ Removed `DivisionUnit` model  
- ✅ Removed `CompanyUnitMembers` model
- ✅ Removed `CompanyEmployeeHighlightUnit` junction table
- ✅ Updated `WorkMe` model: replaced `companyUnitId`, `divisionId` FKs with `companyUnit`, `division` strings
- ✅ Updated `CompanyEmployee` model: replaced FKs with string fields
- ✅ Updated `CompanyEmployeeHighlight`: added `companyUnitLabel` string field, removed unit junction
- ✅ Kept `CompanyEmployeeHighlightLink` (for multi-employee highlights - not organizational)

### Core Functions
- ✅ Updated `loadWorkMe()`: removed all membership logic, returns `companyId`, `companyUnit`, `division` directly
- ✅ Updated `upsertEmployee()`: removed normalization/lookup logic, uses string fields directly

### Highlight Routes
- ✅ `/api/company/highlights/ingest` - Updated to use `companyId` directly, no lookups
- ✅ `/api/company/highlights/save` - Updated to use `companyId` directly, no lookups
- ✅ `/api/company/highlights/route.ts` (GET) - Updated to filter by `companyId`
- ✅ `/api/highlights/route.ts` (GET) - Updated to filter by `companyId` (still conflicts with canonical route)

### Service Functions
- ✅ `listHighlights()` - Updated to filter by `companyId` instead of `companyUnitId`

---

## ⚠️ Remaining Work

### Routes Requiring Updates

#### High Priority - Highlight Routes
- [ ] `/api/highlights/create` - Still uses old schema with `companyUnitId`/`divisionId` in request body
- [ ] `/api/highlights/[id]` - Still references `CompanyEmployeeHighlightUnit` junction table
- [ ] `/api/company/highlights/create` - Needs review for MVP1 compliance

#### Company Affiliation Routes
- [ ] `/api/company-affiliation/save` - Extensive use of `CompanyUnit`/`DivisionUnit` models - needs complete rewrite
- [ ] `/api/company-unit/create` - Entire route creates `CompanyUnit` - should be deprecated or rewritten
- [ ] `/api/division/create` - Creates `DivisionUnit` - should be deprecated

#### WorkMe Profile Routes
- [ ] `/api/workme/profile` - References `companyUnitId`, `divisionId` - needs update
- [ ] `/api/workme/hydrate` - May reference old fields

#### WorkForce Stuff Routes
- [ ] `/api/workforcestuff/route.ts` - Uses `companyUnitId` query param - should use `companyId`
- [ ] `/api/workforcestuff/training/[trainingId]` - Uses `companyUnit` string (OK) but may need `companyId` check
- [ ] `/api/workforcestuff/career/[careerId]` - Same as above

#### WorkStuff Ingest Routes
- [ ] `/api/workstuff/ingest/create-training` - Uses `companyUnitId` in payload - should use `companyId`
- [ ] `/api/workstuff/ingest/training-hydrate` - Comments reference `companyUnitId`
- [ ] `/api/workstuff/ingest/career-hydrate` - Comments reference `companyUnitId`
- [ ] `/api/workstuff/ingest/training-save` - Comments reference `companyUnitId`
- [ ] `/api/workstuff/ingest/career-save` - Comments reference `companyUnitId`

#### WorkEngage Routes
- [ ] `/api/workengage/highlight` - Uses `companyUnit` string (OK) but should use `companyId` for scoping

---

## 🔍 Global Search Patterns to Fix

Run these searches and update all occurrences:

```bash
# Find all CompanyUnit references
grep -r "CompanyUnit" app/api lib/

# Find all companyUnitId references  
grep -r "companyUnitId" app/api lib/

# Find all divisionId references
grep -r "divisionId" app/api lib/

# Find all CompanyUnitMembers references
grep -r "CompanyUnitMembers" app/api lib/

# Find all CompanyEmployeeHighlightUnit references
grep -r "CompanyEmployeeHighlightUnit" app/api lib/
```

---

## 📋 Route Consolidation Needed

### Conflicting Routes
The following routes appear to duplicate functionality:
- `/api/highlights/*` vs `/api/company/highlights/*`

**Recommendation**: 
- Keep `/api/company/highlights/*` as canonical
- Delete or deprecate `/api/highlights/*` routes
- OR: Make `/api/highlights/*` redirect to `/api/company/highlights/*`

---

## 🎯 Core Principles Applied

1. ✅ `companyId` = ONLY authoritative organizational FK
2. ✅ `companyUnit` = Optional string label (no FK, no lookup)
3. ✅ `division` = Optional string label (no FK, no lookup)
4. ✅ NO membership tables
5. ✅ NO unit/division FK relations
6. ✅ NO unit lookups or normalization

---

## 📝 Migration Notes

### Database Migration Required

After schema changes, you'll need to:
1. Run `prisma migrate dev` to create migration
2. Write data migration script to:
   - Copy `companyUnitId` → `companyUnit` (string name) where applicable
   - Copy `divisionId` → `division` (string name) where applicable
   - Populate `companyId` on `WorkMe` from old membership tables if needed

### Breaking Changes

- All routes that accepted `companyUnitId`/`divisionId` in request bodies need frontend updates
- Frontend should send `companyUnit`/`division` as strings instead
- Frontend should get `companyId` from `/api/workme/me` response

---

## 🚀 Next Steps

1. **Complete route updates** - Work through remaining routes systematically
2. **Delete deprecated routes** - Remove `/api/company-unit/*` and `/api/division/*` if no longer needed
3. **Update frontend** - Ensure frontend uses new field names
4. **Create migration** - Run Prisma migration and data migration
5. **Test thoroughly** - Verify all highlight/employee functionality works

---

## ⚠️ Known Issues

1. **CompanyUnitRegistry model** - Still exists in schema (line 333) - marked as "Legacy - Deprecated" but not removed
2. **CompanyUnitRole enum** - Commented out but enum definition still exists
3. **Multiple filtering patterns** - Some routes filter by `companyId`, others by `companyUnit` string - should standardize

