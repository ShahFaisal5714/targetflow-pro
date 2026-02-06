import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  FolderKanban, 
  FileText, 
  Receipt, 
  FileCheck, 
  Package, 
  Truck,
  Search,
  Clock,
  X
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useQuotations } from '@/hooks/useQuotations';
import { useInvoices } from '@/hooks/useInvoices';
import { useProformaInvoices } from '@/hooks/useProformaInvoices';
import { useProducts } from '@/hooks/useProducts';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { useRecentSearches, RecentSearchItem } from '@/hooks/useRecentSearches';

const typeIcons = {
  project: FolderKanban,
  quotation: FileText,
  proforma: FileCheck,
  invoice: Receipt,
  product: Package,
  delivery: Truck,
};

const typeColors = {
  project: 'text-primary',
  quotation: 'text-warning',
  proforma: 'text-info',
  invoice: 'text-success',
  product: 'text-accent',
  delivery: 'text-warning',
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

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

  const handleSelect = useCallback((item: Omit<RecentSearchItem, 'timestamp'>) => {
    addRecentSearch(item);
    setOpen(false);
    setSearch('');
    navigate(item.path);
  }, [navigate, addRecentSearch]);

  const handleRecentSelect = useCallback((item: RecentSearchItem) => {
    addRecentSearch(item);
    setOpen(false);
    setSearch('');
    navigate(item.path);
  }, [navigate, addRecentSearch]);

  const showRecent = search.length === 0 && recentSearches.length > 0;

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
        <CommandInput 
          placeholder="Search projects, quotations, invoices..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Recent Searches */}
          {showRecent && (
            <>
              <CommandGroup heading={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearRecentSearches();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                </div>
              }>
                {recentSearches.map((item) => {
                  const Icon = typeIcons[item.type];
                  const colorClass = typeColors[item.type];
                  return (
                    <CommandItem
                      key={`recent-${item.id}`}
                      value={`recent ${item.label} ${item.sublabel}`}
                      onSelect={() => handleRecentSelect(item)}
                    >
                      <Icon className={`mr-2 h-4 w-4 ${colorClass}`} />
                      <div className="flex flex-col">
                        <span>{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.sublabel}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.slice(0, 5).map((project) => (
                <CommandItem
                  key={project.id}
                  value={`project ${project.name} ${project.client?.name || ''}`}
                  onSelect={() => handleSelect({
                    id: project.id,
                    type: 'project',
                    label: project.name,
                    sublabel: project.client?.name || 'No client',
                    path: `/projects/${project.id}`,
                  })}
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
                  onSelect={() => handleSelect({
                    id: quotation.id,
                    type: 'quotation',
                    label: `Q-${quotation.id.slice(0, 8).toUpperCase()}`,
                    sublabel: `${quotation.project_name} • AED ${quotation.total.toLocaleString()}`,
                    path: `/quotations/${quotation.id}`,
                  })}
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
                  onSelect={() => handleSelect({
                    id: proforma.id,
                    type: 'proforma',
                    label: proforma.proforma_number,
                    sublabel: `${proforma.client_name} • AED ${proforma.total.toLocaleString()}`,
                    path: `/proforma-invoices/${proforma.id}`,
                  })}
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
                  onSelect={() => handleSelect({
                    id: invoice.id,
                    type: 'invoice',
                    label: invoice.invoice_number,
                    sublabel: `${invoice.client_name} • AED ${invoice.total.toLocaleString()}`,
                    path: `/invoices/${invoice.id}`,
                  })}
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
                  onSelect={() => handleSelect({
                    id: product.id,
                    type: 'product',
                    label: product.name,
                    sublabel: `${product.sku} • ${product.category}`,
                    path: '/inventory',
                  })}
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
                  onSelect={() => handleSelect({
                    id: delivery.id,
                    type: 'delivery',
                    label: delivery.delivery_number,
                    sublabel: delivery.status,
                    path: '/delivery-orders',
                  })}
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
