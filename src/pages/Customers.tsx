import { useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2, Users } from 'lucide-react';
import CustomerFormDialog from '@/components/customers/CustomerFormDialog';
import { useCustomers, Customer, CustomerInput } from '@/hooks/useCustomers';
import { useCompanies } from '@/hooks/useCompanies';
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

export default function Customers() {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { activeCompany } = useCompanies();
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [toDelete, setToDelete] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customers.filter((c) =>
      [c.name, c.contact_person, c.email, c.phone, c.trn]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const handleSubmit = async (input: CustomerInput) => {
    if (selected) {
      await updateCustomer(selected.id, input);
    } else {
      await createCustomer(input);
    }
    setSelected(null);
  };

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (c: Customer) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{c.name}</p>
          {c.contact_person && <p className="text-xs text-muted-foreground truncate">{c.contact_person}</p>}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (c: Customer) => (
        <div className="min-w-0 text-sm">
          {c.phone && <p className="text-foreground truncate">{c.phone}</p>}
          {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
          {!c.phone && !c.email && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'trn',
      header: 'TRN',
      render: (c: Customer) => <span className="text-sm">{c.trn || '—'}</span>,
    },
    {
      key: 'payment_terms',
      header: 'Payment Terms',
      render: (c: Customer) => <span className="text-sm">{c.payment_terms || '—'}</span>,
    },
    {
      key: 'credit_limit',
      header: 'Credit Limit',
      render: (c: Customer) => (
        <span className="text-sm font-medium">
          {c.credit_limit ? `AED ${Number(c.credit_limit).toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Customer) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${c.name}`}
            className="h-11 w-11"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(c);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${c.name}`}
            className="h-11 w-11 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setToDelete(c);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <Header title="Customers" subtitle={`Customer records for ${activeCompany?.name || 'active company'}`} />

      <div className="px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers..."
              aria-label="Search customers"
              className="pl-9 min-h-11"
            />
          </div>
          <Button
            className="min-h-11"
            onClick={() => {
              setSelected(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {loading ? 'Loading customers...' : `${filtered.length} customer${filtered.length === 1 ? '' : 's'}`}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No customers yet. They are saved automatically when you create quotations, invoices or projects."
        />
      </div>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelected(null);
        }}
        customer={selected}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} will be removed from your customer records. Documents already created are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (toDelete) await deleteCustomer(toDelete.id);
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
