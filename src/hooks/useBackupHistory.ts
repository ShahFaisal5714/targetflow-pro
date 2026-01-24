import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface BackupRecord {
  id: string;
  user_id: string;
  filename: string;
  format: 'sql' | 'json';
  size_bytes: number;
  tables_included: string[];
  record_count: number;
  backup_type: 'manual' | 'scheduled';
  status: 'completed' | 'failed';
  content: string | null;
  created_at: string;
  company_id: string | null;
  company_name: string | null;
}

export function useBackupHistory() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBackups = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups((data as BackupRecord[]) || []);
    } catch (error) {
      console.error('Error fetching backup history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load backup history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBackup = async (backup: Omit<BackupRecord, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('backup_history')
        .insert({
          user_id: user.id,
          filename: backup.filename,
          format: backup.format,
          size_bytes: backup.size_bytes,
          tables_included: backup.tables_included,
          record_count: backup.record_count,
          backup_type: backup.backup_type,
          status: backup.status,
          content: backup.content,
          company_id: backup.company_id,
          company_name: backup.company_name,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchBackups();
      return data as BackupRecord;
    } catch (error) {
      console.error('Error saving backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to save backup record',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteBackup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('backup_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Backup deleted successfully',
      });
      
      await fetchBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete backup',
        variant: 'destructive',
      });
    }
  };

  const downloadBackup = (backup: BackupRecord) => {
    if (!backup.content) {
      toast({
        title: 'Error',
        description: 'Backup content not available',
        variant: 'destructive',
      });
      return;
    }

    const blob = new Blob([backup.content], { 
      type: backup.format === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: `Downloaded ${backup.filename}`,
    });
  };

  useEffect(() => {
    fetchBackups();
  }, [user]);

  return {
    backups,
    loading,
    saveBackup,
    deleteBackup,
    downloadBackup,
    refreshBackups: fetchBackups,
  };
}
