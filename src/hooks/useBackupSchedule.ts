import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';

export interface BackupScheduleSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  lastBackup: string | null;
  nextBackup: string | null;
  format: 'sql' | 'json';
}

const DEFAULT_SETTINGS: BackupScheduleSettings = {
  enabled: false,
  frequency: 'weekly',
  retentionDays: 30,
  lastBackup: null,
  nextBackup: null,
  format: 'json'
};

export function useBackupSchedule() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BackupScheduleSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('user_id', user.id)
        .eq('key', 'backup_schedule')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...(data.value as Partial<BackupScheduleSettings>)
        });
      }
    } catch (error) {
      logError('useBackupSchedule.loadSettings', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const calculateNextBackup = (frequency: BackupScheduleSettings['frequency']): string => {
    const now = new Date();
    const next = new Date(now);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(2, 0, 0, 0); // 2 AM
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 - next.getDay())); // Next Sunday
        next.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1, 1); // First of next month
        next.setHours(2, 0, 0, 0);
        break;
    }
    
    return next.toISOString();
  };

  const saveSettings = async (newSettings: Partial<BackupScheduleSettings>) => {
    if (!user) return;

    try {
      setSaving(true);
      
      const updatedSettings: BackupScheduleSettings = {
        ...settings,
        ...newSettings
      };

      // Calculate next backup if enabling or changing frequency
      if (updatedSettings.enabled && (!settings.enabled || newSettings.frequency)) {
        updatedSettings.nextBackup = calculateNextBackup(updatedSettings.frequency);
      } else if (!updatedSettings.enabled) {
        updatedSettings.nextBackup = null;
      }

      // Check if setting exists first
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('key', 'backup_schedule')
        .maybeSingle();

      const valueAsJson = updatedSettings as unknown as Json;

      let error;
      if (existing) {
        const result = await supabase
          .from('settings')
          .update({
            value: valueAsJson,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('key', 'backup_schedule');
        error = result.error;
      } else {
        const result = await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            key: 'backup_schedule',
            value: valueAsJson
          });
        error = result.error;
      }

      if (error) throw error;

      setSettings(updatedSettings);
      toast({
        title: 'Backup Settings Saved',
        description: updatedSettings.enabled 
          ? `Automatic backups scheduled ${updatedSettings.frequency}`
          : 'Automatic backups disabled'
      });
    } catch (error) {
      logError('useBackupSchedule.saveSettings', error);
      toast({
        title: 'Error',
        description: 'Failed to save backup settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const recordBackup = async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const nextBackup = settings.enabled 
        ? calculateNextBackup(settings.frequency)
        : null;

      const updatedSettings = {
        ...settings,
        lastBackup: now,
        nextBackup
      };

      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('key', 'backup_schedule')
        .maybeSingle();

      const valueAsJson = updatedSettings as unknown as Json;

      if (existing) {
        await supabase
          .from('settings')
          .update({
            value: valueAsJson,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('key', 'backup_schedule');
      } else {
        await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            key: 'backup_schedule',
            value: valueAsJson
          });
      }

      setSettings(updatedSettings);
    } catch (error) {
      logError('useBackupSchedule.recordBackup', error);
    }
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
    recordBackup
  };
}