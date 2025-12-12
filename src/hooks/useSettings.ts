import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CompanySettings {
  companyName: string;
  tradeLicense: string;
  email: string;
  phone: string;
  address: string;
}

export interface TaxSettings {
  vatRate: number;
  taxNumber: string;
  currency: string;
}

export interface NotificationSettings {
  quotationApprovals: boolean;
  lowStockAlerts: boolean;
  paymentOverdue: boolean;
  deliveryUpdates: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

const defaultCompanySettings: CompanySettings = {
  companyName: '',
  tradeLicense: '',
  email: '',
  phone: '',
  address: ''
};

const defaultTaxSettings: TaxSettings = {
  vatRate: 5,
  taxNumber: '',
  currency: 'AED'
};

const defaultNotificationSettings: NotificationSettings = {
  quotationApprovals: true,
  lowStockAlerts: true,
  paymentOverdue: true,
  deliveryUpdates: true,
  emailNotifications: true,
  whatsappNotifications: false
};

export function useSettings() {
  const { user } = useAuth();
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(defaultTaxSettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      data?.forEach((setting: { key: string; value: any }) => {
        if (setting.key === 'company') {
          setCompanySettings(setting.value as CompanySettings);
        } else if (setting.key === 'tax') {
          setTaxSettings(setting.value as TaxSettings);
        } else if (setting.key === 'notifications') {
          setNotificationSettings(setting.value as NotificationSettings);
        }
      });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    if (!user) return;

    try {
      setSaving(true);
      
      // Use upsert to insert or update
      const { error } = await supabase
        .from('settings')
        .upsert(
          { 
            user_id: user.id, 
            key, 
            value 
          },
          { 
            onConflict: 'user_id,key'
          }
        );

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your settings have been saved successfully.'
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
    return saveSetting('company', settings);
  };

  const saveTaxSettings = (settings: TaxSettings) => {
    setTaxSettings(settings);
    return saveSetting('tax', settings);
  };

  const saveNotificationSettings = (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    return saveSetting('notifications', settings);
  };

  return {
    companySettings,
    taxSettings,
    notificationSettings,
    loading,
    saving,
    saveCompanySettings,
    saveTaxSettings,
    saveNotificationSettings
  };
}
