# Work Value Model - Quick Reference

**Last Updated:** 2025-01-XX  
**Status:** ✅ **COMPLETE**

---

## 🎯 CORE PRINCIPLE

**SkillTopics are the North Star. Everything else is a consumer.**

---

## 📊 MODEL OVERVIEW

### Core Models (Foundation)
- **SkillTopic** - Durable capability (10,000 ft altitude)
- **SkillItem** - Evidence-level execution (1,000 ft altitude)

### Market Intelligence
- **MarketNeed** - Market contexts where skills matter
- **SkillTopicMarketValue** - Join model (qualitative relevance)

### Adjacent Pivots
- **SkillTopicPivot** - Mobility paths between SkillTopics

### Company Work Bridge
- **CompanyWork** - Generic container for company-owned work
- **MyContribution** - User-specific contribution view

### Assessments
- **ContributionSummary** - Post-work assessment summaries

### Branding
- **BrandNarrative** - SkillTopic → brand narrative translation
- **BrandPositioning** - Overall brand positioning

---

## 🔄 DATA FLOW

```
CompanyWork (Holiday Open House)
  ↓
MyContribution (user's role)
  ↓
SkillItems (evidence)
  ↓
SkillTopics (capabilities)
  ↓
Market Value Intelligence
  ↓
Blog Topics / Branding / Assessments
```

---

## ✅ AI ALLOWED

- Infer SkillTopics from evidence
- Suggest market relevance
- Propose blog topics
- Suggest adjacent pivots
- Generate contribution summaries

## ❌ AI NOT ALLOWED

- Invent skills without evidence
- Score people
- Determine readiness or worth
- Create performance ratings
- Make hiring/promotion recommendations

---

## 📁 FILES CREATED

1. **Prisma Schema** (`prisma/schema.prisma`)
   - All models added
   - Relations configured
   - Indexes added

2. **Architecture Documentation** (`docs/WORK_VALUE_MODEL_ARCHITECTURE.md`)
   - Complete system architecture
   - Model relationships
   - End-to-end flow example

3. **AI Guardrails** (`docs/WORK_VALUE_MODEL_AI_GUARDRAILS.md`)
   - AI boundaries defined
   - System invariants
   - Prompt templates

4. **Blog Topic Generator** (`lib/services/blogTopicGenerator.ts`)
   - Service structure
   - Example implementation
   - Ready for OpenAI integration

5. **Quick Reference** (`docs/WORK_VALUE_MODEL_SUMMARY.md`)
   - This file

---

## 🚀 NEXT STEPS

1. **Run Migration**
   ```bash
   npx prisma migrate dev --name add_work_value_model
   ```

2. **Seed MarketNeeds**
   - Create common market needs (Change Enablement, Tech Adoption, etc.)

3. **Implement AI Services**
   - SkillTopic inference
   - Market relevance suggestions
   - Blog topic generation (OpenAI integration)

4. **Build UI**
   - SkillTopic management
   - SkillItem creation
   - Market value management
   - Blog topic selection

---

## 📝 KEY INVARIANTS

1. ✅ No naked skills (SkillTopic must have SkillItems)
2. ✅ Evidence-based only (no hypothetical skills)
3. ✅ No scoring (qualitative only)
4. ✅ User confirmation required (AI suggests, user confirms)
5. ✅ Post-work assessments (after work is done)
6. ✅ Branding is read-only (translates, doesn't create)

---

**End of Document**

The Work Value Model system is now ready for implementation! 🚀

