import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import { mockProducts } from '@/data/mockData';
import { Product, ProductCategory } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, Package, AlertTriangle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryTabs: { key: ProductCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All Products' },
  { key: 'spc_flooring', label: 'SPC Flooring' },
  { key: 'tile_trims', label: 'Tile Trims' },
  { key: 'wpc_decking', label: 'WPC Decking' },
  { key: 'expansion_joints', label: 'Expansion Joints' },
];

const categoryLabels: Record<ProductCategory, string> = {
  spc_flooring: 'SPC Flooring',
  tile_trims: 'Tile Trims',
  wpc_decking: 'WPC Decking',
  expansion_joints: 'Expansion Joints',
  other: 'Other',
};

const unitLabels: Record<string, string> = {
  sqm: 'sqm',
  pcs: 'pcs',
  lm: 'lm',
  kg: 'kg',
  box: 'box',
};

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory = activeTab === 'all' || product.category === activeTab;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockProducts = mockProducts.filter((p) => p.stock <= p.reorderLevel);
  const totalStockValue = mockProducts.reduce(
    (sum, p) => sum + p.stock * p.prices.project,
    0
  );

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              product.stock <= product.reorderLevel ? 'bg-destructive/10' : 'bg-primary/10'
            )}
          >
            {product.stock <= product.reorderLevel ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Package className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-foreground">{product.sku}</p>
            <p className="text-xs text-muted-foreground">{categoryLabels[product.category]}</p>
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
          <p className="text-sm text-muted-foreground">Unit: {unitLabels[product.unit]}</p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock Level',
      render: (product: Product) => {
        const stockPercentage = Math.min((product.stock / (product.reorderLevel * 3)) * 100, 100);
        const isLow = product.stock <= product.reorderLevel;
        return (
          <div className="w-40">
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-sm font-medium', isLow ? 'text-destructive' : 'text-foreground')}>
                {product.stock.toLocaleString()} {unitLabels[product.unit]}
              </span>
            </div>
            <Progress
              value={stockPercentage}
              className={cn('h-2', isLow && '[&>div]:bg-destructive')}
            />
            {isLow && (
              <p className="text-xs text-destructive mt-1">
                Below reorder level ({product.reorderLevel})
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'prices',
      header: 'Pricing (D/C/P)',
      render: (product: Product) => (
        <div className="text-sm">
          <span className="text-muted-foreground">${product.prices.dealer}</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-muted-foreground">${product.prices.contractor}</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="font-medium text-foreground">${product.prices.project}</span>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Stock Value',
      render: (product: Product) => (
        <span className="font-semibold text-foreground">
          ${(product.stock * product.prices.project).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          {product.stock <= product.reorderLevel && (
            <Button size="sm" variant="destructive" className="gap-1">
              <Plus className="h-3 w-3" />
              Reorder
            </Button>
          )}
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <Header
        title="Inventory"
        subtitle={`${filteredProducts.length} products`}
        action={{
          label: 'Add Product',
          onClick: () => console.log('Add product'),
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
            <p className="text-2xl font-bold text-foreground">{mockProducts.length}</p>
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
              ${totalStockValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Categories</p>
            <p className="text-2xl font-bold text-foreground">5</p>
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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          emptyMessage="No products found"
        />
      </div>
    </MainLayout>
  );
}
