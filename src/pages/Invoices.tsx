import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, Receipt, Calendar, DollarSign, Loader2, Plus, Trash2, Package, Undo2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import InvoiceTermsSelector from '@/components/invoices/InvoiceTermsSelector';
import { getDefaultTerms } from '@/data/invoiceTerms';
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
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'all';

const statusTabs: { key: InvoiceStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

export default function Invoices() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast, dismiss } = useToast();
  const { invoices, loading, createInvoice, deleteInvoice } = useInvoices();
  const { projects } = useProjects();
  const { captureCustomer } = useCustomers();
  const { products } = useProducts();
  const canEdit = role !== 'viewer';
  const isAdmin = role === 'admin';
  
  const [activeTab, setActiveTab] = useState<InvoiceStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
  const undoTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  const [formData, setFormData] = useState({
    projectId: '',
    clientName: '',
    dueDate: '',
    items: [] as { productId: string; description: string; quantity: number; unitPrice: number; total: number; unit: string }[],
    termsConditions: getDefaultTerms(),
  });

  const filteredInvoices = invoices.filter((invoice) => {
    if (pendingDeletes.includes(invoice.id)) return false;
    const matchesStatus = activeTab === 'all' || invoice.status === activeTab;
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.total - inv.paid_amount), 0);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        unit: '',
      }],
    }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    if (productId === 'manual') {
      // Reset to manual entry
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item, i) => {
          if (i !== index) return item;
          return {
            ...item,
            productId: '',
            description: '',
            unitPrice: 0,
            unit: '',
            total: item.quantity * 0,
          };
        }),
      }));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const unitPrice = product.price;
        return {
          ...item,
          productId: product.id,
          description: product.name + (product.color ? ` - ${product.color}` : ''),
          unitPrice,
          unit: product.unit,
          total: item.quantity * unitPrice,
        };
      }),
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }),
    }));
  };

  const handleSubmit = async () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 5; // 5% VAT
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const project = projects.find(p => p.id === formData.projectId);
    const clientName = formData.clientName || project?.contractor?.name || 'Unknown Client';

    await createInvoice({
      project_id: formData.projectId || null,
      client_name: clientName,
      items: formData.items,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      paid_amount: 0,
      due_date: formData.dueDate || null,
      status: 'draft',
      terms_conditions: formData.termsConditions,
    });

    const party =
      project?.client?.name === clientName
        ? project?.client
        : project?.contractor?.name === clientName
          ? project?.contractor
          : undefined;

    await captureCustomer({
      name: clientName,
      contact_person: party?.contact || null,
      email: party?.email || null,
      phone: party?.phone || null,
      address: party?.address || null,
    });


    setIsFormOpen(false);
    setFormData({ projectId: '', clientName: '', dueDate: '', items: [], termsConditions: getDefaultTerms() });
  };

  const handleDeleteInvoice = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleUndoDelete = (invoiceId: string, toastId: string) => {
    const timeout = undoTimeoutRef.current.get(invoiceId);
    if (timeout) {
      clearTimeout(timeout);
      undoTimeoutRef.current.delete(invoiceId);
    }
    
    setPendingDeletes(prev => prev.filter(id => id !== invoiceId));
    dismiss(toastId);
    
    toast({
      title: 'Invoice Restored',
      description: `Invoice has been restored successfully.`,
    });
  };

  const confirmDelete = async () => {
    if (invoiceToDelete) {
      const invoiceId = invoiceToDelete.id;
      
      setPendingDeletes(prev => [...prev, invoiceId]);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      
      const { id: toastId } = toast({
        title: 'Invoice Deleted',
        description: `Invoice has been deleted.`,
        duration: 8000,
        action: (
          <ToastAction 
            altText="Undo delete" 
            onClick={() => handleUndoDelete(invoiceId, toastId)}
            className="gap-1"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </ToastAction>
        ),
      });
      
      const timeout = setTimeout(async () => {
        await deleteInvoice(invoiceId);
        setPendingDeletes(prev => prev.filter(id => id !== invoiceId));
        undoTimeoutRef.current.delete(invoiceId);
      }, 8000);
      
      undoTimeoutRef.current.set(invoiceId, timeout);
    }
  };

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
            <p className="font-mono text-sm font-medium text-foreground">{invoice.invoice_number}</p>
            <p className="text-xs text-muted-foreground">{invoice.client_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      render: (invoice: Invoice) => (
        <span className="text-foreground">{invoice.client_name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice: Invoice) => <StatusBadge status={invoice.status as any} />,
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
        const progress = invoice.total > 0 ? Math.round((invoice.paid_amount / invoice.total) * 100) : 0;
        return (
          <div className="w-32">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                AED {invoice.paid_amount.toLocaleString()}
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
        const outstanding = invoice.total - invoice.paid_amount;
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
          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/invoices/${invoice.id}`)}>
            View
          </Button>
          {isAdmin && (
            <>
              <Button size="sm" variant="outline" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={(e) => handleDeleteInvoice(invoice, e)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <Header title="Invoices" subtitle="Loading..." />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header
        title="Invoices"
        subtitle={`${filteredInvoices.length} invoices`}
        action={canEdit ? {
          label: 'New Invoice',
          onClick: () => setIsFormOpen(true),
        } : undefined}
      />

      <div className="px-4 py-4 sm:px-6 sm:py-6 min-w-0 space-y-6">
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
              {invoices.filter((i) => i.status === 'paid').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Partial</p>
            <p className="text-2xl font-bold text-warning">
              {invoices.filter((i) => i.status === 'partial').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Overdue</p>
            <p className="text-2xl font-bold text-destructive">
              {invoices.filter((i) => i.status === 'overdue').length}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{invoiceToDelete?.invoice_number}"? This action cannot be undone.
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

      {/* Create Invoice Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Tax Invoice</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Project</Label>
                <Select 
                  value={formData.projectId} 
                  onValueChange={(value) => {
                    const project = projects.find(p => p.id === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      projectId: value,
                      clientName: project?.contractor?.name || prev.clientName,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client Name</Label>
                <Input 
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Client name"
                />
              </div>
            </div>

            <div>
              <Label>Due Date</Label>
              <Input 
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              {formData.items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No items added. Click "Add Item" to add line items.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-3 space-y-2">
                        {/* Product Selection Row */}
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={item.productId || 'manual'}
                            onValueChange={(value) => handleProductSelect(index, value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select from inventory or enter manually" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">✏️ Enter manually</SelectItem>
                              {products.length > 0 && (
                                <>
                                  <SelectItem value="separator" disabled>
                                    ── Inventory Products ──
                                  </SelectItem>
                              {products.map(product => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} - {product.sku} (AED {product.price.toFixed(2)}/{product.unit}) • Stock: {product.stock_quantity}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Item Details Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            <Label className="text-xs">Description</Label>
                            <Input 
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Qty</Label>
                            <Input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Unit Price</Label>
                            <Input 
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Total</Label>
                            <Input 
                              value={item.total.toFixed(2)}
                              readOnly
                              className="bg-muted"
                            />
                          </div>
                          <div className="col-span-1 text-xs text-muted-foreground text-center">
                            {item.unit || '-'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {formData.items.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>AED {formData.items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT (5%)</span>
                  <span>AED {(formData.items.reduce((sum, i) => sum + i.total, 0) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>AED {(formData.items.reduce((sum, i) => sum + i.total, 0) * 1.05).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Terms & Conditions Selector */}
            <div className="border rounded-lg p-4">
              <InvoiceTermsSelector
                selectedTerms={formData.termsConditions}
                onTermsChange={(terms) => setFormData(prev => ({ ...prev, termsConditions: terms }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
