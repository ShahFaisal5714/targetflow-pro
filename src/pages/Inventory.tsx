import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import { useProducts, Product, ProductInput } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, Package, AlertTriangle, Plus, Pencil, Trash2, Upload, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductFormDialog from '@/components/inventory/ProductFormDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const categoryTabs: { key: string; label: string }[] = [
  { key: 'all', label: 'All Products' },
  { key: 'spc_flooring', label: 'SPC Flooring' },
  { key: 'tile_trims', label: 'Tile Trims' },
  { key: 'wpc_decking', label: 'WPC Decking' },
  { key: 'expansion_joints', label: 'Expansion Joints' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'other', label: 'Other' },
];

const categoryLabels: Record<string, string> = {
  spc_flooring: 'SPC Flooring',
  tile_trims: 'Tile Trims',
  wpc_decking: 'WPC Decking',
  expansion_joints: 'Expansion Joints',
  lighting: 'Lighting',
  other: 'Other',
};

const unitLabels: Record<string, string> = {
  sqm: 'sqm',
  piece: 'pcs',
  pcs: 'pcs',
  lm: 'lm',
  kg: 'kg',
  box: 'box',
  set: 'set',
};

interface FilterState {
  name: string;
  sku: string;
  color: string;
  minPrice: string;
  maxPrice: string;
  minStock: string;
  maxStock: string;
}

const initialFilters: FilterState = {
  name: '',
  sku: '',
  color: '',
  minPrice: '',
  maxPrice: '',
  minStock: '',
  maxStock: '',
};

const normalizeCsvHeader = (header: string) => {
  const cleaned = (header || '')
    .replace(/^\uFEFF/, '') // strip BOM
    .trim()
    .replace(/^"|"$/g, '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents
  return cleaned.replace(/[\s\-]+/g, '_');
};

// Map common header variations to standard field names
const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'product_name', 'product'],
  sku: ['sku', 'item_code', 'product_code', 'code'],
  category: ['category', 'type', 'product_category'],
  price: ['price', 'unit_price', 'selling_price', 'sale_price'],
  cost: ['cost', 'unit_cost', 'purchase_price', 'buying_price'],
  stock_quantity: ['stock_quantity', 'stock', 'quantity', 'qty', 'stock_qty', 'quantity_on_hand'],
  reorder_level: ['reorder_level', 'reorder', 'min_stock', 'minimum_stock', 'min_quantity'],
  unit: ['unit', 'uom', 'unit_of_measure'],
  description: ['description', 'desc', 'details', 'product_description'],
  color: ['color', 'colour', 'variant'],
};

const findStandardHeader = (rawHeader: string): string => {
  const normalized = normalizeCsvHeader(rawHeader);
  
  for (const [standard, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) {
      return standard;
    }
    // Also check if normalized starts with or contains the alias
    for (const alias of aliases) {
      if (normalized.startsWith(alias) || normalized === alias) {
        return standard;
      }
    }
  }
  return normalized;
};

// Minimal CSV parser that supports quoted values and commas inside quotes.
const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  const s = (line || '').replace(/\r$/, '');

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      // Escaped quote inside quoted field
      if (inQuotes && s[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }

    cur += ch;
  }
  out.push(cur);
  return out.map((v) => v.trim());
};

