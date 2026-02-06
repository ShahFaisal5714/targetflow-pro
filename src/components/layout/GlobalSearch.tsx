import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  FolderKanban, 
  FileText, 
  Receipt, 
  FileCheck, 
  Package, 
  Truck,
  Search
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useQuotations } from '@/hooks/useQuotations';
import { useInvoices } from '@/hooks/useInvoices';
import { useProformaInvoices } from '@/hooks/useProformaInvoices';
import { useProducts } from '@/hooks/useProducts';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { projects } = useProjects();
  const { quotations } = useQuotations();
  const { invoices } = useInvoices();
  const { proformaInvoices } = useProformaInvoices();
  const { products } = useProducts();
  const { deliveryOrders } = useDeliveryOrders();

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative hidden md:flex items-center gap-2 h-10 w-72 rounded-lg border border-input bg-secondary/50 px-3 text-sm text-muted-foreground hover:bg-secondary transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search anything...</span>
        <kbd className="pointer-events-none absolute right-3 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search projects, quotations, invoices..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Projects */}
          {projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.slice(0, 5).map((project) => (
                <CommandItem
                  key={project.id}
                  value={`project ${project.name} ${project.client?.name || ''}`}
                  onSelect={() => handleSelect(`/projects/${project.id}`)}
                >
                  <FolderKanban className="mr-2 h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span>{project.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {project.client?.name || 'No client'}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Quotations */}
          {quotations.length > 0 && (
            <CommandGroup heading="Quotations">
              {quotations.slice(0, 5).map((quotation) => (
                <CommandItem
                  key={quotation.id}
                  value={`quotation ${quotation.project_name} ${quotation.id}`}
                  onSelect={() => handleSelect(`/quotations/${quotation.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4 text-warning" />
                  <div className="flex flex-col">
                    <span>Q-{quotation.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground">
                      {quotation.project_name} • AED {quotation.total.toLocaleString()}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Proforma Invoices */}
          {proformaInvoices.length > 0 && (
            <CommandGroup heading="Proforma Invoices">
              {proformaInvoices.slice(0, 5).map((proforma) => (
                <CommandItem
                  key={proforma.id}
                  value={`proforma ${proforma.proforma_number} ${proforma.client_name}`}
                  onSelect={() => handleSelect(`/proforma-invoices/${proforma.id}`)}
                >
                  <FileCheck className="mr-2 h-4 w-4 text-info" />
                  <div className="flex flex-col">
                    <span>{proforma.proforma_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {proforma.client_name} • AED {proforma.total.toLocaleString()}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Invoices */}
          {invoices.length > 0 && (
            <CommandGroup heading="Invoices">
              {invoices.slice(0, 5).map((invoice) => (
                <CommandItem
                  key={invoice.id}
                  value={`invoice ${invoice.invoice_number} ${invoice.client_name}`}
                  onSelect={() => handleSelect(`/invoices/${invoice.id}`)}
                >
                  <Receipt className="mr-2 h-4 w-4 text-success" />
                  <div className="flex flex-col">
                    <span>{invoice.invoice_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {invoice.client_name} • AED {invoice.total.toLocaleString()}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Products */}
          {products.length > 0 && (
            <CommandGroup heading="Products">
              {products.slice(0, 5).map((product) => (
                <CommandItem
                  key={product.id}
                  value={`product ${product.name} ${product.sku} ${product.category}`}
                  onSelect={() => handleSelect('/inventory')}
                >
                  <Package className="mr-2 h-4 w-4 text-accent" />
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.sku} • {product.category}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Delivery Orders */}
          {deliveryOrders.length > 0 && (
            <CommandGroup heading="Delivery Orders">
              {deliveryOrders.slice(0, 5).map((delivery) => (
                <CommandItem
                  key={delivery.id}
                  value={`delivery ${delivery.delivery_number}`}
                  onSelect={() => handleSelect('/delivery-orders')}
                >
                  <Truck className="mr-2 h-4 w-4 text-warning" />
                  <div className="flex flex-col">
                    <span>{delivery.delivery_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {delivery.status}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
