import { ReactNode } from 'react';
import { Bell, Search, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanies } from '@/hooks/useCompanies';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  } | ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const { getActiveCompany } = useCompanies();
  const activeCompany = getActiveCompany();
  const isActionConfig = action && typeof action === 'object' && 'label' in action && 'onClick' in action;

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Active Company Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Building2 className="h-4 w-4" />
            <span className="max-w-[150px] truncate">{activeCompany.name}</span>
          </div>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects, quotations..."
              className="w-72 pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
            />
          </div>

          {/* Notifications */}
          <button className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </button>

          {/* Action Button */}
          {action && (
            isActionConfig ? (
              <Button onClick={(action as { label: string; onClick: () => void }).onClick} className="gap-2">
                <Plus className="h-4 w-4" />
                {(action as { label: string; onClick: () => void }).label}
              </Button>
            ) : (
              <>{action}</>
            )
          )}
        </div>
      </div>
    </header>
  );
}
