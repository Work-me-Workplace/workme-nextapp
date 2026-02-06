# MyWorkValue & MyContribution - Simple Summary

**Date:** February 6, 2026

## MyWorkValue (Simple Version)

**What It Is:**
- User uses AI: "What is your current job stuff you do?"
- AI parses skills/items (or however those work)
- Just have it on file for reference
- Person blog references it: "What skill do you want to highlight today?"

**Status:** ❌ **Not Built Yet**

**What We Need:**
- Simple AI prompt: "Describe your current job responsibilities"
- Parse into skills/capabilities
- Store somewhere (maybe SkillTopics? Or simpler model?)
- Blog generator can reference it

## MyContribution - Is It Baked In?

### Current State:

**MyContribution Model:**
- ✅ Exists in schema (`prisma/schema.prisma:3048`)
- ✅ Foreign key to `CompanyWork` (not baked into CompanyX)
- ✅ Separate model: `workMeId` + `companyWorkId` = unique contribution

**CompanyWork Model:**
- ✅ Links to CompanyX models (CompanyEvent, CompanyCampaign, etc.)
- ✅ Has `contributions MyContribution[]` relation
- ✅ Generic container for company work

**CompanyEvent Model:**
- ❌ **No JSON field** for user contribution
- ❌ **No MyContribution baked in**
- ✅ Links to CompanyWork via `companyWork CompanyWork[]`

### The Flow:

```
CompanyEvent (event you did)
  ↓
CompanyWork (generic container - created from event)
  ↓
MyContribution (your role - SEPARATE MODEL, foreign key)
```

**Answer:** MyContribution is **NOT baked into CompanyEvent**. It's a **separate model** with a foreign key to CompanyWork.

## Can We Add JSON to CompanyEvent?

**Current CompanyEvent Fields:**
- title, theme, description
- eventDate, startTime, endTime, location
- eventCategory, audience, vibe, perks, etc.
- **NO JSON field**

**Options:**

### Option 1: Add JSON Field to CompanyEvent
```prisma
model CompanyEvent {
  // ... existing fields
  contributionData Json? // User's contribution to this event
}
```

**Pros:**
- Simple, direct
- Can store role, description, skills demonstrated

**Cons:**
- Not normalized
- Can't query easily
- Duplicates MyContribution concept

### Option 2: Use MyContribution (Recommended)
- CompanyEvent → CompanyWork (already exists)
- CompanyWork → MyContribution (already exists in schema)
- Just need to build the UI/API

**Pros:**
- Already in schema
- Normalized
- Can query contributions
- Reusable pattern

**Cons:**
- Need to create CompanyWork first
- More steps

### Option 3: Add Simple JSON to CompanyEvent (MVP1)
```prisma
model CompanyEvent {
  // ... existing fields
  myContribution Json? // Simple: { role: "...", description: "...", skills: [...] }
}
```

**Pros:**
- Fastest for MVP1
- No extra models
- Just add field and use it

**Cons:**
- Not normalized
- Can't query contributions across events easily

## Recommendation for MVP1

**For MyWorkValue:**
- Create simple API: `/api/myworkvalue/generate`
- AI prompt: "What do you do in your current job?"
- Parse into skills list
- Store in simple model or JSON on WorkMe

**For MyContribution:**
- **Option 3** (add JSON to CompanyEvent) for MVP1
- Later migrate to MyContribution model if needed
- Keep it simple: just add `myContribution Json?` field

## Files to Check

1. `prisma/schema.prisma` - CompanyEvent model (line 644)
2. `prisma/schema.prisma` - MyContribution model (line 3048)
3. `prisma/schema.prisma` - CompanyWork model (line 2996)
4. `lib/services/blogTopicGenerator.ts` - Blog generator (references SkillTopics)
