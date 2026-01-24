import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Bell, Shield, Database, Loader2, Star, Check, Edit, ArrowLeftRight, Download, HardDrive, Upload, AlertCircle, CheckCircle2, FileJson, FileCode, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings, CompanySettings, TaxSettings, NotificationSettings } from '@/hooks/useSettings';
import { useCompanies } from '@/hooks/useCompanies';
import BulkTransferDialog from '@/components/settings/BulkTransferDialog';
import ImportConfirmDialog from '@/components/settings/ImportConfirmDialog';
import BackupScheduleCard from '@/components/settings/BackupScheduleCard';
import { useDatabaseExport, ExportResult } from '@/hooks/useDatabaseExport';
import { useDatabaseImport } from '@/hooks/useDatabaseImport';
import { useBackupHistory } from '@/hooks/useBackupHistory';
import targetLogo from '@/assets/target-logo.jpg';
import alhadafLogo from '@/assets/alhadaf-logo.png';

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
    targetSpecialties,
    alhadafCompany,
    activeCompanyId,
    loading: companiesLoading,
    updateAlhadafCompany,
    setActiveCompany,
  } = useCompanies();

  const { exporting, exportAsSQL, exportAsJSON } = useDatabaseExport();
  const { importing, results: importResults, importDatabase } = useDatabaseImport();
  const { saveBackup } = useBackupHistory();

  // Wrapper to save backup to history with company info
  const handleSaveToHistory = async (result: ExportResult) => {
    const activeCompany = activeCompanyId === 'target-specialties' 
      ? { id: null, name: 'Target Specialties' }
      : { id: alhadafCompany?.id || null, name: alhadafCompany?.name || 'Al Hadaf Al Kabeer' };
    
    await saveBackup({
      filename: result.filename,
      format: result.format,
      size_bytes: result.sizeBytes,
      tables_included: result.tables,
      record_count: result.recordCount,
      backup_type: 'manual',
      status: 'completed',
      content: result.content,
      company_id: activeCompany.id,
      company_name: activeCompany.name,
    });
  };

  const handleExportSQL = () => exportAsSQL(handleSaveToHistory);
  const handleExportJSON = () => exportAsJSON(handleSaveToHistory);

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingImportFile(file);
      // Read file content for preview
      const content = await file.text();
      setPendingFileContent(content);
      setImportDialogOpen(true);
      // Reset the input so the same file can be selected again
      event.target.value = '';
    }
  };

  const handleImportConfirm = async (clearExisting: boolean, selectedTables: string[]) => {
    if (pendingImportFile) {
      setImportDialogOpen(false);
      await importDatabase(pendingImportFile, clearExisting, selectedTables);
      setPendingImportFile(null);
      setPendingFileContent(null);
    }
  };

  // Local state for form inputs
  const [company, setCompany] = useState<CompanySettings>(companySettings);
  const [tax, setTax] = useState<TaxSettings>(taxSettings);
  const [notifications, setNotifications] = useState<NotificationSettings>(notificationSettings);

  // Alhadaf editing state
  const [editingAlhadaf, setEditingAlhadaf] = useState(false);
  const [alhadafForm, setAlhadafForm] = useState({
    email: '',
    phone: '',
    address: '',
    website: '',
  });
  const [savingAlhadaf, setSavingAlhadaf] = useState(false);
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);

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

  useEffect(() => {
    if (alhadafCompany) {
      setAlhadafForm({
        email: alhadafCompany.email || '',
        phone: alhadafCompany.phone || '',
        address: alhadafCompany.address || '',
        website: alhadafCompany.website || '',
      });
    }
  }, [alhadafCompany]);

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

  const handleSaveAlhadaf = async () => {
    setSavingAlhadaf(true);
    await updateAlhadafCompany(alhadafForm);
    setSavingAlhadaf(false);
    setEditingAlhadaf(false);
  };

  const handleSelectCompany = async (companyId: string) => {
    await setActiveCompany(companyId);
    // No need to reload - hooks now auto-refresh when activeCompanyId changes
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Company Profiles</CardTitle>
                  <CardDescription>Select which company's branding to use for quotations and invoices</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setBulkTransferOpen(true)}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Bulk Transfer
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Target Specialties - Always present, hardcoded */}
                <div 
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    activeCompanyId === 'target-specialties' || !activeCompanyId
                      ? 'border-primary bg-primary/5' 
                      : 'bg-card hover:bg-secondary/20'
                  }`}
                  onClick={() => handleSelectCompany('target-specialties')}
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                    <img src={targetLogo} alt="Target Specialties" className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{targetSpecialties.name}</h3>
                      {(activeCompanyId === 'target-specialties' || !activeCompanyId) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                          <Star className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>{targetSpecialties.email}</p>
                      <p>{targetSpecialties.phone}</p>
                      <p className="truncate">{targetSpecialties.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(activeCompanyId === 'target-specialties' || !activeCompanyId) ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSelectCompany('target-specialties'); }}>
                        Select
                      </Button>
                    )}
                  </div>
                </div>

                {/* Alhadaf Projects - Editable */}
                <div 
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    activeCompanyId && activeCompanyId !== 'target-specialties'
                      ? 'border-primary bg-primary/5' 
                      : 'bg-card hover:bg-secondary/20'
                  } ${!editingAlhadaf ? 'cursor-pointer' : ''}`}
                  onClick={() => !editingAlhadaf && handleSelectCompany('alhadaf-projects')}
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                    <img src={alhadafLogo} alt="Alhadaf Projects" className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{alhadafCompany.name}</h3>
                      {activeCompanyId && activeCompanyId !== 'target-specialties' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                          <Star className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>

                    {editingAlhadaf ? (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Email</Label>
                            <Input 
                              value={alhadafForm.email}
                              onChange={(e) => setAlhadafForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="email@example.com"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Phone</Label>
                            <Input 
                              value={alhadafForm.phone}
                              onChange={(e) => setAlhadafForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+971 XX XXX XXXX"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Address</Label>
                          <Input 
                            value={alhadafForm.address}
                            onChange={(e) => setAlhadafForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Company address"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Website</Label>
                          <Input 
                            value={alhadafForm.website}
                            onChange={(e) => setAlhadafForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://example.com"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" onClick={handleSaveAlhadaf} disabled={savingAlhadaf}>
                            {savingAlhadaf && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingAlhadaf(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        {alhadafCompany.email && <p>{alhadafCompany.email}</p>}
                        {alhadafCompany.phone && <p>{alhadafCompany.phone}</p>}
                        {alhadafCompany.address && <p className="truncate">{alhadafCompany.address}</p>}
                        {!alhadafCompany.email && !alhadafCompany.phone && !alhadafCompany.address && (
                          <p className="text-muted-foreground/60">Click Edit to add contact details</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {!editingAlhadaf && (
                      <Button variant="ghost" size="icon" onClick={() => setEditingAlhadaf(true)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {activeCompanyId && activeCompanyId !== 'target-specialties' ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    ) : !editingAlhadaf ? (
                      <Button variant="outline" size="sm" onClick={() => handleSelectCompany('alhadaf-projects')}>
                        Select
                      </Button>
                    ) : null}
                  </div>
                </div>
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
                        Require a verification code when signing in
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
              {/* Scheduled Backups */}
              <BackupScheduleCard />
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Database Backup & Restore</CardTitle>
                    <CardDescription>Export or import your database schema and data</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/backup-history">
                      <History className="h-4 w-4 mr-2" />
                      View History
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* SQL Export Section */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <FileCode className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Export as SQL</p>
                        <p className="text-sm text-muted-foreground">
                          Schema, tables, RLS policies, and data as executable SQL
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleExportSQL} disabled={exporting}>
                      {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {exporting ? 'Exporting...' : 'Export SQL'}
                    </Button>
                  </div>

                  {/* JSON Export Section */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center">
                        <FileJson className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Export as JSON</p>
                        <p className="text-sm text-muted-foreground">
                          Data only in JSON format for easier manipulation
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleExportJSON} disabled={exporting}>
                      {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {exporting ? 'Exporting...' : 'Export JSON'}
                    </Button>
                  </div>

                  {/* Import Section */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Import Database</p>
                        <p className="text-sm text-muted-foreground">
                          Restore data from SQL or JSON export file
                        </p>
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept=".sql,.json"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="db-import"
                        disabled={importing}
                      />
                      <Button asChild disabled={importing}>
                        <label htmlFor="db-import" className="cursor-pointer">
                          {importing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {importing ? 'Importing...' : 'Import File'}
                        </label>
                      </Button>
                    </div>
                  </div>

                  {/* Import Results */}
                  {importResults.length > 0 && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Import Results
                      </h4>
                      <div className="space-y-2">
                        {importResults.map((result) => (
                          <div key={result.table} className="flex items-center justify-between text-sm">
                            <span className="font-mono">{result.table}</span>
                            <div className="flex items-center gap-3">
                              {result.inserted > 0 && (
                                <span className="flex items-center gap-1 text-success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {result.inserted} imported
                                </span>
                              )}
                              {result.errors > 0 && (
                                <span className="flex items-center gap-1 text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  {result.errors} errors
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connected Integrations</CardTitle>
                  <CardDescription>Manage external service connections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                        <span className="text-accent-foreground font-bold">QB</span>
                      </div>
                      <div>
                        <p className="font-medium">QuickBooks</p>
                        <p className="text-sm text-muted-foreground">Accounting & Finance</p>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-success/20 flex items-center justify-center">
                        <span className="text-success font-bold">WA</span>
                      </div>
                      <div>
                        <p className="font-medium">WhatsApp Business</p>
                        <p className="text-sm text-muted-foreground">Customer Communication</p>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                        <span className="text-secondary-foreground font-bold">Z</span>
                      </div>
                      <div>
                        <p className="font-medium">Zoho CRM</p>
                        <p className="text-sm text-muted-foreground">Customer Management</p>
                      </div>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BulkTransferDialog 
        open={bulkTransferOpen} 
        onOpenChange={setBulkTransferOpen}
        onTransferComplete={() => {
          // Trigger a page refresh to reload all data
          window.location.reload();
        }}
      />

      <ImportConfirmDialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) {
            setPendingImportFile(null);
            setPendingFileContent(null);
          }
        }}
        fileName={pendingImportFile?.name || ''}
        fileContent={pendingFileContent}
        onConfirm={handleImportConfirm}
      />
    </MainLayout>
  );
}
