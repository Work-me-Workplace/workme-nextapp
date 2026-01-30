/**
 * Test/Reference LinkedIn URLs
 * 
 * Collection of LinkedIn URLs for testing Apollo enrichment
 * and reference purposes
 */

export const TEST_LINKEDIN_URLS = {
  // Burt Canfield - Chief of Staff
  BURT_CANFIELD: 'https://www.linkedin.com/in/burtcanfield/',
} as const;

/**
 * Get all test LinkedIn URLs as an array
 */
export function getAllTestLinkedInUrls(): string[] {
  return Object.values(TEST_LINKEDIN_URLS);
}

/**
 * Get a specific LinkedIn URL by key
 */
export function getLinkedInUrl(key: keyof typeof TEST_LINKEDIN_URLS): string {
  return TEST_LINKEDIN_URLS[key];
}
