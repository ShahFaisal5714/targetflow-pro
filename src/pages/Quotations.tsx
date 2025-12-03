import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import QuotationFormDialog from '@/components/quotations/QuotationFormDialog';
import { mockQuotations } from '@/data/mockData';
import { Quotation, QuotationStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, FileText, Calendar, GitBranch, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

const statusTabs: { key: QuotationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function Quotations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<QuotationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);

  const handleEditQuotation = (quotation: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQuotation(quotation);
    setIsEditDialogOpen(true);
  };

  const handleDeleteQuotation = (quotation: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuotationToDelete(quotation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (quotationToDelete) {
      toast({
        title: 'Quotation Deleted',
        description: `${quotationToDelete.id} has been deleted successfully.`,
      });
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  };

  const filteredQuotations = mockQuotations.filter((quotation) => {
    const matchesStatus = activeTab === 'all' || quotation.status === activeTab;
    const matchesSearch =
      quotation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      key: 'id',
      header: 'Quotation ID',
      render: (quotation: Quotation) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-foreground">{quotation.id}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              Version {quotation.version}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'projectName',
      header: 'Project',
      render: (quotation: Quotation) => (
        <div>
          <p className="font-medium text-foreground">{quotation.projectName}</p>
          <p className="text-sm text-muted-foreground">{quotation.items.length} line items</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (quotation: Quotation) => <StatusBadge status={quotation.status} />,
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      render: (quotation: Quotation) => (
        <span className="text-muted-foreground">AED {quotation.subtotal.toLocaleString()}</span>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (quotation: Quotation) => (
        <span className="text-destructive">
          {quotation.discount.type === 'percentage'
            ? `${quotation.discount.value}%`
            : `AED ${quotation.discount.value.toLocaleString()}`}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (quotation: Quotation) => (
        <span className="font-semibold text-foreground">AED {quotation.total.toLocaleString()}</span>
      ),
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (quotation: Quotation) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(quotation.validUntil).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (quotation: Quotation) => (
        <div className="flex items-center gap-2">
          {quotation.status === 'approved' && (
            <Button size="sm" variant="accent">
              Convert to SO
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate(`/quotations/${quotation.id}`)}>
            View
          </Button>
          <Button size="sm" variant="outline" onClick={(e) => handleEditQuotation(quotation, e)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={(e) => handleDeleteQuotation(quotation, e)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <Header
        title="Quotations"
        subtitle={`${filteredQuotations.length} quotations`}
        action={{
          label: 'New Quotation',
          onClick: () => setIsCreateDialogOpen(true),
        }}
      />

      <QuotationFormDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      <QuotationFormDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} quotation={selectedQuotation} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{quotationToDelete?.id}"? This action cannot be undone.
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

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground">Draft</p>
            <p className="text-2xl font-bold text-foreground">
              {mockQuotations.filter((q) => q.status === 'draft').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground">Submitted</p>
            <p className="text-2xl font-bold text-info">
              {mockQuotations.filter((q) => q.status === 'submitted').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-success">
              {mockQuotations.filter((q) => q.status === 'approved').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-foreground">
              AED {mockQuotations.reduce((sum, q) => sum + q.total, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
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
                placeholder="Search quotations..."
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
          data={filteredQuotations}
          emptyMessage="No quotations found"
          onRowClick={(quotation) => navigate(`/quotations/${quotation.id}`)}
        />
      </div>
    </MainLayout>
  );
}
