import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { mockSalesOrders } from '@/data/mockData';
import { Truck, Package, Calendar, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Deliveries() {
  const { role } = useAuth();
  const canEdit = role !== 'viewer';
  
  const allDeliveries = mockSalesOrders.flatMap((order) =>
    order.deliverySchedule.map((delivery) => ({
      ...delivery,
      orderId: order.id,
      projectName: order.projectName,
      items: delivery.items.map((item) => {
        const orderItem = order.items.find((oi) => oi.productId === item.productId);
        return {
          ...item,
          productName: orderItem?.productName || 'Unknown Product',
        };
      }),
    }))
  );

  const pendingDeliveries = allDeliveries.filter((d) => d.status === 'pending');
  const dispatchedDeliveries = allDeliveries.filter((d) => d.status === 'dispatched');
  const completedDeliveries = allDeliveries.filter((d) => d.status === 'delivered');

  return (
    <MainLayout>
      <Header
        title="Deliveries"
        subtitle={`${allDeliveries.length} total deliveries`}
        action={canEdit ? {
          label: 'New Delivery',
          onClick: () => console.log('Create delivery'),
        } : undefined}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-warning" />
              <p className="text-sm text-warning">Pending</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{pendingDeliveries.length}</p>
          </div>
          <div className="bg-info/10 border border-info/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-info" />
              <p className="text-sm text-info">In Transit</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{dispatchedDeliveries.length}</p>
          </div>
          <div className="bg-success/10 border border-success/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-success" />
              <p className="text-sm text-success">Delivered</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{completedDeliveries.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Total Trips</p>
            <p className="text-2xl font-bold text-foreground">{allDeliveries.length}</p>
          </div>
        </div>

        {/* Delivery Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-foreground">Pending</h3>
              <span className="module-badge bg-warning/10 text-warning">
                {pendingDeliveries.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingDeliveries.map((delivery) => (
                <Card key={delivery.id} className="hover:border-warning/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm text-muted-foreground">{delivery.orderId}</p>
                        <p className="font-medium text-foreground">{delivery.projectName}</p>
                      </div>
                      <StatusBadge status={delivery.status} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      {new Date(delivery.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="space-y-1 mb-3">
                      {delivery.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          • {item.productName} ({item.quantity} units)
                        </p>
                      ))}
                    </div>
                    {canEdit && (
                      <Button size="sm" className="w-full">
                        Schedule Dispatch
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {pendingDeliveries.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No pending deliveries
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* In Transit */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-info" />
              <h3 className="font-semibold text-foreground">In Transit</h3>
              <span className="module-badge bg-info/10 text-info">
                {dispatchedDeliveries.length}
              </span>
            </div>
            <div className="space-y-3">
              {dispatchedDeliveries.map((delivery) => (
                <Card key={delivery.id} className="hover:border-info/30 transition-colors border-info/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm text-muted-foreground">{delivery.orderId}</p>
                        <p className="font-medium text-foreground">{delivery.projectName}</p>
                      </div>
                      <StatusBadge status={delivery.status} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      En route to site
                    </div>
                    <div className="space-y-1 mb-3">
                      {delivery.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          • {item.productName} ({item.quantity} units)
                        </p>
                      ))}
                    </div>
                    {canEdit && (
                      <Button size="sm" variant="outline" className="w-full">
                        Mark as Delivered
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {dispatchedDeliveries.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No deliveries in transit
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Completed */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-foreground">Delivered</h3>
              <span className="module-badge bg-success/10 text-success">
                {completedDeliveries.length}
              </span>
            </div>
            <div className="space-y-3">
              {completedDeliveries.map((delivery) => (
                <Card key={delivery.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm text-muted-foreground">{delivery.orderId}</p>
                        <p className="font-medium text-foreground">{delivery.projectName}</p>
                      </div>
                      <StatusBadge status={delivery.status} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      {new Date(delivery.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="space-y-1">
                      {delivery.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          • {item.productName} ({item.quantity} units)
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {completedDeliveries.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No completed deliveries
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
