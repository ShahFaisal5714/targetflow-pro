import { ReactNode, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface FilterStatusOption {
  key: string;
  label: string;
}

interface FilterSheetProps {
  /** Number of filters currently applied (drives the badge). */
  activeCount?: number;
  onClear?: () => void;
  title?: string;
  description?: string;
  /** Optional status/category pills rendered at the top of the sheet. */
  statusLabel?: string;
  statusOptions?: FilterStatusOption[];
  activeStatus?: string;
  onStatusChange?: (key: string) => void;
  children?: ReactNode;
}

/**
 * Touch-friendly filter sheet used by the list pages.
 * Advanced filters collapse into a bottom sheet so they stay usable on mobile.
 */
export default function FilterSheet({
  activeCount = 0,
  onClear,
  title = 'Filters',
  description,
  statusLabel = 'Status',
  statusOptions,
  activeStatus,
  onStatusChange,
  children,
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant={activeCount > 0 ? 'default' : 'outline'}
          size="icon"
          className="relative min-h-11 min-w-11"
          aria-label={`Open filters${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
        >
          <Filter className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl sm:max-h-[80vh]"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description || 'Refine the list. Filters apply immediately.'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6 [&_input]:min-h-11 [&_button[role=combobox]]:min-h-11">
          {statusOptions && statusOptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{statusLabel}</p>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={activeStatus === option.key}
                    onClick={() => onStatusChange?.(option.key)}
                    className={cn(
                      'min-h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      activeStatus === option.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {children}

          <div className="flex flex-col-reverse gap-2 pb-2 sm:flex-row sm:justify-end">
            {onClear && (
              <Button type="button" variant="outline" className="min-h-11" onClick={onClear}>
                <X className="mr-2 h-4 w-4" />
                Clear all
              </Button>
            )}
            <Button type="button" className="min-h-11" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
