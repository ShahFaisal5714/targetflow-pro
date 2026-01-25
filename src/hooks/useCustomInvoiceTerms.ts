import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CustomInvoiceTerm {
  id: string;
  user_id: string;
  text: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export function useCustomInvoiceTerms() {
  const [customTerms, setCustomTerms] = useState<CustomInvoiceTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomTerms = async () => {
    if (!user) {
      setCustomTerms([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_invoice_terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomTerms(data || []);
    } catch (error: any) {
      console.error('Error fetching custom terms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomTerms();
  }, [user]);

  const createCustomTerm = async (text: string, category: string = 'general') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('custom_invoice_terms')
        .insert({
          user_id: user.id,
          text,
          category,
        })
        .select()
        .single();

      if (error) throw error;

      setCustomTerms(prev => [data, ...prev]);
      toast({
        title: 'Custom term created',
        description: 'Your custom term has been saved.',
      });
      return data;
    } catch (error: any) {
      console.error('Error creating custom term:', error);
      toast({
        title: 'Error',
        description: 'Failed to create custom term.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCustomTerm = async (id: string, text: string, category?: string) => {
    if (!user) return null;

    try {
      const updates: Partial<CustomInvoiceTerm> = { text };
      if (category) updates.category = category;

      const { data, error } = await supabase
        .from('custom_invoice_terms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomTerms(prev => prev.map(term => term.id === id ? data : term));
      toast({
        title: 'Custom term updated',
        description: 'Your custom term has been updated.',
      });
      return data;
    } catch (error: any) {
      console.error('Error updating custom term:', error);
      toast({
        title: 'Error',
        description: 'Failed to update custom term.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCustomTerm = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('custom_invoice_terms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomTerms(prev => prev.filter(term => term.id !== id));
      toast({
        title: 'Custom term deleted',
        description: 'Your custom term has been removed.',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting custom term:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete custom term.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    customTerms,
    loading,
    createCustomTerm,
    updateCustomTerm,
    deleteCustomTerm,
    refetch: fetchCustomTerms,
  };
}
