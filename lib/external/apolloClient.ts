/**
 * Apollo API Client for Company Enrichment
 * 
 * Uses Apollo's API to search and enrich company information
 * Apollo API only requires X-Api-Key header (no Firebase auth needed)
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

