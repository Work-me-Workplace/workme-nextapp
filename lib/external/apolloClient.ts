/**
 * Apollo API Client for Company and Person Enrichment
 * 
 * Uses Apollo's API to search and enrich company/person information
 * Apollo API only requires X-Api-Key header (no Firebase auth needed)
 * 
 * For person enrichment: requires email OR linkedinUrl (not just name)
 */

const APOLLO_API_URL = 'https://api.apollo.io/api/v1';

/**
 * Get Apollo API key (lazy evaluation to avoid build-time execution)
 */
function getApolloApiKey() {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new Error('APOLLO_API_KEY environment variable is not set');
  }
  return apiKey;
}

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
    // Use Apollo's organization search endpoint
    const resp = await fetch(`${APOLLO_API_URL}/mixed_companies/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        q_keywords: companyName,
        per_page: 1,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Apollo API error: ${resp.status} - ${errorText}`);
    }

    const searchData = await resp.json();
    
    // Apollo search returns { organizations: [...] }
    const organizations = searchData.organizations || []
    if (organizations.length === 0) {
      throw new Error(`No company found matching "${companyName}"`)
    }

    const org = organizations[0]
    
    // Normalize to ApolloCompanyResponse format
    const data: ApolloCompanyResponse = {
      company: {
        id: org.id,
        name: org.name,
        description: org.description,
        estimated_num_employees: org.estimated_num_employees,
        industry: org.industry,
        website_url: org.website_url,
        domain: org.primary_domain,
        linkedin_url: org.linkedin_url,
        twitter_url: org.twitter_url,
        facebook_url: org.facebook_url,
        phone: org.phone_numbers?.[0]?.sanitized_number,
        address: org.primary_location ? {
          city: org.primary_location.city,
          state: org.primary_location.state,
          country: org.primary_location.country,
        } : undefined,
        keywords: org.keywords,
        logo_url: org.logo_url,
        employees: org.people ? org.people.map((p: any) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          name: p.name,
          title: p.title,
          seniority: p.seniority,
          department: p.department,
        })) : [],
      },
    }
    
    return data
  } catch (error: any) {
    console.error('❌ Apollo enrichCompanyApollo error:', error);
    throw error;
  }
}

/**
 * Apollo Person Response Interface
 */
export interface ApolloPersonResponse {
  person?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    title?: string;
    seniority?: string;
    department?: string;
    linkedin_url?: string;
    phone_numbers?: Array<{ raw_number?: string; sanitized_number?: string }>;
    city?: string;
    state?: string;
    country?: string;
    organization?: {
      name?: string;
      website_url?: string;
      primary_domain?: string;
      employees?: number;
      estimated_num_employees?: number;
    };
    photo_url?: string;
    employment_history?: Array<{
      started_at?: string;
      ended_at?: string | null;
      title?: string;
      organization_name?: string;
      organization?: {
        name?: string;
      };
      company_name?: string;
    }>;
  };
}

/**
 * Normalize LinkedIn URL for Apollo API
 */
function normalizeLinkedInUrl(linkedinUrl: string): string {
  let normalizedUrl = linkedinUrl.trim();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Validate LinkedIn URL
  try {
    const url = new URL(normalizedUrl);
    if (!url.hostname.includes('linkedin.com')) {
      throw new Error('Invalid LinkedIn URL');
    }
  } catch {
    throw new Error('Invalid LinkedIn URL format');
  }

  return normalizedUrl;
}

/**
 * Enrich person data using Apollo API
 * 
 * Requires email OR linkedinUrl (not just name)
 * 
 * @param options - { linkedinUrl?: string, email?: string }
 * @returns Promise<ApolloPersonResponse> - Apollo API response
 */
export async function enrichPerson(options: { linkedinUrl?: string; email?: string }): Promise<ApolloPersonResponse> {
  const { linkedinUrl, email } = options;
  const apiKey = getApolloApiKey();

  if (!linkedinUrl && !email) {
    throw new Error('Either linkedinUrl or email is required');
  }

  if (email && !email.includes('@')) {
    throw new Error('Valid email address is required');
  }

  // Prepare request body
  const requestBody: any = {};
  if (linkedinUrl) {
    requestBody.linkedin_url = normalizeLinkedInUrl(linkedinUrl);
  }
  if (email) {
    requestBody.email = email.trim().toLowerCase();
  }

  try {
    const response = await fetch(`${APOLLO_API_URL}/people/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `Apollo API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: ApolloPersonResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Apollo enrichPerson error:', error);
    throw error;
  }
}

