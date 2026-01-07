import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

// Get active company ID from localStorage
const getActiveCompanyId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('activeCompanyId') || 'target-specialties';
  }
  return 'target-specialties';
};
export interface QuotationItem {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  margin: number;
  total: number;
  color?: string;
}

export interface Quotation {
  id: string;
  user_id: string;
  project_id: string;
  project_name: string;
  items: QuotationItem[];
  subtotal: number;
  discount: { type: 'percentage' | 'flat'; value: number };
  tax: { type: string; rate: number };
  total: number;
  valid_until: string;
  status: string;
  version: number;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbQuotation {
  id: string;
  user_id: string;
  project_id: string | null;
  project_name: string;
  items: unknown;
  subtotal: number;
  discount: unknown;
  tax: unknown;
  total: number;
  valid_until: string | null;
  status: string;
  version: number;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbToQuotation = (db: DbQuotation): Quotation => ({
  id: db.id,
  user_id: db.user_id,
  project_id: db.project_id || '',
  project_name: db.project_name,
  items: (db.items as QuotationItem[]) || [],
  subtotal: db.subtotal,
  discount: (db.discount as { type: 'percentage' | 'flat'; value: number }) || { type: 'percentage', value: 0 },
  tax: (db.tax as { type: string; rate: number }) || { type: 'VAT', rate: 5 },
  total: db.total,
  valid_until: db.valid_until || '',
  status: db.status,
  version: db.version,
  company_id: db.company_id,
  created_at: db.created_at,
  updated_at: db.updated_at,
});

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchQuotations = useCallback(async () => {
    if (!user) {
      setQuotations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const activeCompanyId = getActiveCompanyId();
      
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('company_id', activeCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuotations((data || []).map(mapDbToQuotation));
    } catch (error) {
      logError('useQuotations.fetchQuotations', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch quotations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createQuotation = async (quotationData: Partial<Quotation>) => {
    if (!user) return null;

    try {
      const insertData = {
        user_id: user.id,
        project_id: quotationData.project_id || null,
        project_name: quotationData.project_name || '',
        items: JSON.parse(JSON.stringify(quotationData.items || [])),
        subtotal: quotationData.subtotal || 0,
        discount: JSON.parse(JSON.stringify(quotationData.discount || { type: 'percentage', value: 0 })),
        tax: JSON.parse(JSON.stringify(quotationData.tax || { type: 'VAT', rate: 5 })),
        total: quotationData.total || 0,
        valid_until: quotationData.valid_until || null,
        status: quotationData.status || 'draft',
        company_id: getActiveCompanyId(), // Auto-assign active company
        version: 1,
      };

      const { data, error } = await supabase
        .from('quotations')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newQuotation = mapDbToQuotation(data);
      setQuotations((prev) => [newQuotation, ...prev]);

      toast({
        title: 'Success',
        description: 'Quotation created successfully',
      });

      return newQuotation;
    } catch (error) {
      logError('useQuotations.createQuotation', error);
      toast({
        title: 'Error',
        description: 'Failed to create quotation',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    try {
      const updateData = {
        project_id: updates.project_id,
        project_name: updates.project_name,
        items: updates.items ? JSON.parse(JSON.stringify(updates.items)) : undefined,
        subtotal: updates.subtotal,
        discount: updates.discount ? JSON.parse(JSON.stringify(updates.discount)) : undefined,
        tax: updates.tax ? JSON.parse(JSON.stringify(updates.tax)) : undefined,
        total: updates.total,
        valid_until: updates.valid_until,
        status: updates.status,
        company_id: updates.company_id,
      };

      const { data, error } = await supabase
        .from('quotations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedQuotation = mapDbToQuotation(data);
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? updatedQuotation : q))
      );

      toast({
        title: 'Success',
        description: 'Quotation updated successfully',
      });

      return updatedQuotation;
    } catch (error) {
      logError('useQuotations.updateQuotation', error);
      toast({
        title: 'Error',
        description: 'Failed to update quotation',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteQuotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuotations((prev) => prev.filter((q) => q.id !== id));

      toast({
        title: 'Success',
        description: 'Quotation deleted successfully',
      });

      return true;
    } catch (error) {
      logError('useQuotations.deleteQuotation', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quotation',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [user]);

  return {
    quotations,
    loading,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    refetch: fetchQuotations,
  };
}
