// This hook now uses the centralized CompaniesContext to prevent duplicate API calls
// Re-exports types and constants for backwards compatibility

import { useCompaniesContext } from '@/contexts/CompaniesContext';

// Re-export types and constants for backwards compatibility
export type { Company, BankDetails, CompanyTax, CompanySlug, CompanyOffice } from '@/contexts/CompaniesContext';
export {
  TARGET_SPECIALTIES_DISPLAY,
  ALHADAF_PROJECTS_DISPLAY,
  TS_WPC_DOORS_DISPLAY,
  TARGET_SPECIALTIES,
  ALHADAF_PROJECTS,
  TS_WPC_DOORS,
  getActiveCompanyId,
  getActiveDisplayId,
} from '@/contexts/CompaniesContext';

export function useCompanies() {
  const context = useCompaniesContext();

  // Function to get active company object (backwards compat)
  const getActiveCompany = () => context.activeCompany;

  // Function to get active company DB ID for queries (null for Target, UUID for others)
  const getActiveCompanyDbId = (): string | null => {
    if (context.activeDisplayId === 'target-specialties' || !context.activeCompanyId) {
      return null;
    }
    return context.activeCompanyId;
  };

  return {
    companies: context.companies,
    activeCompanyId: context.activeCompanyId,
    activeDisplayId: context.activeDisplayId,
    activeCompany: context.activeCompany,
    targetCompany: context.targetCompany,
    alhadafCompany: context.alhadafCompany,
    tswpcCompany: context.tswpcCompany,
    // Backwards compatibility aliases
    targetSpecialties: context.targetCompany,
    alhadafDbId: context.alhadafDbId,
    targetDbId: context.targetDbId,
    tswpcDbId: context.tswpcDbId,
    loading: context.loading,
    setActiveCompany: context.setActiveCompany,
    updateTargetCompany: context.updateTargetCompany,
    updateAlhadafCompany: context.updateAlhadafCompany,
    updateTswpcCompany: context.updateTswpcCompany,
    getCompanyById: context.getCompanyById,
    getSlugForId: context.getSlugForId,
    refetchCompanies: context.refetchCompanies,
    refetch: context.refetchCompanies,
    // Function accessors for backwards compatibility
    getActiveCompany,
    getActiveCompanyDbId,
  };
}
