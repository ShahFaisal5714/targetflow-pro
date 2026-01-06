import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

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
}

// Fixed company data for Target Specialties (hardcoded)
export const TARGET_SPECIALTIES: Company = {
  id: 'target-specialties',
  name: 'TARGET SPECIALTIES',
  logo_url: null, // Uses imported asset
  email: 'Info@targetspecialties.com',
  phone: '+971 50 958 7185',
  address: 'Building Rema plaza | Office no. 1 Aljurf 3 Ajman UAE',
  website: 'targetspecialties.com',
  is_default: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Fixed company data for Alhadaf Projects (hardcoded)
export const ALHADAF_PROJECTS: Company = {
  id: 'alhadaf-projects',
  name: 'AL HADAF AL KABEER METAL CONTRACTING',
  logo_url: null, // Uses imported asset
  email: null,
  phone: null,
  address: null,
  website: null,
  is_default: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

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

export function useCompanies() {
  const { user } = useAuth();
  const [alhadafDetails, setAlhadafDetails] = useState<Partial<Company>>({});
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => {
    // Try to get from localStorage for immediate display
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
      // Fetch Alhadaf company details from database (if saved)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', '%ALHADAF%')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAlhadafDetails({
          email: data.email,
          phone: data.phone,
          address: data.address,
          website: data.website,
        });
        if (data.is_default) {
          setActiveCompanyIdState('alhadaf-projects');
        }
      }

      // Check which company is default
      const { data: defaultData } = await supabase
        .from('companies')
        .select('name, is_default')
        .eq('is_default', true)
        .maybeSingle();

      if (defaultData && defaultData.name?.toLowerCase().includes('alhadaf')) {
        setActiveCompanyIdState('alhadaf-projects');
        localStorage.setItem('activeCompanyId', 'alhadaf-projects');
      } else {
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

  const updateAlhadafCompany = async (updates: Partial<Company>): Promise<Company | null> => {
    if (!user) return null;

    try {
      // Check if Alhadaf exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', '%ALHADAF%')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('companies')
          .update({
            email: updates.email,
            phone: updates.phone,
            address: updates.address,
            website: updates.website,
          })
          .eq('id', existing.id)
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
            name: ALHADAF_PROJECTS.name,
            email: updates.email || null,
            phone: updates.phone || null,
            address: updates.address || null,
            website: updates.website || null,
            is_default: false,
          })
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

  const setActiveCompany = async (companyId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // First, set all companies to non-default
      await supabase
        .from('companies')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // If selecting Alhadaf, ensure it exists and set as default
      if (companyId === 'alhadaf-projects') {
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', '%ALHADAF%')
          .maybeSingle();

        if (existing) {
          await supabase
            .from('companies')
            .update({ is_default: true })
            .eq('id', existing.id);
        } else {
          // Create Alhadaf if it doesn't exist
          await supabase
            .from('companies')
            .insert({
              user_id: user.id,
              name: ALHADAF_PROJECTS.name,
              is_default: true,
            });
        }
      }

      setActiveCompanyIdState(companyId);
      localStorage.setItem('activeCompanyId', companyId);
      
      toast({
        title: 'Success',
        description: `${companyId === 'target-specialties' ? 'Target Specialties' : 'Alhadaf Projects'} is now active`,
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
    if (activeCompanyId === 'alhadaf-projects') {
      return {
        ...ALHADAF_PROJECTS,
        ...alhadafDetails,
      };
    }
    return TARGET_SPECIALTIES;
  };

  const getAlhadafWithDetails = (): Company => {
    return {
      ...ALHADAF_PROJECTS,
      ...alhadafDetails,
    };
  };

  return {
    targetSpecialties: TARGET_SPECIALTIES,
    alhadafCompany: getAlhadafWithDetails(),
    activeCompanyId,
    loading,
    updateAlhadafCompany,
    setActiveCompany,
    getActiveCompany,
    refetch: fetchCompanies,
  };
}
