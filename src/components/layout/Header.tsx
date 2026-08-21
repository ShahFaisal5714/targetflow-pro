import { ReactNode } from 'react';
import { Bell, Plus, Building2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompanies } from '@/hooks/useCompanies';
import { useMobileNav } from './MobileNavContext';
import GlobalSearch from './GlobalSearch';

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
  const { setOpen } = useMobileNav();
  const activeCompany = getActiveCompany();
  const isActionConfig = action && typeof action === 'object' && 'label' in action && 'onClick' in action;

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Active Company Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Building2 className="h-4 w-4" />
            <span className="max-w-[150px] truncate">{activeCompany.name}</span>
          </div>

          {/* Global Search */}
          <GlobalSearch />

          {/* Notifications */}
          <button className="relative hidden sm:flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary transition-colors">
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
