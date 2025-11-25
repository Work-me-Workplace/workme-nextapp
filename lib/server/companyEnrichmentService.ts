/**
 * Company Enrichment Service
 * 
 * Normalizes Apollo company data to Work.me Company format
 */

import { ApolloCompanyResponse } from '@/lib/external/apolloClient';

export interface EnrichedCompanyData {
  name: string;
  missionStatement?: string;
  description?: string;
  headcount?: number;
  industry?: string;
  website?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  values?: string; // CSV string
  ceoName?: string;
  ceoTitle?: string;
  deputyName?: string;
  deputyTitle?: string;
  chiefOfStaff?: string;
  directorates: string[];
  brandLogoUrl?: string;
  brandColorPrimary?: string;
  brandColorSecondary?: string;
}

/**
 * Fuzzy match title to leadership role
 */
function matchLeadershipRole(title: string | undefined): 'ceo' | 'deputy' | 'chiefOfStaff' | null {
  if (!title) return null;
  
  const lowerTitle = title.toLowerCase();
  
  // CEO / Commander
  if (
    lowerTitle.includes('commander') ||
    lowerTitle.includes('chief executive') ||
    lowerTitle.includes('ceo') ||
    lowerTitle.includes('executive director') && !lowerTitle.includes('deputy')
  ) {
    return 'ceo';
  }
  
  // Deputy / COO
  if (
    lowerTitle.includes('deputy') ||
    lowerTitle.includes('chief operating') ||
    lowerTitle.includes('coo') ||
    lowerTitle.includes('executive director') && lowerTitle.includes('deputy')
  ) {
    return 'deputy';
  }
  
  // Chief of Staff
  if (
    lowerTitle.includes('chief of staff') ||
    lowerTitle.includes('chief-of-staff')
  ) {
    return 'chiefOfStaff';
  }
  
  return null;
}

/**
 * Extract directorates from employees and employment history
 */
function extractDirectorates(
  employees?: Array<{
    department?: string;
    employment_history?: Array<{
      title?: string;
      company_name?: string;
      department?: string;
    }>;
  }>
): string[] {
  const directorates = new Set<string>();
  
  if (!employees) return [];
  
  // Pattern: SEA 02, SEA 05, etc.
  const seaPattern = /SEA\s*\d+/gi;
  
  employees.forEach((emp) => {
    // Check department
    if (emp.department) {
      const matches = emp.department.match(seaPattern);
      if (matches) {
        matches.forEach(m => directorates.add(m.toUpperCase()));
      }
    }
    
    // Check employment history
    if (emp.employment_history) {
      emp.employment_history.forEach((hist) => {
        if (hist.department) {
          const matches = hist.department.match(seaPattern);
          if (matches) {
            matches.forEach(m => directorates.add(m.toUpperCase()));
          }
        }
        if (hist.title) {
          const matches = hist.title.match(seaPattern);
          if (matches) {
            matches.forEach(m => directorates.add(m.toUpperCase()));
          }
        }
      });
    }
  });
  
  return Array.from(directorates).sort();
}

/**
 * Map Apollo company data to Work.me Company format
 */
export function mapApolloToCompany(apolloData: ApolloCompanyResponse): EnrichedCompanyData {
  const company = apolloData.company || {};
  const people = apolloData.people || [];
  
  // Combine company employees with people array
  const allEmployees = [
    ...(company.employees || []),
    ...people,
  ];
  
  // Extract leadership
  let ceoName: string | undefined;
  let ceoTitle: string | undefined;
  let deputyName: string | undefined;
  let deputyTitle: string | undefined;
  let chiefOfStaff: string | undefined;
  
  for (const emp of allEmployees) {
    const role = matchLeadershipRole(emp.title);
    const fullName = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    
    if (!fullName) continue;
    
    if (role === 'ceo' && !ceoName) {
      ceoName = fullName;
      ceoTitle = emp.title || undefined;
    } else if (role === 'deputy' && !deputyName) {
      deputyName = fullName;
      deputyTitle = emp.title || undefined;
    } else if (role === 'chiefOfStaff' && !chiefOfStaff) {
      chiefOfStaff = fullName;
    }
  }
  
  // Extract directorates
  const directorates = extractDirectorates(allEmployees);
  
  // Extract values from keywords (CSV string)
  const values = company.keywords?.length 
    ? company.keywords.join(', ')
    : undefined;
  
  // Phone number priority: primary_phone > phone
  const phone = company.primary_phone?.number || company.phone;
  
  // Website fallback: website_url > domain
  const website = company.website_url || (company.domain ? `https://${company.domain}` : undefined);
  
  return {
    name: company.name || '',
    missionStatement: company.description || undefined,
    description: company.description || undefined,
    headcount: company.estimated_num_employees || undefined,
    industry: company.industry || undefined,
    website,
    linkedinUrl: company.linkedin_url || undefined,
    twitterUrl: company.twitter_url || undefined,
    facebookUrl: company.facebook_url || undefined,
    phone,
    city: company.address?.city || undefined,
    state: company.address?.state || undefined,
    country: company.address?.country || undefined,
    values,
    ceoName,
    ceoTitle,
    deputyName,
    deputyTitle,
    chiefOfStaff,
    directorates,
    brandLogoUrl: company.logo_url || undefined,
    // Note: Apollo doesn't provide brand colors, these would need to be set manually
    brandColorPrimary: undefined,
    brandColorSecondary: undefined,
  };
}

