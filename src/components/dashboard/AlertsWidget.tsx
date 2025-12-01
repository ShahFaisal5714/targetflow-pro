import { AlertTriangle, Clock, Package, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const alerts = [
  {
    id: 1,
    type: 'stock',
    title: 'Low Stock Alert',
    description: 'Luxury SPC - Walnut below reorder level (320/500)',
    icon: Package,
    severity: 'warning',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'payment',
    title: 'Payment Overdue',
    description: 'Invoice INV-2024-0001 - Marina Properties Group',
    icon: CreditCard,
    severity: 'error',
    time: '1 day ago',
  },
  {
    id: 3,
    type: 'quotation',
    title: 'Quotation Expiring',
    description: 'QT-2024-003 expires in 3 days',
    icon: Clock,
    severity: 'warning',
    time: '3 days left',
  },
  {
    id: 4,
    type: 'stock',
    title: 'Low Stock Alert',
    description: 'Expansion Joint Cover HD below reorder level',
    icon: Package,
    severity: 'warning',
    time: '5 hours ago',
  },
];

const severityStyles = {
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
};

export default function AlertsWidget() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="text-lg font-semibold text-foreground">Alerts & Reminders</h3>
        </div>
        <span className="module-badge bg-destructive/10 text-destructive">
          {alerts.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border animate-slide-up',
              severityStyles[alert.severity as keyof typeof severityStyles]
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <alert.icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{alert.title}</p>
              <p className="text-sm text-muted-foreground truncate">{alert.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
