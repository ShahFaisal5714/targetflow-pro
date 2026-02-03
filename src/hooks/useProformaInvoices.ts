import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';
import { useCompanies } from '@/hooks/useCompanies';

export interface ProformaInvoiceItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ProformaInvoice {
  id: string;
  user_id: string;
  proforma_number: string;
  quotation_id: string | null;
  project_id: string | null;
  client_name: string;
  items: ProformaInvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  valid_until: string | null;
  status: string;
  notes: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbProformaInvoice {
  id: string;
  user_id: string;
  proforma_number: string;
  quotation_id: string | null;
  project_id: string | null;
  client_name: string;
  items: unknown;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  valid_until: string | null;
  status: string;
  notes: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbToProformaInvoice = (db: DbProformaInvoice): ProformaInvoice => ({
  id: db.id,
  user_id: db.user_id,
  proforma_number: db.proforma_number,
  quotation_id: db.quotation_id,
  project_id: db.project_id,
  client_name: db.client_name,
  items: (db.items as ProformaInvoiceItem[]) || [],
  subtotal: db.subtotal,
  tax_rate: db.tax_rate,
  tax_amount: db.tax_amount,
  total: db.total,
  valid_until: db.valid_until,
  status: db.status,
  notes: db.notes,
  company_id: db.company_id,
  created_at: db.created_at,
  updated_at: db.updated_at,
});

export function useProformaInvoices() {
  const [proformaInvoices, setProformaInvoices] = useState<ProformaInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getActiveCompanyDbId, activeCompanyId } = useCompanies();

  const fetchProformaInvoices = useCallback(async () => {
    if (!user) {
      setProformaInvoices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const companyDbId = getActiveCompanyDbId();
      
      let query = supabase
        .from('proforma_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyDbId) {
        query = query.eq('company_id', companyDbId);
      } else {
        query = query.is('company_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProformaInvoices((data || []).map((d) => mapDbToProformaInvoice(d as DbProformaInvoice)));
    } catch (error) {
      logError('useProformaInvoices.fetchProformaInvoices', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch proforma invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, getActiveCompanyDbId]);

  const generateProformaNumber = async (): Promise<string> => {
    const companyDbId = getActiveCompanyDbId();
    const year = new Date().getFullYear();
    
    const companyPrefix = companyDbId ? 'AH' : 'TS';
    
    let countQuery = supabase
      .from('proforma_invoices')
      .select('*', { count: 'exact', head: true });
    
    if (companyDbId) {
      countQuery = countQuery.eq('company_id', companyDbId);
    } else {
      countQuery = countQuery.is('company_id', null);
    }
    
    const { count } = await countQuery;
    const nextNumber = (count || 0) + 1;
    return `${companyPrefix}-PI-${year}-${String(nextNumber).padStart(4, '0')}`;
  };

  const createProformaInvoice = async (proformaData: Partial<ProformaInvoice>) => {
    if (!user) return null;

    try {
      const proformaNumber = await generateProformaNumber();
      const companyDbId = getActiveCompanyDbId();
      const insertData = {
        user_id: user.id,
        proforma_number: proformaNumber,
        quotation_id: proformaData.quotation_id || null,
        project_id: proformaData.project_id || null,
        client_name: proformaData.client_name || '',
        items: JSON.parse(JSON.stringify(proformaData.items || [])),
        subtotal: proformaData.subtotal || 0,
        tax_rate: proformaData.tax_rate || 5,
        tax_amount: proformaData.tax_amount || 0,
        total: proformaData.total || 0,
        valid_until: proformaData.valid_until || null,
        status: proformaData.status || 'draft',
        notes: proformaData.notes || null,
        company_id: companyDbId,
      };

      const { data, error } = await supabase
        .from('proforma_invoices')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newProformaInvoice = mapDbToProformaInvoice(data as DbProformaInvoice);
      setProformaInvoices((prev) => [newProformaInvoice, ...prev]);

      toast({
        title: 'Success',
        description: 'Proforma invoice created successfully',
      });

      return newProformaInvoice;
    } catch (error) {
      logError('useProformaInvoices.createProformaInvoice', error);
      toast({
        title: 'Error',
        description: 'Failed to create proforma invoice',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProformaInvoice = async (id: string, updates: Partial<ProformaInvoice>) => {
    try {
      const updateData = {
        project_id: updates.project_id,
        client_name: updates.client_name,
        items: updates.items ? JSON.parse(JSON.stringify(updates.items)) : undefined,
        subtotal: updates.subtotal,
        tax_rate: updates.tax_rate,
        tax_amount: updates.tax_amount,
        total: updates.total,
        valid_until: updates.valid_until,
        status: updates.status,
        notes: updates.notes,
        company_id: updates.company_id,
      };

      const { data, error } = await supabase
        .from('proforma_invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProformaInvoice = mapDbToProformaInvoice(data as DbProformaInvoice);
      setProformaInvoices((prev) =>
        prev.map((pi) => (pi.id === id ? updatedProformaInvoice : pi))
      );

      toast({
        title: 'Success',
        description: 'Proforma invoice updated successfully',
      });

      return updatedProformaInvoice;
    } catch (error) {
      logError('useProformaInvoices.updateProformaInvoice', error);
      toast({
        title: 'Error',
        description: 'Failed to update proforma invoice',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteProformaInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('proforma_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProformaInvoices((prev) => prev.filter((pi) => pi.id !== id));

      toast({
        title: 'Success',
        description: 'Proforma invoice deleted successfully',
      });

      return true;
    } catch (error) {
      logError('useProformaInvoices.deleteProformaInvoice', error);
      toast({
        title: 'Error',
        description: 'Failed to delete proforma invoice',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProformaInvoices();
  }, [user, activeCompanyId]);

  return {
    proformaInvoices,
    loading,
    createProformaInvoice,
    updateProformaInvoice,
    deleteProformaInvoice,
    refetch: fetchProformaInvoices,
  };
}
