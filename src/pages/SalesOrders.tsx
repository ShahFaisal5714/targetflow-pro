import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { mockSalesOrders } from '@/data/mockData';
import { SalesOrder, SalesOrderStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, ShoppingCart, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusTabs: { key: SalesOrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Completed' },
];

export default function SalesOrders() {
  const [activeTab, setActiveTab] = useState<SalesOrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = mockSalesOrders.filter((order) => {
    const matchesStatus = activeTab === 'all' || order.status === activeTab;
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const calculateDeliveryProgress = (order: SalesOrder) => {
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const deliveredQuantity = order.items.reduce((sum, item) => sum + item.deliveredQuantity, 0);
    return Math.round((deliveredQuantity / totalQuantity) * 100);
  };

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (order: SalesOrder) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <ShoppingCart className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-foreground">{order.id}</p>
            <p className="text-xs text-muted-foreground">From {order.quotationId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'projectName',
      header: 'Project',
      render: (order: SalesOrder) => (
        <div>
          <p className="font-medium text-foreground">{order.projectName}</p>
          <p className="text-sm text-muted-foreground">{order.items.length} items</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: SalesOrder) => <StatusBadge status={order.status} />,
    },
    {
      key: 'delivery',
      header: 'Delivery Progress',
      render: (order: SalesOrder) => {
        const progress = calculateDeliveryProgress(order);
        return (
          <div className="w-40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">
                {order.deliverySchedule.filter((d) => d.status === 'delivered').length}/
                {order.deliverySchedule.length} trips
              </span>
              <span className="text-sm font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        );
      },
    },
    {
      key: 'total',
      header: 'Total',
      render: (order: SalesOrder) => (
        <span className="font-semibold text-foreground">${order.total.toLocaleString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (order: SalesOrder) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1">
            <Truck className="h-3 w-3" />
            Delivery
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
        title="Sales Orders"
        subtitle={`${filteredOrders.length} orders`}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-warning" />
              <p className="text-sm text-muted-foreground">Processing</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {mockSalesOrders.filter((o) => o.status === 'processing').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-info" />
              <p className="text-sm text-muted-foreground">Shipped</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {mockSalesOrders.filter((o) => o.status === 'shipped').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-success" />
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {mockSalesOrders.filter((o) => o.status === 'completed').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Total Value</p>
            <p className="text-2xl font-bold text-foreground">
              ${mockSalesOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}
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
                placeholder="Search orders..."
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
          data={filteredOrders}
          emptyMessage="No sales orders found"
        />
      </div>
    </MainLayout>
  );
}
