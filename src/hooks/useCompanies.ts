import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

const normalizeCompanyName = (name: string) =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const isTargetSpecialtiesName = (name: string) => {
  const normalized = normalizeCompanyName(name);
  return normalized.includes('target') || normalized.includes('specialties');
};

const isAlhadafName = (name: string) => {
  const normalized = normalizeCompanyName(name);
  return normalized.includes('alhadaf') || normalized.includes('hadaf') || normalized.includes('kabeer');
};

export interface BankDetails {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  currency?: string;
  branch?: string;
}

export interface CompanyTax {
  trn: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  bankDetails?: BankDetails;
  taxInfo?: CompanyTax;
}

// Fixed company data for Target Specialties (hardcoded for display)
export const TARGET_SPECIALTIES_DISPLAY: Company = {
  id: 'target-specialties',
  name: 'TARGET SPECIALTIES',
  logo_url: null,
  email: 'Info@targetspecialties.com',
  phone: '+971 50 958 7185',
  address: 'Building Rema plaza | Office no. 1 Aljurf 3 Ajman UAE',
  website: 'targetspecialties.com',
  is_default: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  bankDetails: {
    bankName: 'Abu Dhabi Commercial Bank PJSC',
    accountTitle: 'TARGET SPECIALTIES BUILDING MATERIAL TRADING SPS LLC',
    accountNumber: '14405625820001',
    iban: 'AE270030014405625820001',
    swiftCode: 'ADCBAEAA',
    currency: 'AED',
    branch: 'IBD-AJMAN BRANCH',
  },
  taxInfo: {
    trn: '104732260500003',
  },
};

// Fixed company data for Alhadaf Projects (hardcoded for display)
export const ALHADAF_PROJECTS_DISPLAY: Company = {
  id: 'alhadaf-projects',
  name: 'AL HADAF AL KABEER METAL CONTRACTING',
  logo_url: null,
  email: null,
  phone: '+971 50 230 7822',
  address: '07, Saih Shuaib 2, Dubai Industrial City, Dubai, United Arab Emirates',
  website: null,
  is_default: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  bankDetails: {
    bankName: 'ADCB Bank',
    accountTitle: 'Al Hadaf Al Kabeer Metal Contracting',
    accountNumber: '11913588820001',
    iban: 'AE42 0030 0119 1358 8820 001',
    swiftCode: 'ADCBAEAA060',
    currency: 'AED',
  },
  taxInfo: {
    trn: '100529145300003',
  },
};

// For backwards compatibility
export const TARGET_SPECIALTIES = TARGET_SPECIALTIES_DISPLAY;
export const ALHADAF_PROJECTS = ALHADAF_PROJECTS_DISPLAY;

interface DbCompany {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to get active company ID (UUID or null)
export const getActiveCompanyId = (): string | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('activeCompanyId');
    // Return null if it's a legacy string ID or empty
    if (stored === 'target-specialties' || !stored) {
      return null; // null means Target Specialties (no company_id in DB)
    }
    // Return the actual UUID for Alhadaf or other companies
    return stored;
  }
  return null;
};

// Helper to get display ID for UI purposes
export const getActiveDisplayId = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('activeCompanyId');
    if (stored && stored !== 'target-specialties') {
      return 'alhadaf-projects';
    }
  }
  return 'target-specialties';
};

