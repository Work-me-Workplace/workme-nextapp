/**
 * NTK Parser Types
 * 
 * MVP schema for parsed NTK input - extraction only
 */

export interface ParsedNTKInput {
  title: string | null;
  description: string | null;
  location: string | null;

  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;

  deadlines: string[];

  poc_name: string | null;
  poc_email: string | null;
  poc_phone: string | null;

  links: string[];

  intent_phrase: string | null;
  cta: string | null;

  urgency: "low" | "moderate" | "high" | "deadline-critical";

  missing: string[];
}

