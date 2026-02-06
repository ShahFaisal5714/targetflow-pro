import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface EmailHistoryEntry {
  id: string;
  document_type: 'invoice' | 'proforma' | 'quotation';
  document_id: string;
  document_number: string;
  recipient_email: string;
  sent_at: string;
  status: 'sent' | 'failed';
  error_message: string | null;
}

export function useDocumentEmailHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistoryEntry[]>([]);

  const fetchEmailHistory = useCallback(async (documentType: string, documentId: string) => {
    if (!user) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_email_history')
        .select('*')
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      
      setEmailHistory(data as EmailHistoryEntry[] || []);
      return data as EmailHistoryEntry[] || [];
    } catch (error) {
      console.error('Error fetching email history:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordEmailSent = useCallback(async (
    documentType: 'invoice' | 'proforma' | 'quotation',
    documentId: string,
    documentNumber: string,
    recipientEmail: string,
    status: 'sent' | 'failed' = 'sent',
    errorMessage?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('document_email_history')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_id: documentId,
          document_number: documentNumber,
          recipient_email: recipientEmail,
          status,
          error_message: errorMessage || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setEmailHistory(prev => [data as EmailHistoryEntry, ...prev]);
      
      return data as EmailHistoryEntry;
    } catch (error) {
      console.error('Error recording email:', error);
      return null;
    }
  }, [user]);

  return {
    emailHistory,
    loading,
    fetchEmailHistory,
    recordEmailSent,
  };
}
