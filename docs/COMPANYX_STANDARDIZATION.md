# CompanyX Models Standardization

**Date:** 2025-01-XX  
**Purpose:** Document the standardized pattern for all CompanyX models

---

## Standardized Fields

All CompanyX models should have these core fields:

### 1. **Date Field**
- **Pattern:** `{modelName}Date` or `date` (depending on context)
- **Type:** `DateTime?`
- **Examples:**
  - `CompanyEvent.eventDate`
  - `CompanyTraining.trainingDate`
  - `CompanyCommunity.date`
  - `CompanyImpactEvent.effectiveDate`

### 2. **Time Fields**
- **Pattern:** `startTime` and `endTime`
- **Type:** `String?`
- **Examples:**
  - `CompanyEvent.startTime`, `CompanyEvent.endTime`
  - `CompanyTraining.startTime`, `CompanyTraining.endTime`
  - `CompanyLeaderEngagement.startTime`, `CompanyLeaderEngagement.endTime`

### 3. **Location Field**
- **Pattern:** `location`
- **Type:** `String?`
- **Status:** ✅ **ADDED to CompanyEvent** (was missing)
- **Examples:**
  - `CompanyEvent.location` ✅
  - `CompanyTraining.location`
  - `CompanyCommunity.location`
  - `CompanyLeaderEngagement.location`

### 4. **Company ID**
- **Pattern:** `companyId`
- **Type:** `String?`
- **Relation:** `Company? @relation(...)`
- **Purpose:** Multi-tenant scoping

### 5. **Owner ID (Author ID)**
- **Pattern:** `createdByWorkMeId`
- **Type:** `String @db.Uuid`
- **Relation:** `WorkMe @relation("CompanyXCreator", ...)`
- **Purpose:** Tracks who created/owns the content

---

## CompanyEvent Refactoring

### Changes Made

1. ✅ **Added `location` field** - Now matches CompanyX pattern
2. ✅ **Standardized field organization** - Grouped fields with comments
3. ✅ **Removed EventItem relation** - Deprecated (products now link via CompanyWorkLink)
4. ✅ **Added index on `eventDate`** - For querying by date
5. ✅ **Marked EventItem as deprecated** - Added deprecation comments

### Before vs After

**Before:**
```prisma
model CompanyEvent {
  // Missing location field
  eventDate DateTime?
  startTime String?
  endTime   String?
  // No location!
  
  eventItems EventItem[] @relation  // Deprecated
}
```

**After:**
```prisma
model CompanyEvent {
  // Standardized CompanyX Fields
  eventDate DateTime?  // Date field (standardized)
  startTime String?     // Time field (standardized)
  endTime   String?    // Time field (standardized)
  location  String?     // Location field (standardized) - ADDED
  
  // Standardized Relations
  companyId         String?  // Company ID (standardized)
  createdByWorkMeId String   @db.Uuid  // Owner ID / Author ID (standardized)
  
  // EventItem relation removed - deprecated
}
```

---

## EventItem Deprecation

### Status: ⚠️ **DEPRECATED**

**Reason:** Products now have foreign key capability via `CompanyWorkLink`, making EventItem redundant.

**Migration Path:**
- Old `EventItem` data can be migrated to `WorkCommsProduct` with `CompanyWorkLink`
- Event-specific items should be stored as products, not EventItems
- The model is kept for backward compatibility but should not be used for new features

**Old Pattern:**
```
CompanyEvent → EventItem (deprecated)
```

**New Pattern:**
```
CompanyEvent → CompanyWorkLink → WorkCommsProduct
```

---

## CompanyX Models Checklist

| Model | Date Field | Start Time | End Time | Location | Company ID | Owner ID | Status |
|-------|-----------|------------|----------|----------|-----------|----------|--------|
| **CompanyEvent** | ✅ eventDate | ✅ startTime | ✅ endTime | ✅ location | ✅ companyId | ✅ createdByWorkMeId | ✅ Standardized |
| **CompanyTraining** | ✅ trainingDate | ✅ startTime | ✅ endTime | ✅ location | ✅ companyId | ✅ createdByWorkMeId | ✅ Standardized |
| **CompanyLeaderEngagement** | ✅ engagementDate | ✅ startTime | ✅ endTime | ✅ location | ✅ companyId | ✅ createdByWorkMeId | ✅ Standardized |
| **CompanyCommunity** | ✅ date | ❌ | ❌ | ✅ location | ✅ companyId | ✅ createdByWorkMeId | ⚠️ Missing times |
| **CompanyCampaign** | ✅ windowStart/windowEnd | ❌ | ❌ | ❌ | ✅ companyId | ✅ createdByWorkMeId | ⚠️ Different pattern |
| **CompanyImpactEvent** | ✅ effectiveDate | ❌ | ❌ | ❌ | ✅ companyId | ✅ createdByWorkMeId | ⚠️ Different pattern |
| **CompanyBenefits** | ✅ windowStart/windowEnd | ❌ | ❌ | ❌ | ✅ companyId | ✅ createdByWorkMeId | ⚠️ Different pattern |
| **CompanyCareer** | ❌ | ❌ | ❌ | ❌ | ✅ companyId | ✅ createdByWorkMeId | ⚠️ No date/time/location |
| **CompanyEmployeeCause** | ✅ windowStart/windowEnd | ❌ | ❌ | ✅ locations[] | ✅ companyId | ✅ createdByWorkMeId | ⚠️ Different pattern |

### Notes

- **Event-like models** (CompanyEvent, CompanyTraining, CompanyLeaderEngagement) follow the full pattern
- **Window-based models** (CompanyCampaign, CompanyBenefits, CompanyEmployeeCause) use `windowStart`/`windowEnd` instead of single date
- **Community** has date but no times (makes sense for community events)
- **Career** has no date/time/location (makes sense - it's an opportunity, not an event)

---

## Recommendations

1. ✅ **CompanyEvent** - Fully standardized
2. ⚠️ **CompanyCommunity** - Consider if startTime/endTime are needed
3. ℹ️ **Window-based models** - Current pattern is appropriate (windowStart/windowEnd)
4. ℹ️ **CompanyCareer** - Current pattern is appropriate (no date/time needed)

---

**Last Updated:** 2025-01-XX

