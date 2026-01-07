/**
 * Simple Blog Generator Service (MVP1)
 * 
 * Generates a 6-paragraph blog post from user inputs and company context.
 * 
 * Structure:
 * 1. What happened
 * 2. What it taught
 * 3. How it applies to workforce comms
 * 4. Additional insight/reflection
 * 5. Additional insight/reflection
 * 6. Ending on a positive note
 */

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// TYPES
// ============================================

export interface SimpleBlogInput {
  workMeId: string;
  whatHappened: string; // User input: what happened
  whatItTaught: string; // User input: what it taught
  additionalContext?: string; // Optional additional context
}

export interface SimpleBlogOutput {
  paragraphs: string[]; // 6 paragraphs
  fullText: string; // Combined full blog text
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Generate a 6-paragraph blog post
 */
export async function generateSimpleBlog(
  input: SimpleBlogInput
): Promise<SimpleBlogOutput> {
  // 1. Get company context
  const companyContext = await getCompanyContext(input.workMeId);

  // 2. Build AI prompt
  const prompt = buildPrompt(input, companyContext);

  // 3. Generate blog using AI
  const blogContent = await generateBlogWithAI(prompt);

  // 4. Parse and structure output
  return parseBlogOutput(blogContent);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get company context for the user
 */
async function getCompanyContext(workMeId: string) {
  const workMe = await prisma.workMe.findUnique({
    where: { id: workMeId },
    include: {
      Company: {
        select: {
          id: true,
          name: true,
          industry: true,
          description: true,
          headcount: true,
        },
      },
    },
  });

  if (!workMe) {
    throw new Error(`WorkMe not found: ${workMeId}`);
  }

  return {
    companyName: workMe.Company?.name || null,
    industry: workMe.Company?.industry || null,
    companyDescription: workMe.Company?.description || null,
    headcount: workMe.Company?.headcount || null,
    userTitle: workMe.title || null,
  };
}

/**
 * Build AI prompt for blog generation
 */
function buildPrompt(input: SimpleBlogInput, companyContext: any): string {
  const { whatHappened, whatItTaught, additionalContext } = input;
  const { companyName, industry, companyDescription, headcount, userTitle } = companyContext;

  let prompt = `Generate a professional, reflection-based blog post in exactly 6 paragraphs.

USER INPUTS:
- What Happened: ${whatHappened}
- What It Taught: ${whatItTaught}
${additionalContext ? `- Additional Context: ${additionalContext}` : ''}

COMPANY CONTEXT:
${companyName ? `- Company: ${companyName}` : ''}
${industry ? `- Industry: ${industry}` : ''}
${companyDescription ? `- Description: ${companyDescription}` : ''}
${headcount ? `- Headcount: ${headcount}` : ''}
${userTitle ? `- User Title: ${userTitle}` : ''}

REQUIREMENTS:
1. Write exactly 6 paragraphs
2. Each paragraph should be 3-5 sentences
3. Professional, reflective tone (not tips/listicles)
4. Use the user's inputs as the foundation
5. Connect to workforce communications context
6. End on a positive, forward-looking note

PARAGRAPH STRUCTURE:
1. Paragraph 1: What happened (set the scene, describe the situation)
2. Paragraph 2: What it taught (lessons learned, insights gained)
3. Paragraph 3: How it applies to workforce communications (connect to employee messaging, internal comms, organizational communication)
4. Paragraph 4: Additional reflection or insight (deeper learning, broader implications)
5. Paragraph 5: Additional reflection or insight (practical application, real-world relevance)
6. Paragraph 6: Positive conclusion (forward-looking, optimistic, actionable next steps)

STYLE:
- Experiential and reflective (not instructional)
- Professional but personal
- Grounded in real experience
- Connects to workforce communications naturally
- Ends on an uplifting, positive note

Return the blog as a JSON object with this exact structure:
{
  "paragraphs": [
    "First paragraph text here...",
    "Second paragraph text here...",
    "Third paragraph text here...",
    "Fourth paragraph text here...",
    "Fifth paragraph text here...",
    "Sixth paragraph text here..."
  ]
}`;

  return prompt;
}

/**
 * Generate blog using OpenAI
 */
async function generateBlogWithAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for blog generation');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional blog writer specializing in workforce communications and organizational development. You write reflective, experiential content that demonstrates value through real experiences.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return response;
  } catch (error: any) {
    console.error('❌ AI blog generation error:', error);
    throw new Error(`Failed to generate blog: ${error.message}`);
  }
}

/**
 * Parse AI output into structured format
 */
function parseBlogOutput(aiResponse: string): SimpleBlogOutput {
  try {
    const parsed = JSON.parse(aiResponse);
    const paragraphs = parsed.paragraphs || [];

    if (!Array.isArray(paragraphs) || paragraphs.length !== 6) {
      throw new Error(`Expected 6 paragraphs, got ${paragraphs.length}`);
    }

    // Validate all paragraphs are strings
    paragraphs.forEach((para: any, index: number) => {
      if (typeof para !== 'string' || para.trim().length === 0) {
        throw new Error(`Paragraph ${index + 1} is invalid`);
      }
    });

    // Combine into full text
    const fullText = paragraphs.join('\n\n');

    return {
      paragraphs,
      fullText,
    };
  } catch (error: any) {
    console.error('❌ Blog parsing error:', error);
    throw new Error(`Failed to parse blog output: ${error.message}`);
  }
}

