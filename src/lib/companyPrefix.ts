import type { CompanySlug } from '@/contexts/CompaniesContext';

/** Document number prefixes per company. */
export const COMPANY_PREFIXES: Record<CompanySlug, string> = {
  'target-specialties': 'TS',
  'alhadaf-projects': 'AH',
  'ts-wpc-doors': 'TSW',
};

export const getCompanyPrefix = (slug: CompanySlug): string =>
  COMPANY_PREFIXES[slug] || 'TS';
