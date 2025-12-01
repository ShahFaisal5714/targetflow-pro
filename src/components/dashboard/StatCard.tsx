import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent';
}

export default function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all duration-300 hover:shadow-lg animate-scale-in',
        variant === 'accent'
          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
          : 'bg-card border border-border/50 hover:border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              variant === 'accent' ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.value}%
              </span>
              <span
                className={cn(
                  'text-sm',
                  variant === 'accent' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                )}
              >
                vs last month
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            variant === 'accent' ? 'bg-white/20' : 'bg-primary/10'
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
