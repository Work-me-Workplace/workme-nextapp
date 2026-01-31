# Platform Update Flow - Slide Summary

## The Problem We're Solving

**News items about platform units** (e.g., "carrier goes out to sea", "builders trials complete") need to be:
1. **Ingested** from news sources
2. **Stored** as source of truth
3. **Used** for product development

---

## The Ideal Flow

```
News Source → Ingest → Store as Source of Truth → Use for Products
```

### Step 1: Ingest (from news source)
- Raw article text stored in `CompanyPlatformUnitStatement`
- This is the **source of truth** - never loses original context

### Step 2: Store (as structured data)
- Parsed information stored in `CompanyPlatformUnitUpdate`
- Tracks: status, dates, progress, timeline ("on time?", "delayed?")

### Step 3: Use (for products)
- Display updates on platform unit pages
- Track unit progress over time
- Generate products (digital signage, reports)

---

## Two Update Patterns

### Pattern 1: Platform Ingest → Unit → Unit Update
**When:** New platform/unit from article
**Flow:** Create platform → Create unit → Create update

### Pattern 2: One-Off Unit Update
**When:** Platform/unit already exists
**Flow:** Direct update creation (statement + update)

**Answer:** ✅ **Both patterns exist** - use Pattern 2 for existing units, Pattern 1 for new platforms

---

## Tracking Specific Units

**Example: "Builders Trials"**
- `statusUpdate`: "Builders trials"
- `seaTrialsStartDate`: [date]
- `scheduleNote`: "On time" or "Delayed"

**Models Track:**
- **CompanyPlatformUnitStatement** - Raw article (source of truth)
- **CompanyPlatformUnitUpdate** - Structured data (status, dates, progress)
- **CompanyPlatformUnit** - The unit being tracked

---

## Key Models

| Model | Purpose | Example |
|-------|---------|---------|
| `CompanyPlatformUnitStatement` | Source of truth (raw article) | "USS Gerald R. Ford completes builders trials..." |
| `CompanyPlatformUnitUpdate` | Structured data | statusUpdate: "Builders trials", seaTrialsStartDate: 2026-01-15 |
| `CompanyPlatformUnit` | The unit | "USS Gerald R. Ford (CVN-78)" |

---

## Current State

✅ **Working:**
- Ingest from news sources
- Store as source of truth (Statement)
- Parse and store structured data (Update)
- Track specific units and events
- Display updates on unit pages

⏳ **Partial:**
- Product generation from updates (digital signage works)
- Milestone extraction from updates (not implemented)

---

## For Product Development

**Simple Flow:**
1. **Ingest** news article → Creates Statement (source of truth)
2. **Parse** article → Creates Update (structured data)
3. **Use** Update → Display, track progress, generate products

**Tracking:**
- Event types: `statusUpdate` field ("builders trials", "sea trials")
- Timeline: `scheduleNote` field ("on time", "delayed")
- Dates: `seaTrialsStartDate`, `keelLaidDate`, etc.

---

## Key Takeaway

**You can do one-off updates** - you don't need to create the platform/unit first if it already exists.

**The flow is:**
- News article → Ingest → Store → Use

**Models handle:**
- Source of truth (Statement)
- Structured data (Update)
- Unit tracking (PlatformUnit)
