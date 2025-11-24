/**
 * NTK Parser Service
 * 
 * Extraction-only parser for NAVSEA internal communications
 * NO rewriting, summarizing, or inferring - only explicit extraction
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

import OpenAI from "openai";
import { ParsedNTKInput } from "./ntkTypes";

// Lazy initialization to prevent build-time errors
let clientInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!clientInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    clientInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return clientInstance;
}

export async function parseNTKBlob(blob: string): Promise<ParsedNTKInput> {
  if (!blob || blob.trim().length === 0) {
    throw new Error('Input text cannot be empty');
  }

  console.log('[NTK Parser] Starting extraction...', {
    textLength: blob.length,
  });

  const system = `
You are an extraction-only parser for NAVSEA internal communications.

RULES:
- DO NOT rewrite, summarize, or improve text.
- DO NOT infer missing details.
- Extract only what is explicitly stated.
- All fields not found must be null and listed in "missing".
- Extract employee intent phrases ("Employees are encouraged…", "Employees must…", etc).
- Extract calls-to-action (register, attend, volunteer, donate, submit).
- Extract urgency if implied (deadline-critical if there's a hard deadline, high if urgent language, moderate if moderate language, low if no urgency indicated).
- Extract POC fields (name, email, phone) if explicitly mentioned.
- Extract all links (URLs, email addresses).
- Extract deadlines (specific dates mentioned as deadlines).
- Return ONLY valid JSON matching the schema.
`;

  const user = `
Extract the structured fields from this text:

${blob}
`;

  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    // Parse JSON response
    let parsed: ParsedNTKInput;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('[NTK Parser] Failed to parse JSON:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    // Validate required fields exist (even if null)
    if (
      parsed.urgency === undefined ||
      parsed.deadlines === undefined ||
      parsed.links === undefined ||
      parsed.missing === undefined
    ) {
      throw new Error('OpenAI returned invalid schema - missing required fields');
    }

    // Ensure arrays are arrays
    parsed.deadlines = Array.isArray(parsed.deadlines) ? parsed.deadlines : [];
    parsed.links = Array.isArray(parsed.links) ? parsed.links : [];
    parsed.missing = Array.isArray(parsed.missing) ? parsed.missing : [];

    // Ensure urgency is valid
    const validUrgencies = ["low", "moderate", "high", "deadline-critical"];
    if (!validUrgencies.includes(parsed.urgency)) {
      parsed.urgency = "low";
    }

    console.log('[NTK Parser] SUCCESS', {
      hasTitle: !!parsed.title,
      hasDescription: !!parsed.description,
      deadlineCount: parsed.deadlines.length,
      linkCount: parsed.links.length,
      missingCount: parsed.missing.length,
    });

    return parsed;
  } catch (error: any) {
    console.error('[NTK Parser] ERROR:', {
      error: error.message,
      stack: error.stack,
    });

    // Re-throw with clear error message
    if (error.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing');
    }
    if (error.message?.includes('rate limit')) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(`NTK parsing failed: ${error.message || 'Unknown error'}`);
  }
}

