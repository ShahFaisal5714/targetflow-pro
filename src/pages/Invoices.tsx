import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { mockInvoices } from '@/data/mockData';
import { Invoice, InvoiceStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, Receipt, Calendar, Download, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const statusTabs: { key: InvoiceStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

export default function Invoices() {
  const { role } = useAuth();
  const canEdit = role !== 'viewer';
  const [activeTab, setActiveTab] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesStatus = activeTab === 'all' || invoice.status === activeTab;
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalOutstanding = mockInvoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <Receipt className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">{invoice.projectName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      render: (invoice: Invoice) => (
        <span className="text-foreground">{invoice.clientName}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice: Invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      key: 'total',
      header: 'Amount',
      render: (invoice: Invoice) => (
        <span className="font-semibold text-foreground">AED {invoice.total.toLocaleString()}</span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (invoice: Invoice) => {
        const progress = Math.round((invoice.paidAmount / invoice.total) * 100);
        return (
          <div className="w-32">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                AED {invoice.paidAmount.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        );
      },
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      render: (invoice: Invoice) => {
        const outstanding = invoice.total - invoice.paidAmount;
        return (
          <span className={cn('font-medium', outstanding > 0 ? 'text-destructive' : 'text-success')}>
            AED {outstanding.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(invoice.dueDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1">
            <Download className="h-3 w-3" />
            PDF
          </Button>
          <Button size="sm" variant="outline">
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <Header
        title="Invoices"
        subtitle={`${filteredInvoices.length} invoices`}
        action={canEdit ? {
          label: 'New Invoice',
          onClick: () => console.log('Create invoice'),
        } : undefined}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <p className="text-sm text-primary-foreground/80">Total Outstanding</p>
            </div>
            <p className="text-2xl font-bold">AED {totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Paid</p>
            <p className="text-2xl font-bold text-success">
              {mockInvoices.filter((i) => i.status === 'paid').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Partial</p>
            <p className="text-2xl font-bold text-warning">
              {mockInvoices.filter((i) => i.status === 'partial').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Overdue</p>
            <p className="text-2xl font-bold text-destructive">
              {mockInvoices.filter((i) => i.status === 'overdue').length}
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
                placeholder="Search invoices..."
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
          data={filteredInvoices}
          emptyMessage="No invoices found"
        />
      </div>
    </MainLayout>
  );
}
