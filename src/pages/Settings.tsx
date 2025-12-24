import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Bell, Shield, Database, Mail, Globe, Loader2, Plus, Edit, Trash2, Star } from 'lucide-react';
import { useSettings, CompanySettings, TaxSettings, NotificationSettings } from '@/hooks/useSettings';
import { useCompanies, Company } from '@/hooks/useCompanies';
import CompanyFormDialog from '@/components/settings/CompanyFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Settings() {
  const { 
    companySettings, 
    taxSettings, 
    notificationSettings, 
    loading, 
    saving,
    saveCompanySettings,
    saveTaxSettings,
    saveNotificationSettings
  } = useSettings();

  const {
    companies,
    loading: companiesLoading,
    createCompany,
    updateCompany,
    deleteCompany,
  } = useCompanies();

  // Local state for form inputs
  const [company, setCompany] = useState<CompanySettings>(companySettings);
  const [tax, setTax] = useState<TaxSettings>(taxSettings);
  const [notifications, setNotifications] = useState<NotificationSettings>(notificationSettings);

  // Company management state
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Update local state when settings are loaded
  useEffect(() => {
    setCompany(companySettings);
  }, [companySettings]);

  useEffect(() => {
    setTax(taxSettings);
  }, [taxSettings]);

  useEffect(() => {
    setNotifications(notificationSettings);
  }, [notificationSettings]);

  const handleSaveCompany = () => {
    saveCompanySettings(company);
  };

  const handleSaveTax = () => {
    saveTaxSettings(tax);
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    saveNotificationSettings(updated);
  };

  const handleAddCompany = () => {
    setSelectedCompany(undefined);
    setCompanyDialogOpen(true);
  };

  const handleEditCompany = (comp: Company) => {
    setSelectedCompany(comp);
    setCompanyDialogOpen(true);
  };

  const handleDeleteCompany = (comp: Company) => {
    setCompanyToDelete(comp);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCompany = async () => {
    if (companyToDelete) {
      await deleteCompany(companyToDelete.id);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleCompanySubmit = async (data: Partial<Company>) => {
    if (selectedCompany) {
      return await updateCompany(selectedCompany.id, data);
    } else {
      return await createCompany(data);
    }
  };

  if (loading || companiesLoading) {
    return (
      <MainLayout>
        <Header title="Settings" subtitle="Manage your system preferences" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header title="Settings" subtitle="Manage your system preferences" />

      <div className="p-6">
        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="companies" className="gap-2">
              <Building2 className="h-4 w-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Database className="h-4 w-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Company Profiles</CardTitle>
                    <CardDescription>Manage multiple company identities for quotations and invoices</CardDescription>
                  </div>
                  <Button onClick={handleAddCompany}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No companies added yet</p>
                    <p className="text-sm">Add your first company to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {companies.map((comp) => (
                      <div key={comp.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-secondary/20 transition-colors">
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                          {comp.logo_url ? (
                            <img src={comp.logo_url} alt={comp.name} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{comp.name}</h3>
                            {comp.is_default && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                                <Star className="h-3 w-3" />
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            {comp.email && <p>{comp.email}</p>}
                            {comp.phone && <p>{comp.phone}</p>}
                            {comp.address && <p className="truncate">{comp.address}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCompany(comp)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCompany(comp)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>Update your default company details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input 
                        id="companyName" 
                        value={company.companyName}
                        onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tradeLicense">Trade License</Label>
                      <Input 
                        id="tradeLicense" 
                        value={company.tradeLicense}
                        onChange={(e) => setCompany({ ...company, tradeLicense: e.target.value })}
                        placeholder="Enter trade license"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={company.email}
                        onChange={(e) => setCompany({ ...company, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        value={company.phone}
                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      value={company.address}
                      onChange={(e) => setCompany({ ...company, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                  <Button onClick={handleSaveCompany} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tax Settings</CardTitle>
                  <CardDescription>Configure tax rates for quotations and invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vatRate">VAT Rate (%)</Label>
                      <Input 
                        id="vatRate" 
                        type="number" 
                        value={tax.vatRate}
                        onChange={(e) => setTax({ ...tax, vatRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">Tax Registration Number</Label>
                      <Input 
                        id="taxNumber" 
                        value={tax.taxNumber}
                        onChange={(e) => setTax({ ...tax, taxNumber: e.target.value })}
                        placeholder="Enter TRN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <Input 
                        id="currency" 
                        value={tax.currency}
                        onChange={(e) => setTax({ ...tax, currency: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveTax} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Tax Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure when and how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quotation Approvals</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when quotations are approved or rejected
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.quotationApprovals}
                    onCheckedChange={(checked) => handleNotificationChange('quotationApprovals', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts when products fall below reorder level
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.lowStockAlerts}
                    onCheckedChange={(checked) => handleNotificationChange('lowStockAlerts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Overdue</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about overdue payments
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.paymentOverdue}
                    onCheckedChange={(checked) => handleNotificationChange('paymentOverdue', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Delivery Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Track delivery status changes
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.deliveryUpdates}
                    onCheckedChange={(checked) => handleNotificationChange('deliveryUpdates', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>WhatsApp Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via WhatsApp
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.whatsappNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('whatsappNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Password Settings</CardTitle>
                  <CardDescription>Update your password and security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable 2FA</Label>
                      <p className="text-sm text-muted-foreground">
                        Require a code from your phone to log in
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Integration
                  </CardTitle>
                  <CardDescription>Configure email settings for notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpServer">SMTP Server</Label>
                      <Input id="smtpServer" placeholder="smtp.example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Port</Label>
                      <Input id="smtpPort" placeholder="587" />
                    </div>
                  </div>
                  <Button variant="outline">Test Connection</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    WhatsApp Business API
                  </CardTitle>
                  <CardDescription>Send notifications via WhatsApp</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsappToken">API Token</Label>
                    <Input id="whatsappToken" type="password" placeholder="Enter your API token" />
                  </div>
                  <Button variant="outline">Connect WhatsApp</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Accounting Software
                  </CardTitle>
                  <CardDescription>Sync with your accounting system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium text-foreground">QuickBooks</p>
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CompanyFormDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        company={selectedCompany}
        onSubmit={handleCompanySubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{companyToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCompany} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
