# WorkMe Identity: The Start of a Career

## Who is WorkMe?

**WorkMe** is your career identity. It's the foundation of your professional journey on the platform.

When you sign up, you get a `workMeId` - a unique identifier that represents **you** and your career. This isn't just a user account. It's the start of tracking your professional growth, achievements, and impact.

---

## The WorkMe Model

### Core Identity

Every person on WorkMe has a **WorkMe record** that includes:

- **Basic Info**: Name, email, photo
- **Career Details**: Job title, role level, specialty, industry
- **Location**: Where you work (city, state, work location type)
- **Compensation**: Salary range and annual salary (optional)

### Career Context

The WorkMe model captures where you are in your career:

- **Job Role**: Individual Contributor, Manager, Director Level, or Project Lead
- **Specialty**: Your area of expertise (e.g., "Digital Marketing", "Product Design")
- **Industry**: The industry you work in (e.g., "Technology", "Healthcare")
- **Work Location**: Remote, Hybrid, or Office-based

---

## How WorkMe Connects to Everything

### Your Achievements

Every achievement you document is linked to your `workMeId`. This means:

- All your accomplishments are tied to **your career identity**
- You can track your impact over time
- Your achievements reflect your professional growth

### Your Objectives

The goals you set are connected to your WorkMe record. This allows you to:

- Track progress toward career objectives
- Measure how your work aligns with your goals
- See your professional development journey

### Your Comms & Campaigns

The communications you create and campaigns you're part of are all linked to your `workMeId`. This creates a complete picture of:

- What you've communicated
- What campaigns you've supported
- How your work connects to broader organizational goals

---

## The Flow: From Signup to Career Dashboard

1. **Sign Up** → You create a WorkMe record (get your `workMeId`)
2. **Profile Setup** → You define your career context (role, industry, location)
3. **Career Dashboard** → You start tracking achievements, objectives, and impact

---

## Why This Matters

**WorkMe isn't just a user account - it's your career foundation.**

- Every achievement you log is part of **your professional story**
- Every objective you set helps you **grow your career**
- Every comms output and campaign shows **your impact**

Your `workMeId` is the thread that connects everything you do on the platform. It's how we know:

- What you've accomplished
- Where you're going
- How you're growing

---

## Technical Note

From a technical perspective:
- `workMeId` = The UUID primary key of your WorkMe record
- All user-scoped data (Achievements, Objectives, CommsOutputs, CompanyCampaigns) stores `workMeId` in a `workMeId` field
- Firebase handles authentication; WorkMe stores your career identity

But the important part is: **This is where your career starts on WorkMe.**
