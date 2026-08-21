import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useProformaInvoices, ProformaInvoice } from '@/hooks/useProformaInvoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, FileText, Calendar, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ProformaStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'all';

const statusTabs: { key: ProformaStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'expired', label: 'Expired' },
];

export default function ProformaInvoices() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { proformaInvoices, loading, deleteProformaInvoice } = useProformaInvoices();
  const isAdmin = role === 'admin';
  
  const [activeTab, setActiveTab] = useState<ProformaStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [proformaToDelete, setProformaToDelete] = useState<ProformaInvoice | null>(null);

  const filteredProformas = proformaInvoices.filter((proforma) => {
    const matchesStatus = activeTab === 'all' || proforma.status === activeTab;
    const matchesSearch =
      proforma.proforma_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proforma.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalValue = proformaInvoices.reduce((sum, pi) => sum + pi.total, 0);

  const handleDeleteProforma = (proforma: ProformaInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setProformaToDelete(proforma);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (proformaToDelete) {
      await deleteProformaInvoice(proformaToDelete.id);
      setDeleteDialogOpen(false);
      setProformaToDelete(null);
    }
  };

  const columns = [
    {
      key: 'proformaNumber',
      header: 'Proforma Invoice',
      render: (proforma: ProformaInvoice) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-foreground">{proforma.proforma_number}</p>
            <p className="text-xs text-muted-foreground">{proforma.client_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      render: (proforma: ProformaInvoice) => (
        <span className="text-foreground">{proforma.client_name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (proforma: ProformaInvoice) => <StatusBadge status={proforma.status as any} />,
    },
    {
      key: 'total',
      header: 'Amount',
      render: (proforma: ProformaInvoice) => (
        <span className="font-semibold text-foreground">AED {proforma.total.toLocaleString()}</span>
      ),
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (proforma: ProformaInvoice) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {proforma.valid_until ? new Date(proforma.valid_until).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (proforma: ProformaInvoice) => (
        <span className="text-sm text-muted-foreground">
          {new Date(proforma.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (proforma: ProformaInvoice) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/proforma-invoices/${proforma.id}`)}>
            View
          </Button>
          {isAdmin && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-destructive hover:text-destructive" 
              onClick={(e) => handleDeleteProforma(proforma, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <Header title="Proforma Invoices" subtitle="Loading..." />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header
        title="Proforma Invoices"
        subtitle={`${filteredProformas.length} proforma invoices`}
      />

      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-4">
            <p className="text-sm text-primary-foreground/80 mb-2">Total Value</p>
            <p className="text-2xl font-bold">AED {totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Draft</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {proformaInvoices.filter((pi) => pi.status === 'draft').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Sent</p>
            <p className="text-2xl font-bold text-warning">
              {proformaInvoices.filter((pi) => pi.status === 'sent').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Accepted</p>
            <p className="text-2xl font-bold text-success">
              {proformaInvoices.filter((pi) => pi.status === 'accepted').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search proforma invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredProformas}
          emptyMessage="No proforma invoices found. Create one from an approved quotation."
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proforma Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{proformaToDelete?.proforma_number}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
