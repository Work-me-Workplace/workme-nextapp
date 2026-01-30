/**
 * Apollo API Client for Company Enrichment
 * 
 * Uses Apollo's mixed_data/company endpoint to enrich company information
 */

const APOLLO_API_URL = 'https://api.apollo.io/api/v1';

export interface ApolloCompanyResponse {
  company?: {
    id?: string;
    name?: string;
    description?: string;
    estimated_num_employees?: number;
    industry?: string;
    website_url?: string;
    domain?: string;
    linkedin_url?: string;
    twitter_url?: string;
    facebook_url?: string;
    phone?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
    keywords?: string[];
    employees?: Array<{
      id?: string;
      first_name?: string;
      last_name?: string;
      name?: string;
      title?: string;
      seniority?: string;
      department?: string;
      employment_history?: Array<{
        title?: string;
        company_name?: string;
        department?: string;
      }>;
    }>;
    logo_url?: string;
    primary_phone?: {
      number?: string;
    };
  };
  people?: Array<{
    id?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    title?: string;
    seniority?: string;
    department?: string;
    employment_history?: Array<{
      title?: string;
      company_name?: string;
      department?: string;
    }>;
  }>;
}

/**
 * Enrich company data using Apollo API
 * 
 * @param companyName - The name of the company to enrich
 * @returns Promise<ApolloCompanyResponse> - Apollo API response
 */
export async function enrichCompanyApollo(companyName: string): Promise<ApolloCompanyResponse> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    throw new Error('APOLLO_API_KEY environment variable is not set');
  }

  try {
    const resp = await fetch(`${APOLLO_API_URL}/mixed_data/company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        name: companyName,
        enrich_people: true,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Apollo enrichment failed: ${resp.status} - ${errorText}`);
    }

    const data: ApolloCompanyResponse = await resp.json();
    return data;
  } catch (error: any) {
    console.error('❌ Apollo enrichCompanyApollo error:', error);
    throw error;
  }
}