export function useCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<DbCompany[]>([]);
  const [alhadafDetails, setAlhadafDetails] = useState<Partial<Company>>({});
  const [alhadafDbId, setAlhadafDbId] = useState<string | null>(null);
  const [targetDbId, setTargetDbId] = useState<string | null>(null);
  const [targetDetails, setTargetDetails] = useState<Partial<Company>>({});
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeCompanyId') || 'target-specialties';
    }
    return 'target-specialties';
  });
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch all companies for this user
      const { data: allCompanies, error: allError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (allError) throw allError;
      
      setCompanies(allCompanies || []);

       const pickBest = (list: DbCompany[]) => {
         // Prefer default, then prefer records that actually have details,
         // otherwise fall back to the most recently returned one.
         const score = (c: DbCompany) => {
           const hasDetails = Boolean(c.email || c.phone || c.address || c.website);
           return (c.is_default ? 10 : 0) + (hasDetails ? 5 : 0);
         };

         return [...list].sort((a, b) => score(b) - score(a))[0];
       };

      const targetCandidates = (allCompanies || []).filter((c) =>
        isTargetSpecialtiesName(c.name)
      );
      const alhadafCandidates = (allCompanies || []).filter((c) =>
        isAlhadafName(c.name)
      );

      // Find Target Specialties company
      const target = targetCandidates.length ? pickBest(targetCandidates) : undefined;
      if (target) {
        setTargetDbId(target.id);
        setTargetDetails({
          email: target.email,
          phone: target.phone,
          address: target.address,
          website: target.website,
        });
      }

      // Find Alhadaf company
      const alhadaf = alhadafCandidates.length ? pickBest(alhadafCandidates) : undefined;
      
      if (alhadaf) {
        setAlhadafDbId(alhadaf.id);
        setAlhadafDetails({
          email: alhadaf.email,
          phone: alhadaf.phone,
          address: alhadaf.address,
          website: alhadaf.website,
        });
        
        if (alhadaf.is_default) {
          setActiveCompanyIdState(alhadaf.id);
          localStorage.setItem('activeCompanyId', alhadaf.id);
        }
      }

      // Check which company is default
      const defaultCompany = allCompanies?.find(c => c.is_default);
      if (defaultCompany) {
        setActiveCompanyIdState(defaultCompany.id);
        localStorage.setItem('activeCompanyId', defaultCompany.id);
      } else {
        // No default set, use Target Specialties (null company_id)
        setActiveCompanyIdState('target-specialties');
        localStorage.setItem('activeCompanyId', 'target-specialties');
      }
    } catch (error) {
      logError('useCompanies.fetchCompanies', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [user]);

  const updateTargetCompany = async (updates: Partial<Company>): Promise<Company | null> => {
    if (!user) return null;

    try {
      const payload = {
        email: updates.email ?? null,
        phone: updates.phone ?? null,
        address: updates.address ?? null,
        website: updates.website ?? null,
      };

      // Update ALL matching "Target" rows (prevents duplicates causing "not saved" UI)
      const { data: updatedRows, error: updateError } = await supabase
        .from('companies')
        .update(payload)
        .eq('user_id', user.id)
        .eq('name', TARGET_SPECIALTIES_DISPLAY.name)
        .select();

      if (updateError) throw updateError;

      if (updatedRows && updatedRows.length > 0) {
        const data = updatedRows[0] as unknown as DbCompany;
        setTargetDbId(data.id);
        setTargetDetails({
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
        });

        toast({
          title: 'Success',
          description: 'Target Specialties details updated',
        });

        return data as unknown as Company;
      }

      // No existing Target row found → create one
      const { data: created, error: insertError } = await supabase
        .from('companies')
        .insert({
          user_id: user.id,
          name: TARGET_SPECIALTIES_DISPLAY.name,
          ...payload,
          is_default: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setTargetDbId(created.id);
      setTargetDetails({
        email: created.email,
        phone: created.phone,
        address: created.address,
        website: created.website,
      });

      toast({
        title: 'Success',
        description: 'Target Specialties details updated',
      });

      return created as Company;
    } catch (error) {
      logError('useCompanies.updateTargetCompany', error);
      toast({
        title: 'Error',
        description: 'Failed to update company',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateAlhadafCompany = async (updates: Partial<Company>): Promise<Company | null> => {
    if (!user) return null;

    try {
      const payload = {
        email: updates.email ?? null,
        phone: updates.phone ?? null,
        address: updates.address ?? null,
        website: updates.website ?? null,
      };

      // Update ALL matching "Alhadaf" rows (prevents duplicates causing "not saved" UI)
      const { data: updatedRows, error: updateError } = await supabase
        .from('companies')
        .update(payload)
        .eq('user_id', user.id)
        .eq('name', ALHADAF_PROJECTS_DISPLAY.name)
        .select();

      if (updateError) throw updateError;

      if (updatedRows && updatedRows.length > 0) {
        const data = updatedRows[0] as unknown as DbCompany;
        setAlhadafDbId(data.id);
        setAlhadafDetails({
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
        });

        toast({
          title: 'Success',
          description: 'Alhadaf Projects details updated',
        });

        return data as unknown as Company;
      }

      // No existing Alhadaf row found → create one
      const { data: created, error: insertError } = await supabase
        .from('companies')
        .insert({
          user_id: user.id,
          name: ALHADAF_PROJECTS_DISPLAY.name,
          ...payload,
          is_default: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAlhadafDbId(created.id);
      setAlhadafDetails({
        email: created.email,
        phone: created.phone,
        address: created.address,
        website: created.website,
      });

      toast({
        title: 'Success',
        description: 'Alhadaf Projects details updated',
      });

      return created as Company;
    } catch (error) {
      logError('useCompanies.updateAlhadafCompany', error);
      toast({
        title: 'Error',
        description: 'Failed to update company',
        variant: 'destructive',
      });
      return null;
    }
  };

  const setActiveCompany = async (displayId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // First, set all companies to non-default
      await supabase
        .from('companies')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (displayId === 'alhadaf-projects') {
        // Ensure Alhadaf exists and set as default (avoid creating duplicates)
        let companyIdToActivate = alhadafDbId;

        if (!companyIdToActivate) {
          const { data: existing, error: findError } = await supabase
            .from('companies')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', ALHADAF_PROJECTS_DISPLAY.name)
            .limit(1);

          if (findError) throw findError;
          companyIdToActivate = existing?.[0]?.id ?? null;
        }

        if (!companyIdToActivate) {
          const { data: newCompany, error } = await supabase
            .from('companies')
            .insert({
              user_id: user.id,
              name: ALHADAF_PROJECTS_DISPLAY.name,
              is_default: true,
            })
            .select()
            .single();

          if (error) throw error;
          companyIdToActivate = newCompany.id;
        } else {
          await supabase
            .from('companies')
            .update({ is_default: true })
            .eq('id', companyIdToActivate);
        }

        setAlhadafDbId(companyIdToActivate);
        setActiveCompanyIdState(companyIdToActivate);
        localStorage.setItem('activeCompanyId', companyIdToActivate);
      } else {
        // Target Specialties - no company in DB, just reset
        setActiveCompanyIdState('target-specialties');
        localStorage.setItem('activeCompanyId', 'target-specialties');
      }
      
      toast({
        title: 'Success',
        description: `${displayId === 'target-specialties' ? 'Target Specialties' : 'Alhadaf Projects'} is now active`,
      });

      return true;
    } catch (error) {
      logError('useCompanies.setActiveCompany', error);
      toast({
        title: 'Error',
        description: 'Failed to set active company',
        variant: 'destructive',
      });
      return false;
    }
  };

  const targetWithDetails = useMemo<Company>(() => {
    return {
      ...TARGET_SPECIALTIES_DISPLAY,
      id: targetDbId || 'target-specialties',
      ...targetDetails,
    };
  }, [targetDbId, targetDetails]);

  const alhadafWithDetails = useMemo<Company>(() => {
    return {
      ...ALHADAF_PROJECTS_DISPLAY,
      id: alhadafDbId || 'alhadaf-projects',
      ...alhadafDetails,
    };
  }, [alhadafDbId, alhadafDetails]);

  const activeCompany = useMemo<Company>(() => {
    if (activeCompanyId && activeCompanyId !== 'target-specialties') {
      return {
        ...ALHADAF_PROJECTS_DISPLAY,
        id: activeCompanyId,
        ...alhadafDetails,
      };
    }
    return {
      ...TARGET_SPECIALTIES_DISPLAY,
      ...targetDetails,
    };
  }, [activeCompanyId, alhadafDetails, targetDetails]);

  const getActiveCompany = useCallback((): Company => activeCompany, [activeCompany]);
  const getTargetWithDetails = useCallback((): Company => targetWithDetails, [targetWithDetails]);
  const getAlhadafWithDetails = useCallback((): Company => alhadafWithDetails, [alhadafWithDetails]);

  const getActiveDisplayId = useCallback((): string => {
    if (activeCompanyId && activeCompanyId !== 'target-specialties') return 'alhadaf-projects';
    return 'target-specialties';
  }, [activeCompanyId]);

  // Get actual DB UUID for company_id filtering
  const getActiveCompanyDbId = useCallback((): string | null => {
    if (activeCompanyId && activeCompanyId !== 'target-specialties') return activeCompanyId;
    return null;
  }, [activeCompanyId]);

  // Compute display ID directly from state for reactivity
  const activeDisplayId = activeCompanyId && activeCompanyId !== 'target-specialties' 
    ? 'alhadaf-projects' 
    : 'target-specialties';

  return {
    targetSpecialties: targetWithDetails,
    alhadafCompany: alhadafWithDetails,
    alhadafDbId,
    targetDbId,
    activeCompanyId,
    activeDisplayId,
    loading,
    updateTargetCompany,
    updateAlhadafCompany,
    setActiveCompany,
    getActiveCompany,
    getActiveDisplayId,
    getActiveCompanyDbId,
    refetch: fetchCompanies,
  };
}
