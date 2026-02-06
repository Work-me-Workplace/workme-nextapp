# Work Value Model - Simple High-Level Summary

**Date:** February 6, 2026

## What Is It? (Simple Version)

A system to track **what you can do** (skills) based on **what you actually did** (work).

## The Core Idea

1. **You do work** (events, projects, etc.)
2. **You document your role** in that work
3. **System identifies skills** you demonstrated
4. **System generates assessment** of what you accomplished

## What's Actually Built?

### ✅ In Schema (Models Exist):
- `CompanyWork` - Generic container for company work/events
- `MyContribution` - Your role in a piece of work
- `SkillTopic` - A capability/skill (e.g., "Event Coordination")
- `SkillItem` - Evidence of that skill (e.g., "Planned Holiday Open House")
- `ContributionSummary` - Assessment of what you did

### ❌ Not Built Yet:
- No API endpoints for MyContribution
- No UI for creating MyContribution
- No automatic skill extraction
- No automatic assessment generation

## Current State (MVP1)

**What We Have:**
- ✅ Goals page (set your north star)
- ✅ Manual assessment form (document accomplishments)
- ✅ Appraisal helper (compare goals vs assessments)

**What We Don't Have:**
- ❌ Event → Work → Contribution flow
- ❌ Automatic skill identification
- ❌ Automatic assessment generation

## Is MyContribution Part of CompanyX?

**Answer: Sort of, but not really.**

- `CompanyWork` exists and links to CompanyX models (events, campaigns, etc.)
- `MyContribution` exists in schema but **not used anywhere**
- CompanyX stuff creates `CompanyWork`, but users don't document `MyContribution` yet

**The Gap:**
- CompanyX creates work/events ✅
- But there's no way for users to say "I contributed to this work" ❌
- So assessments can't be auto-generated ❌

## Simple Flow (What Should Happen)

```
1. Event happens (CompanyX creates CompanyWork)
   ↓
2. User says "I worked on this" (MyContribution - NOT BUILT)
   ↓
3. System says "You showed these skills" (SkillTopics - NOT BUILT)
   ↓
4. System generates assessment (ContributionSummary - NOT BUILT)
```

## What We're Doing Now (MVP1)

```
1. User sets goals manually ✅
2. User writes assessment manually ✅
3. User compares them ✅
```

**This is fine for MVP1!** Manual is better than nothing.

## Bottom Line

- **Work Value Model** = Track skills from work
- **MyContribution** = Exists in schema, not used yet
- **CompanyX** = Creates CompanyWork, but no user contribution flow
- **MVP1** = Manual goals + manual assessments = Good enough!

**Keep it simple:** Goals → Assessments → Appraisal Helper. That's what we have, and it works!