export default function Inventory() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeTab === 'all' || product.category === activeTab;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Advanced filters
    const matchesName = !filters.name || product.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesSku = !filters.sku || product.sku.toLowerCase().includes(filters.sku.toLowerCase());
    const matchesColor = !filters.color || (product.color && product.color.toLowerCase().includes(filters.color.toLowerCase()));
    const matchesMinPrice = !filters.minPrice || product.price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || product.price <= parseFloat(filters.maxPrice);
    const matchesMinStock = !filters.minStock || product.stock_quantity >= parseInt(filters.minStock);
    const matchesMaxStock = !filters.maxStock || product.stock_quantity <= parseInt(filters.maxStock);
    
    return matchesCategory && matchesSearch && matchesName && matchesSku && matchesColor && 
           matchesMinPrice && matchesMaxPrice && matchesMinStock && matchesMaxStock;
  });

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.reorder_level);
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.stock_quantity * p.price,
    0
  );

  const uniqueCategories = [...new Set(products.map((p) => p.category))];

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: ProductInput) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingProduct) {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  // CSV Import Handler
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const rawHeaderCells = parseCsvLine(lines[0]);
        // Map raw headers to standard field names
        const headers = rawHeaderCells.map(findStandardHeader);
        
        console.log('CSV Import - Raw headers:', rawHeaderCells);
        console.log('CSV Import - Mapped headers:', headers);
        
        const requiredHeaders = ['name', 'sku'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          toast({
            title: 'Invalid CSV Format',
            description: `Missing required columns: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`,
            variant: 'destructive',
          });
          setImporting(false);
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          if (values.every(v => !v.trim())) continue; // Skip empty rows
          
          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          const productInput: ProductInput = {
            name: rowData.name?.trim(),
            sku: rowData.sku?.trim(),
            category: rowData.category?.trim() || 'other',
            price: parseFloat(rowData.price) || 0,
            cost: parseFloat(rowData.cost) || 0,
            stock_quantity: parseInt(rowData.stock_quantity) || 0,
            reorder_level: parseInt(rowData.reorder_level) || 10,
            unit: rowData.unit?.trim() || 'piece',
            description: rowData.description?.trim(),
            color: rowData.color?.trim(),
          };

          if (productInput.name && productInput.sku) {
            const result = await createProduct(productInput);
            if (result) successCount++;
            else errorCount++;
          }
        }

        toast({
          title: 'Import Complete',
          description: `Successfully imported ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
      } catch (error: any) {
        toast({
          title: 'Import Error',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // CSV Export Handler - uses normalized snake_case headers for round-trip compatibility
  const exportToCSV = () => {
    const headers = ['sku', 'name', 'category', 'color', 'price', 'cost', 'stock_quantity', 'reorder_level', 'unit', 'description'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(p => [
        `"${p.sku}"`,
        `"${p.name}"`,
        p.category,
        p.color || '',
        p.price,
        p.cost,
        p.stock_quantity,
        p.reorder_level,
        p.unit,
        `"${(p.description || '').replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({ title: 'CSV Exported', description: `${filteredProducts.length} products exported successfully` });
  };

  // PDF Export Handler
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Inventory Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Products: ${filteredProducts.length}`, 14, 36);
    doc.text(`Total Stock Value: AED ${totalStockValue.toLocaleString()}`, 14, 42);

    autoTable(doc, {
      startY: 50,
      head: [['SKU', 'Name', 'Category', 'Color', 'Price (AED)', 'Stock', 'Value (AED)']],
      body: filteredProducts.map(p => [
        p.sku,
        p.name,
        categoryLabels[p.category] || p.category,
        p.color || '-',
        p.price.toFixed(2),
        `${p.stock_quantity} ${unitLabels[p.unit] || p.unit}`,
        (p.stock_quantity * p.price).toFixed(2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`inventory_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: 'PDF Exported', description: `${filteredProducts.length} products exported successfully` });
  };

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              product.stock_quantity <= product.reorder_level ? 'bg-destructive/10' : 'bg-primary/10'
            )}
          >
            {product.stock_quantity <= product.reorder_level ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Package className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-foreground">{product.sku}</p>
            <p className="text-xs text-muted-foreground">{categoryLabels[product.category] || product.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (product: Product) => (
        <div>
          <p className="font-medium text-foreground">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            {product.color && `Color: ${product.color} • `}
            Unit: {unitLabels[product.unit] || product.unit}
          </p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock Level',
      render: (product: Product) => {
        const stockPercentage = Math.min((product.stock_quantity / (product.reorder_level * 3)) * 100, 100);
        const isLow = product.stock_quantity <= product.reorder_level;
        return (
          <div className="w-40">
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-sm font-medium', isLow ? 'text-destructive' : 'text-foreground')}>
                {product.stock_quantity.toLocaleString()} {unitLabels[product.unit] || product.unit}
              </span>
            </div>
            <Progress
              value={stockPercentage}
              className={cn('h-2', isLow && '[&>div]:bg-destructive')}
            />
            {isLow && (
              <p className="text-xs text-destructive mt-1">
                Below reorder level ({product.reorder_level})
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'prices',
      header: 'Price / Cost',
      render: (product: Product) => (
        <div className="text-sm">
          <span className="font-medium text-foreground">AED {product.price}</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-muted-foreground">AED {product.cost}</span>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Stock Value',
      render: (product: Product) => (
        <span className="font-semibold text-foreground">
          AED {(product.stock_quantity * product.price).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          {product.stock_quantity <= product.reorder_level && (
            <Button size="sm" variant="destructive" className="gap-1">
              <Plus className="h-3 w-3" />
              Reorder
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleEditProduct(product);
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingProduct(product);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <Header title="Inventory" subtitle="Loading..." />
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header
        title="Inventory"
        subtitle={`${filteredProducts.length} products`}
        action={{
          label: 'Add Product',
          onClick: handleAddProduct,
        }}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{products.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{lowStockProducts.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Total Stock Value</p>
            <p className="text-2xl font-bold text-foreground">
              AED {totalStockValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Categories</p>
            <p className="text-2xl font-bold text-foreground">{uniqueCategories.length}</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Low Stock Alert</h3>
            </div>
            <p className="text-sm text-destructive/80">
              {lowStockProducts.length} product(s) are below reorder level:{' '}
              {lowStockProducts.map((p) => p.name).join(', ')}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categoryTabs.map((tab) => (
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
            {/* Hidden file input for CSV import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleCSVImport}
              className="hidden"
            />
            
            {/* Import Button */}
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              title="Import inventory from Excel or CSV file (weekly/monthly updates)"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import Excel/CSV'}
            </Button>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-card rounded-xl p-4 border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Advanced Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Product Name</label>
                <Input
                  placeholder="Filter by name"
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">SKU</label>
                <Input
                  placeholder="Filter by SKU"
                  value={filters.sku}
                  onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Color</label>
                <Input
                  placeholder="Filter by color"
                  value={filters.color}
                  onChange={(e) => setFilters({ ...filters, color: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Min Price (AED)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Max Price (AED)</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Min Stock</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minStock}
                  onChange={(e) => setFilters({ ...filters, minStock: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Max Stock</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxStock}
                  onChange={(e) => setFilters({ ...filters, maxStock: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          emptyMessage="No products found. Add your first product to get started."
        />
      </div>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={editingProduct}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
