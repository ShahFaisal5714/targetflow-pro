import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';
import { useCompanies } from '@/hooks/useCompanies';

export interface InvoiceItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  project_id: string | null;
  client_name: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  due_date: string | null;
  status: string;
  notes: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbInvoice {
  id: string;
  user_id: string;
  invoice_number: string;
  project_id: string | null;
  client_name: string;
  items: unknown;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  due_date: string | null;
  status: string;
  notes: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbToInvoice = (db: DbInvoice): Invoice => ({
  id: db.id,
  user_id: db.user_id,
  invoice_number: db.invoice_number,
  project_id: db.project_id,
  client_name: db.client_name,
  items: (db.items as InvoiceItem[]) || [],
  subtotal: db.subtotal,
  tax_rate: db.tax_rate,
  tax_amount: db.tax_amount,
  total: db.total,
  paid_amount: db.paid_amount,
  due_date: db.due_date,
  status: db.status,
  notes: db.notes,
  company_id: db.company_id,
  created_at: db.created_at,
  updated_at: db.updated_at,
});

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getActiveCompanyDbId, activeCompanyId } = useCompanies();

  const fetchInvoices = useCallback(async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const companyDbId = getActiveCompanyDbId();
      
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by company_id - null for Target Specialties, UUID for others
      if (companyDbId) {
        query = query.eq('company_id', companyDbId);
      } else {
        query = query.is('company_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      setInvoices((data || []).map(mapDbToInvoice));
    } catch (error) {
      logError('useInvoices.fetchInvoices', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, getActiveCompanyDbId]);

  const generateInvoiceNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });
    
    const nextNumber = (count || 0) + 1;
    return `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
  };

  const createInvoice = async (invoiceData: Partial<Invoice>) => {
    if (!user) return null;

    try {
      const invoiceNumber = await generateInvoiceNumber();
      const companyDbId = getActiveCompanyDbId();
      const insertData = {
        user_id: user.id,
        invoice_number: invoiceNumber,
        project_id: invoiceData.project_id || null,
        client_name: invoiceData.client_name || '',
        items: JSON.parse(JSON.stringify(invoiceData.items || [])),
        subtotal: invoiceData.subtotal || 0,
        tax_rate: invoiceData.tax_rate || 5, // Default 5% VAT
        tax_amount: invoiceData.tax_amount || 0,
        total: invoiceData.total || 0,
        paid_amount: invoiceData.paid_amount || 0,
        due_date: invoiceData.due_date || null,
        status: invoiceData.status || 'draft',
        notes: invoiceData.notes || null,
        company_id: companyDbId, // Auto-assign active company
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newInvoice = mapDbToInvoice(data);
      setInvoices((prev) => [newInvoice, ...prev]);

      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });

      return newInvoice;
    } catch (error) {
      logError('useInvoices.createInvoice', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const updateData = {
        project_id: updates.project_id,
        client_name: updates.client_name,
        items: updates.items ? JSON.parse(JSON.stringify(updates.items)) : undefined,
        subtotal: updates.subtotal,
        tax_rate: updates.tax_rate,
        tax_amount: updates.tax_amount,
        total: updates.total,
        paid_amount: updates.paid_amount,
        due_date: updates.due_date,
        status: updates.status,
        notes: updates.notes,
        company_id: updates.company_id,
      };

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedInvoice = mapDbToInvoice(data);
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? updatedInvoice : inv))
      );

      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });

      return updatedInvoice;
    } catch (error) {
      logError('useInvoices.updateInvoice', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
      return null;
    }
  };

  const recordPayment = async (id: string, amount: number) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return null;

    const newPaidAmount = invoice.paid_amount + amount;
    const newStatus = newPaidAmount >= invoice.total ? 'paid' : 'partial';

    return updateInvoice(id, { 
      paid_amount: newPaidAmount, 
      status: newStatus 
    });
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvoices((prev) => prev.filter((inv) => inv.id !== id));

      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });

      return true;
    } catch (error) {
      logError('useInvoices.deleteInvoice', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user, activeCompanyId]);

  return {
    invoices,
    loading,
    createInvoice,
    updateInvoice,
    recordPayment,
    deleteInvoice,
    refetch: fetchInvoices,
  };
}
