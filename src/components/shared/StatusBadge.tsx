import { cn } from '@/lib/utils';

type StatusType = 
  | 'lead' | 'active' | 'quoted' | 'in_progress' | 'delivered' | 'closed'
  | 'draft' | 'submitted' | 'approved' | 'rejected'
  | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed'
  | 'sent' | 'partial' | 'paid' | 'overdue'
  | 'dispatched';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Project statuses
  lead: { label: 'Lead', className: 'bg-info/10 text-info' },
  active: { label: 'Active', className: 'bg-primary/10 text-primary' },
  quoted: { label: 'Quoted', className: 'bg-warning/10 text-warning' },
  in_progress: { label: 'In Progress', className: 'bg-info/10 text-info' },
  delivered: { label: 'Delivered', className: 'bg-success/10 text-success' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
  
  // Quotation statuses
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Submitted', className: 'bg-info/10 text-info' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  
  // Sales Order statuses
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning' },
  confirmed: { label: 'Confirmed', className: 'bg-info/10 text-info' },
  processing: { label: 'Processing', className: 'bg-primary/10 text-primary' },
  shipped: { label: 'Shipped', className: 'bg-info/10 text-info' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success' },
  
  // Invoice statuses
  sent: { label: 'Sent', className: 'bg-info/10 text-info' },
  partial: { label: 'Partial', className: 'bg-warning/10 text-warning' },
  paid: { label: 'Paid', className: 'bg-success/10 text-success' },
  overdue: { label: 'Overdue', className: 'bg-destructive/10 text-destructive' },
  
  // Delivery statuses
  dispatched: { label: 'Dispatched', className: 'bg-info/10 text-info' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  
  return (
    <span className={cn('module-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
