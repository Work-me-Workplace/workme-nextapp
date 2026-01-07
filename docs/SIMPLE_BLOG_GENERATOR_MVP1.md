# Simple Blog Generator (MVP1)

**Date:** 2025-01-XX  
**Status:** ✅ **IMPLEMENTED**  
**Purpose:** Generate 6-paragraph blog posts from user inputs with company context

---

## 🎯 Overview

A simple blog generator for MVP1 that takes user inputs and generates a 6-paragraph reflection-based blog post.

**Key Features:**
- ✅ User inputs: What happened, What it taught
- ✅ Company context: Automatically pulled from user's company
- ✅ 6-paragraph structure
- ✅ Workforce communications focus
- ✅ Positive ending

---

## 📋 Blog Structure

The generated blog has exactly 6 paragraphs:

1. **What Happened** - Set the scene, describe the situation
2. **What It Taught** - Lessons learned, insights gained
3. **How It Applies to Workforce Comms** - Connect to employee messaging, internal comms
4. **Additional Reflection** - Deeper learning, broader implications
5. **Additional Reflection** - Practical application, real-world relevance
6. **Positive Conclusion** - Forward-looking, optimistic, actionable next steps

---

## 🛣️ API Route

### POST `/api/blog/generate`

**Request Body:**
```json
{
  "whatHappened": "Led a major company event that brought together 200+ employees",
  "whatItTaught": "The importance of clear communication and creating moments that matter",
  "additionalContext": "This was during a period of organizational change"
}
```

**Response:**
```json
{
  "success": true,
  "blog": {
    "paragraphs": [
      "First paragraph about what happened...",
      "Second paragraph about what it taught...",
      "Third paragraph about workforce comms...",
      "Fourth paragraph with additional reflection...",
      "Fifth paragraph with additional reflection...",
      "Sixth paragraph ending on a positive note..."
    ],
    "fullText": "First paragraph...\n\nSecond paragraph...\n\n..."
  }
}
```

---

## 🔧 Service Function

### `generateSimpleBlog(input)`

**Input:**
```typescript
{
  workMeId: string;
  whatHappened: string;
  whatItTaught: string;
  additionalContext?: string;
}
```

**Output:**
```typescript
{
  paragraphs: string[]; // 6 paragraphs
  fullText: string;    // Combined text
}
```

**Process:**
1. Get company context from WorkMe.companyId
2. Build AI prompt with user inputs + company context
3. Generate blog using OpenAI GPT-4o
4. Parse and validate 6 paragraphs
5. Return structured output

---

## 🏢 Company Context

The service automatically pulls company context from the user's WorkMe record:

- Company name
- Industry
- Company description
- Headcount
- User's title

This context is used to:
- Tailor the blog to the company's industry
- Use appropriate language and examples
- Connect to workforce communications in relevant ways

---

## 📝 Example Usage

### Example 1: Basic Input

```typescript
const blog = await generateSimpleBlog({
  workMeId: "workme-123",
  whatHappened: "Coordinated a company-wide town hall that brought together 500 employees across 3 locations",
  whatItTaught: "The power of in-person connection and transparent communication during times of change",
});
```

**Output:** 6-paragraph blog connecting the event to workforce communications

### Example 2: With Additional Context

```typescript
const blog = await generateSimpleBlog({
  workMeId: "workme-123",
  whatHappened: "Launched a new internal communications platform",
  whatItTaught: "How technology can enhance but never replace human connection",
  additionalContext: "This was part of our digital transformation initiative",
});
```

**Output:** 6-paragraph blog with additional context woven in

---

## 🎨 AI Prompt Design

The service uses a carefully crafted prompt that:

1. **Provides Full Context:**
   - User inputs (what happened, what it taught)
   - Company information (name, industry, description)
   - User's title

2. **Enforces Structure:**
   - Exactly 6 paragraphs
   - Each paragraph 3-5 sentences
   - Specific content for each paragraph

3. **Maintains Style:**
   - Experiential and reflective (not instructional)
   - Professional but personal
   - Grounded in real experience
   - Connects to workforce communications
   - Ends on a positive note

4. **Structures Output:**
   - JSON format with exact schema
   - Array of 6 paragraph strings

---

## ✅ Validation

The service validates:

1. **Required Fields:**
   - `whatHappened` must be provided and non-empty
   - `whatItTaught` must be provided and non-empty

2. **Output Structure:**
   - Must have exactly 6 paragraphs
   - Each paragraph must be a non-empty string

3. **Company Context:**
   - WorkMe must exist
   - Company context is optional (blog still generates if no company)

---

## 🔍 Error Handling

### Missing Required Fields
```json
{
  "success": false,
  "error": "whatHappened is required"
}
```

### WorkMe Not Found
```json
{
  "success": false,
  "error": "WorkMe not found: workme-123"
}
```

### AI Generation Failure
```json
{
  "success": false,
  "error": "Failed to generate blog: [error message]"
}
```

### Invalid Output Structure
```json
{
  "success": false,
  "error": "Expected 6 paragraphs, got 5"
}
```

---

## 🧪 Testing

### Test Cases

1. **Basic Generation:**
   - [ ] Generate blog with required fields only
   - [ ] Verify 6 paragraphs returned
   - [ ] Verify paragraphs are non-empty

2. **With Additional Context:**
   - [ ] Generate blog with additional context
   - [ ] Verify context is incorporated

3. **Company Context:**
   - [ ] Generate blog with company context
   - [ ] Generate blog without company context
   - [ ] Verify company context is used appropriately

4. **Validation:**
   - [ ] Reject missing whatHappened
   - [ ] Reject missing whatItTaught
   - [ ] Handle empty strings

5. **Error Handling:**
   - [ ] Handle WorkMe not found
   - [ ] Handle AI generation failure
   - [ ] Handle invalid output structure

---

## 📚 Related Documentation

- [Blog Topic Generator Service](./BLOG_TOPIC_GENERATOR_SERVICE.md) - Advanced version with SkillTopics
- [Company Model](./COMPANY_MODEL_INSPECTION.md) - Company context structure

---

## 🚀 Future Enhancements

- [ ] Save generated blogs to database
- [ ] Allow editing of generated paragraphs
- [ ] Support different blog lengths (4, 6, 8 paragraphs)
- [ ] Support different tones (professional, casual, reflective)
- [ ] Integration with LinkedIn posting

---

**Status:** ✅ MVP1 implementation complete. Ready for UI integration.

