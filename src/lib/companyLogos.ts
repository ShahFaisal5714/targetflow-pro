import targetLogo from '@/assets/target-logo.jpg';
import alhadafLogo from '@/assets/alhadaf-logo.png';
import tswpcLogo from '@/assets/tswpc-logo.png';
import type { CompanySlug } from '@/contexts/CompaniesContext';

export { targetLogo, alhadafLogo, tswpcLogo };

export const COMPANY_LOGOS: Record<CompanySlug, string> = {
  'target-specialties': targetLogo,
  'alhadaf-projects': alhadafLogo,
  'ts-wpc-doors': tswpcLogo,
};

export const getLogoForSlug = (slug: CompanySlug): string => COMPANY_LOGOS[slug] || targetLogo;

/** Resolve a logo from a company name (used where only the company object is available). */
export const getLogoForCompanyName = (name?: string | null): string => {
  const normalized = (name || '').toLowerCase();
  if (normalized.includes('wpc')) return tswpcLogo;
  if (normalized.includes('hadaf') || normalized.includes('kabeer')) return alhadafLogo;
  return targetLogo;
};
