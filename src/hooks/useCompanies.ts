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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;

      setCompanies((data as DbCompany[]) || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [user]);

  const createCompany = async (companyData: Partial<Company>): Promise<Company | null> => {
    if (!user) return null;

    try {
      // If this is set as default, remove default from other companies
      if (companyData.is_default) {
        await supabase
          .from('companies')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('companies')
        .insert({
          user_id: user.id,
          name: companyData.name || '',
          logo_url: companyData.logo_url || null,
          email: companyData.email || null,
          phone: companyData.phone || null,
          address: companyData.address || null,
          website: companyData.website || null,
          is_default: companyData.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;

      const newCompany = data as Company;
      setCompanies(prev => [...prev, newCompany]);
      
      toast({
        title: 'Success',
        description: 'Company created successfully',
      });

      return newCompany;
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        title: 'Error',
        description: 'Failed to create company',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCompany = async (id: string, updates: Partial<Company>): Promise<Company | null> => {
    if (!user) return null;

    try {
      // If this is set as default, remove default from other companies
      if (updates.is_default) {
        await supabase
          .from('companies')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('companies')
        .update({
          name: updates.name,
          logo_url: updates.logo_url,
          email: updates.email,
          phone: updates.phone,
          address: updates.address,
          website: updates.website,
          is_default: updates.is_default,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedCompany = data as Company;
      setCompanies(prev => prev.map(c => c.id === id ? updatedCompany : c));
      
      toast({
        title: 'Success',
        description: 'Company updated successfully',
      });

      return updatedCompany;
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        title: 'Error',
        description: 'Failed to update company',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCompany = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompanies(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: 'Success',
        description: 'Company deleted successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getDefaultCompany = (): Company | undefined => {
    return companies.find(c => c.is_default) || companies[0];
  };

  return {
    companies,
    loading,
    createCompany,
    updateCompany,
    deleteCompany,
    getDefaultCompany,
    refetch: fetchCompanies,
  };
}
