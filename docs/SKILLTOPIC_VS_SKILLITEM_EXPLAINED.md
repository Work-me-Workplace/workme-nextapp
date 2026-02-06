# SkillTopic vs SkillItem - Simple Explanation

**Date:** February 6, 2026

## The Simple Difference

### SkillTopic = **What You Can Do** (High-Level Capability)
- **10,000 ft altitude** - Big picture
- **Durable capability** - Stays with you across roles/orgs
- Examples: "Workforce Engagement", "Event Coordination", "Narrative Development"

### SkillItem = **Proof You Did It** (Evidence)
- **1,000 ft altitude** - Specific examples
- **Concrete evidence** - Actual things you did
- Examples: "Planned Holiday Open House", "Sent email about event", "Created presentation deck"

## The Relationship

```
SkillTopic: "Workforce Engagement"
  ├── SkillItem: "Planned Holiday Open House event"
  ├── SkillItem: "Sent engagement survey to 500 employees"
  └── SkillItem: "Created recognition program"
```

**Think of it like:**
- **SkillTopic** = The skill/capability (like "Cooking")
- **SkillItem** = Specific examples/proof (like "Made lasagna", "Baked bread", "Grilled steak")

## Why "Recent SkillItem"?

When generating blog topics, the system looks at:
- **SkillTopic** = What skill you want to highlight (e.g., "Workforce Engagement")
- **Recent SkillItems** = Recent evidence/examples of that skill (e.g., "Last month's event", "Recent survey")

The blog generator uses **recent SkillItems** as evidence/examples to write about the **SkillTopic**.

## How It Works with MyContribution

**MyContribution** = Your role in CompanyX work (Event, Campaign, etc.)

**Now with Skills:**
- MyContribution can link to SkillTopics (`skillTopicIds`)
- This says: "In this contribution, I demonstrated these skills"
- Example: Contribution to "Holiday Open House" → Skills: ["Event Coordination", "Workforce Engagement"]

**Flow:**
```
1. You do work (CompanyEvent: "Holiday Open House")
   ↓
2. You document contribution (MyContribution)
   - whatDid: "Planned event logistics"
   - skillTopicIds: ["event-coordination", "workforce-engagement"]
   ↓
3. SkillItems get created (evidence)
   - SkillItem: "Planned Holiday Open House" → SkillTopic: "Event Coordination"
   ↓
4. Blog generator uses:
   - SkillTopic: "Event Coordination"
   - Recent SkillItems: ["Planned Holiday Open House", ...]
   - MyContribution: Your role and impact
```

## For Blog Generation

**If you want to highlight "Workforce Engagement":**
- Select SkillTopic: "Workforce Engagement"
- System finds recent SkillItems (evidence)
- System can also use MyContribution (your role/impact)
- Generates blog topics showing off that skill

**Example:**
- SkillTopic: "Workforce Engagement"
- Recent SkillItems: ["Planned Holiday Open House", "Created recognition program"]
- MyContribution: "Led event planning, increased attendance by 30%"
- Blog Topic: "How Event Coordination Builds Workforce Engagement: Lessons from Our Holiday Open House"

## Key Points

1. **SkillTopic** = The skill/capability (what you can do)
2. **SkillItem** = Evidence/proof (specific examples)
3. **MyContribution** = Your role in work (can link to SkillTopics)
4. **Recent SkillItems** = Recent evidence used for blog generation

**For blogs:** You pick a SkillTopic to highlight, system uses recent SkillItems as evidence, and can include MyContribution context.
