import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies } from '@/hooks/useCompanies';
import { logError } from '@/lib/logger';

export interface Customer {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  trn: string | null;
  notes: string | null;
  payment_terms: string | null;
  credit_limit: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  trn?: string | null;
  notes?: string | null;
  payment_terms?: string | null;
  credit_limit?: number;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { getActiveCompanyDbId, activeCompanyId } = useCompanies();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const companyDbId = getActiveCompanyDbId();

      let query = supabase.from('customers').select('*').order('name', { ascending: true });

      if (companyDbId) {
        query = query.eq('company_id', companyDbId);
      } else {
        query = query.is('company_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCustomers((data || []) as Customer[]);
    } catch (error: any) {
      logError('Error fetching customers', error);
      toast({
        title: 'Error fetching customers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, getActiveCompanyDbId]);

  const createCustomer = async (input: CustomerInput) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          company_id: getActiveCompanyDbId(),
          credit_limit: 0,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchCustomers();
      toast({ title: 'Customer added', description: `${input.name} has been saved.` });
      return data as Customer;
    } catch (error: any) {
      logError('Error creating customer', error);
      toast({ title: 'Error creating customer', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateCustomer = async (id: string, input: CustomerInput) => {
    try {
      const { error } = await supabase.from('customers').update(input).eq('id', id);
      if (error) throw error;
      await fetchCustomers();
      toast({ title: 'Customer updated', description: `${input.name} has been updated.` });
      return true;
    } catch (error: any) {
      logError('Error updating customer', error);
      toast({ title: 'Error updating customer', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      await fetchCustomers();
      return true;
    } catch (error: any) {
      logError('Error deleting customer', error);
      toast({ title: 'Error deleting customer', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  /**
   * Auto-save a customer captured from a document (quotation / invoice / project).
   * Silently skips when the customer already exists for the active company.
   */
  const captureCustomer = async (input: CustomerInput) => {
    if (!user) return null;
    const name = (input.name || '').trim();
    if (!name || name.toLowerCase() === 'unknown client') return null;

    const companyDbId = getActiveCompanyDbId();

    try {
      let existingQuery = supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', name);

      if (companyDbId) {
        existingQuery = existingQuery.eq('company_id', companyDbId);
      } else {
        existingQuery = existingQuery.is('company_id', null);
      }

      const { data: existing } = await existingQuery.maybeSingle();
      if (existing) return null;

      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          company_id: companyDbId,
          credit_limit: 0,
          ...input,
          name,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchCustomers();
      return data as Customer;
    } catch (error: any) {
      logError('Error auto-saving customer', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) fetchCustomers();
  }, [user, activeCompanyId, fetchCustomers]);

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    captureCustomer,
    refetch: fetchCustomers,
  };
}
