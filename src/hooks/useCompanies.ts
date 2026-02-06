// This hook now uses the centralized CompaniesContext to prevent duplicate API calls
// Re-exports types and constants for backwards compatibility

import { useMemo } from 'react';
import { useCompaniesContext } from '@/contexts/CompaniesContext';

// Re-export types and constants for backwards compatibility
export type { Company, BankDetails, CompanyTax } from '@/contexts/CompaniesContext';
export { 
  TARGET_SPECIALTIES_DISPLAY, 
  ALHADAF_PROJECTS_DISPLAY,
  TARGET_SPECIALTIES,
  ALHADAF_PROJECTS,
  getActiveCompanyId,
  getActiveDisplayId 
} from '@/contexts/CompaniesContext';

export function useCompanies() {
  const context = useCompaniesContext();
  
  // Compute activeDisplayId from activeCompanyId
  const activeDisplayId = useMemo(() => {
    if (context.activeCompanyId && context.activeCompanyId !== 'target-specialties') {
      return 'alhadaf-projects';
    }
    return 'target-specialties';
  }, [context.activeCompanyId]);

  // Function to get active company object (backwards compat)
  const getActiveCompany = () => context.activeCompany;
  
  // Function to get active company DB ID for queries (null for Target, UUID for Alhadaf)
  const getActiveCompanyDbId = (): string | null => {
    if (context.activeCompanyId === 'target-specialties' || !context.activeCompanyId) {
      return null;
    }
    return context.activeCompanyId;
  };

  return {
    companies: context.companies,
    activeCompanyId: context.activeCompanyId,
    activeDisplayId,
    activeCompany: context.activeCompany,
    targetCompany: context.targetCompany,
    alhadafCompany: context.alhadafCompany,
    // Backwards compatibility aliases
    targetSpecialties: context.targetCompany,
    alhadafDbId: context.alhadafDbId,
    targetDbId: context.targetDbId,
    loading: context.loading,
    setActiveCompany: context.setActiveCompany,
    updateTargetCompany: context.updateTargetCompany,
    updateAlhadafCompany: context.updateAlhadafCompany,
    refetchCompanies: context.refetchCompanies,
    refetch: context.refetchCompanies,
    // Function accessors for backwards compatibility
    getActiveCompany,
    getActiveCompanyDbId,
  };
}
