import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
const TARGET_SPECIALTIES: Company = {
  id: 'target-specialties',
  name: 'TARGET SPECIALTIES',
  logo_url: null, // Will use the imported logo
  email: 'Info@targetspecialties.com',
  phone: '+971 50 958 7185',
  address: 'Building Rema plaza | Office no. 1 Aljurf 3 Ajman UAE',
  website: 'targetspecialties.com',
  is_default: true,
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
  const [alhadafCompany, setAlhadafCompany] = useState<Company | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('target-specialties');
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    if (!user) return;
    
    try {
      // Fetch Alhadaf company from database
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('name', 'ALHADAF PROJECTS')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAlhadafCompany(data as DbCompany);
        if (data.is_default) {
          setActiveCompanyId(data.id);
        }
      }

      // Check which company is default
      const { data: defaultData } = await supabase
        .from('companies')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();

      if (defaultData) {
        setActiveCompanyId(defaultData.id);
      } else {
        setActiveCompanyId('target-specialties');
      }
    } catch (error: any) {
      console.error('Error fetching companies:', error);
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
      if (alhadafCompany) {
        // Update existing
        const { data, error } = await supabase
          .from('companies')
          .update({
            logo_url: updates.logo_url,
            email: updates.email,
            phone: updates.phone,
            address: updates.address,
            website: updates.website,
          })
          .eq('id', alhadafCompany.id)
          .select()
          .single();

        if (error) throw error;
        setAlhadafCompany(data as Company);
        
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
            name: 'ALHADAF PROJECTS',
            logo_url: updates.logo_url || null,
            email: updates.email || null,
            phone: updates.phone || null,
            address: updates.address || null,
            website: updates.website || null,
            is_default: false,
          })
          .select()
          .single();

        if (error) throw error;
        setAlhadafCompany(data as Company);
        
        toast({
          title: 'Success',
          description: 'Alhadaf Projects created',
        });
        
        return data as Company;
      }
    } catch (error: any) {
      console.error('Error updating Alhadaf company:', error);
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

      // If selecting Alhadaf, set it as default in DB
      if (companyId !== 'target-specialties' && alhadafCompany) {
        await supabase
          .from('companies')
          .update({ is_default: true })
          .eq('id', companyId);
      }

      setActiveCompanyId(companyId);
      
      toast({
        title: 'Success',
        description: `${companyId === 'target-specialties' ? 'Target Specialties' : 'Alhadaf Projects'} is now active`,
      });

      return true;
    } catch (error: any) {
      console.error('Error setting active company:', error);
      toast({
        title: 'Error',
        description: 'Failed to set active company',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getActiveCompany = (): Company => {
    if (activeCompanyId === 'target-specialties') {
      return TARGET_SPECIALTIES;
    }
    return alhadafCompany || TARGET_SPECIALTIES;
  };

  const getTargetSpecialties = (): Company => TARGET_SPECIALTIES;

  const getAlhadafProjects = (): Company | null => alhadafCompany;

  return {
    targetSpecialties: TARGET_SPECIALTIES,
    alhadafCompany,
    activeCompanyId,
    loading,
    updateAlhadafCompany,
    setActiveCompany,
    getActiveCompany,
    getTargetSpecialties,
    getAlhadafProjects,
    refetch: fetchCompanies,
  };
}
