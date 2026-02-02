import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

const normalizeCompanyName = (name: string) =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

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
        const defaultOne = list.find((c) => c.is_default);
        return defaultOne || list[0];
      };

      const targetCandidates = (allCompanies || []).filter((c) =>
        normalizeCompanyName(c.name).includes('target')
      );
      const alhadafCandidates = (allCompanies || []).filter((c) =>
        normalizeCompanyName(c.name).includes('alhadaf')
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
      if (targetDbId) {
        // Update existing
        const { data, error } = await supabase
          .from('companies')
          .update({
            email: updates.email,
            phone: updates.phone,
            address: updates.address,
            website: updates.website,
          })
          .eq('id', targetDbId)
          .select()
          .single();

        if (error) throw error;
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
        
        return data as Company;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('companies')
          .insert({
            user_id: user.id,
            name: TARGET_SPECIALTIES_DISPLAY.name,
            email: updates.email || null,
            phone: updates.phone || null,
            address: updates.address || null,
            website: updates.website || null,
            is_default: false,
          })
          .select()
          .single();

        if (error) throw error;
        
        setTargetDbId(data.id);
        setTargetDetails({
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
        });
        
        toast({
          title: 'Success',
          description: 'Target Specialties created',
        });
        
        return data as Company;
      }
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
      if (alhadafDbId) {
        // Update existing
        const { data, error } = await supabase
          .from('companies')
          .update({
            email: updates.email,
            phone: updates.phone,
            address: updates.address,
            website: updates.website,
          })
          .eq('id', alhadafDbId)
          .select()
          .single();

        if (error) throw error;
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
        
        return data as Company;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('companies')
          .insert({
            user_id: user.id,
            name: ALHADAF_PROJECTS_DISPLAY.name,
            email: updates.email || null,
            phone: updates.phone || null,
            address: updates.address || null,
            website: updates.website || null,
            is_default: false,
          })
          .select()
          .single();

        if (error) throw error;
        
        setAlhadafDbId(data.id);
        setAlhadafDetails({
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
        });
        
        toast({
          title: 'Success',
          description: 'Alhadaf Projects created',
        });
        
        return data as Company;
      }
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
        // Ensure Alhadaf exists and set as default
        if (alhadafDbId) {
          await supabase
            .from('companies')
            .update({ is_default: true })
            .eq('id', alhadafDbId);
          
          setActiveCompanyIdState(alhadafDbId);
          localStorage.setItem('activeCompanyId', alhadafDbId);
        } else {
          // Create Alhadaf if it doesn't exist
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
          
          setAlhadafDbId(newCompany.id);
          setActiveCompanyIdState(newCompany.id);
          localStorage.setItem('activeCompanyId', newCompany.id);
        }
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

  const getActiveCompany = (): Company => {
    // Check if active is a UUID (Alhadaf)
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
  };

  const getTargetWithDetails = (): Company => {
    return {
      ...TARGET_SPECIALTIES_DISPLAY,
      id: targetDbId || 'target-specialties',
      ...targetDetails,
    };
  };

  const getActiveDisplayId = (): string => {
    if (activeCompanyId && activeCompanyId !== 'target-specialties') {
      return 'alhadaf-projects';
    }
    return 'target-specialties';
  };

  const getAlhadafWithDetails = (): Company => {
    return {
      ...ALHADAF_PROJECTS_DISPLAY,
      id: alhadafDbId || 'alhadaf-projects',
      ...alhadafDetails,
    };
  };

  // Get actual DB UUID for company_id filtering
  const getActiveCompanyDbId = (): string | null => {
    if (activeCompanyId && activeCompanyId !== 'target-specialties') {
      return activeCompanyId; // This is the actual UUID
    }
    return null; // Target Specialties uses null
  };

  // Compute display ID directly from state for reactivity
  const activeDisplayId = activeCompanyId && activeCompanyId !== 'target-specialties' 
    ? 'alhadaf-projects' 
    : 'target-specialties';

  return {
    targetSpecialties: getTargetWithDetails(),
    alhadafCompany: getAlhadafWithDetails(),
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
