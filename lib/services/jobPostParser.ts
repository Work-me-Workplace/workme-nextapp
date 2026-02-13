/**
 * Job Post Parser & Skill Match Service
 *
 * Use case: Paste an HR/job posting (e.g. BAE social media manager) → parse out
 * skills/requirements → match against your WorkSkills and say "yep I have that."
 *
 * Flow:
 * 1. Parse job post text → structured list of skills/requirements
 * 2. Match each to user's skills (WorkSkills raw + enriched) → matched (with evidence) or gap
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// TYPES
// ============================================

export interface ParsedRequirement {
  /** Short label (e.g. "Social media strategy") */
  label: string;
  /** Original phrasing from the job post */
  originalPhrase?: string;
  /** Requirement type for grouping */
  type: 'skill' | 'experience' | 'qualification' | 'responsibility' | 'other';
}

export interface MatchResult {
  requirement: ParsedRequirement;
  /** true = you have evidence for this */
  matched: boolean;
  /** Your evidence / how you meet it (from your skills/strengths/specialties) */
  evidence?: string;
  /** Optional: suggested angle for a blog or talking point */
  suggestedAngle?: string;
}

export interface JobPostMatchOutput {
  /** Job title/role inferred from the post (if detectable) */
  jobTitle?: string;
  /** Parsed requirements from the job post */
  requirements: ParsedRequirement[];
  /** For each requirement: match result with evidence or gap */
  matches: MatchResult[];
  /** One-line summary for quick scan */
  summary?: string;
}

export interface JobPostMatchInput {
  jobPostText: string;
  /** User's raw skills text (WorkSkills.skillsRaw) */
  skillsRaw?: string | null;
  /** User's raw strengths (WorkSkills.strengthsRaw) */
  strengthsRaw?: string | null;
  /** User's specialties / job responsibilities (WorkSkills.specialties) */
  specialties?: string | null;
  /** Optional: AI-enriched summaries from /api/myskills/enrich for better matching */
  skillsSummary?: string | null;
  strengthsSummary?: string | null;
  specialtiesSummary?: string | null;
}

// ============================================
// MAIN ENTRY
// ============================================

/**
 * Parse a job post and match each requirement to the user's skills.
 * Returns requirements + for each: matched (with evidence) or gap.
 */
export async function parseAndMatchJobPost(
  input: JobPostMatchInput
): Promise<JobPostMatchOutput> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for job post matching');
  }

  const userContext = buildUserContext(input);

  const prompt = `You are a career coach helping a candidate see how they fit a job posting.

JOB POSTING (paste from HR):
---
${input.jobPostText}
---

CANDIDATE'S PROFILE (their own description of skills, strengths, and specialties):
---
${userContext}
---

TASKS:
1. Extract from the job posting a list of 8–20 distinct requirements: skills, experience, qualifications, responsibilities. For each, give a short "label" and the "originalPhrase" from the post. Classify each as one of: skill, experience, qualification, responsibility, other.
2. For EACH requirement, decide: does the candidate's profile provide evidence that they meet this? If yes, set "matched": true and write 1–2 sentences of "evidence" quoting or paraphrasing their profile. If they could position themselves with a blog or story, add a short "suggestedAngle". If no evidence, set "matched": false and leave evidence/suggestedAngle empty.
3. Infer a "jobTitle" from the posting if obvious (e.g. "Social Media Manager").
4. Write a "summary" in one sentence: e.g. "You match 12 of 15 requirements; strongest on X and Y; gaps in Z."

Be fair but generous: if their profile implies the skill (e.g. "internal comms" can match "employee communications"), count it as matched and cite the relevant part of their profile. Only mark unmatched when there is no reasonable overlap.

Return valid JSON only, no markdown, in this exact shape:
{
  "jobTitle": "string or null",
  "requirements": [
    { "label": "string", "originalPhrase": "string", "type": "skill|experience|qualification|responsibility|other" }
  ],
  "matches": [
    {
      "requirement": { "label": "string", "originalPhrase": "string", "type": "string" },
      "matched": true,
      "evidence": "string or null",
      "suggestedAngle": "string or null"
    }
  ],
  "summary": "string"
}

The "matches" array must have one entry per requirement, in the same order as "requirements".`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a career coach. Output only valid JSON. Be concise and accurate.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(raw) as {
      jobTitle?: string;
      requirements?: Array<{
        label: string;
        originalPhrase?: string;
        type: string;
      }>;
      matches?: Array<{
        requirement: { label: string; originalPhrase?: string; type: string };
        matched: boolean;
        evidence?: string;
        suggestedAngle?: string;
      }>;
      summary?: string;
    };

    const requirements: ParsedRequirement[] = (parsed.requirements || []).map(
      (r) => ({
        label: r.label,
        originalPhrase: r.originalPhrase,
        type: normalizeType(r.type),
      })
    );

    const matches: MatchResult[] = (parsed.matches || []).map((m) => ({
      requirement: {
        label: m.requirement?.label ?? '',
        originalPhrase: m.requirement?.originalPhrase,
        type: normalizeType(m.requirement?.type ?? 'other'),
      },
      matched: !!m.matched,
      evidence: m.evidence || undefined,
      suggestedAngle: m.suggestedAngle || undefined,
    }));

    return {
      jobTitle: parsed.jobTitle || undefined,
      requirements,
      matches,
      summary: parsed.summary || undefined,
    };
  } catch (err: any) {
    console.error('Job post parse/match error:', err);
    throw new Error(
      `Failed to parse and match job post: ${err.message || 'Unknown error'}`
    );
  }
}

function buildUserContext(input: JobPostMatchInput): string {
  const parts: string[] = [];
  if (input.skillsRaw?.trim()) parts.push('Skills:\n' + input.skillsRaw.trim());
  if (input.strengthsRaw?.trim())
    parts.push('Strengths:\n' + input.strengthsRaw.trim());
  if (input.specialties?.trim())
    parts.push('Specialties / responsibilities:\n' + input.specialties.trim());
  if (input.skillsSummary?.trim())
    parts.push('Skills (summary): ' + input.skillsSummary.trim());
  if (input.strengthsSummary?.trim())
    parts.push('Strengths (summary): ' + input.strengthsSummary.trim());
  if (input.specialtiesSummary?.trim())
    parts.push('Specialties (summary): ' + input.specialtiesSummary.trim());
  return parts.length ? parts.join('\n\n') : 'No profile provided.';
}

function normalizeType(
  t: string
): 'skill' | 'experience' | 'qualification' | 'responsibility' | 'other' {
  const v = (t || '').toLowerCase();
  if (['skill', 'experience', 'qualification', 'responsibility'].includes(v))
    return v as 'skill' | 'experience' | 'qualification' | 'responsibility';
  return 'other';
}
