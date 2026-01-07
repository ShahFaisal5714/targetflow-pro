import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import SalesChart from '@/components/dashboard/SalesChart';
import ProjectsOverview from '@/components/dashboard/ProjectsOverview';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TopProducts from '@/components/dashboard/TopProducts';
import AlertsWidget from '@/components/dashboard/AlertsWidget';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign,
  FileText,
  CreditCard,
  FolderKanban,
  TrendingUp,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const { stats, projectStatusCounts, salesData, recentProjects, loading } = useDashboardStats();
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `AED ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `AED ${(value / 1000).toFixed(0)}K`;
    }
    return `AED ${value.toFixed(0)}`;
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  return (
    <MainLayout>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}! Here's your business overview.`}
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                title="Total Sales"
                value={formatCurrency(stats.totalSales)}
                icon={<DollarSign className="h-6 w-6 text-primary" />}
                variant="accent"
              />
              <StatCard
                title="Pending Quotations"
                value={stats.pendingQuotations}
                icon={<FileText className="h-6 w-6 text-warning" />}
              />
              <StatCard
                title="Outstanding"
                value={formatCurrency(stats.outstandingPayments)}
                icon={<CreditCard className="h-6 w-6 text-destructive" />}
              />
              <StatCard
                title="Active Projects"
                value={stats.activeProjects}
                icon={<FolderKanban className="h-6 w-6 text-info" />}
              />
              <StatCard
                title="Conversion Rate"
                value={`${stats.conversionRate}%`}
                icon={<TrendingUp className="h-6 w-6 text-success" />}
              />
              <StatCard
                title="Stock Alerts"
                value={stats.stockAlerts}
                icon={<AlertTriangle className="h-6 w-6 text-warning" />}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SalesChart data={salesData} />
              </div>
              <ProjectsOverview data={projectStatusCounts} />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentProjects projects={recentProjects} />
              </div>
              <div className="space-y-6">
                <TopProducts />
                <AlertsWidget />
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
