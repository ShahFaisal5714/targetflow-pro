import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import SalesChart from '@/components/dashboard/SalesChart';
import ProjectsOverview from '@/components/dashboard/ProjectsOverview';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TopProducts from '@/components/dashboard/TopProducts';
import AlertsWidget from '@/components/dashboard/AlertsWidget';
import { mockDashboardStats } from '@/data/mockData';
import {
  DollarSign,
  FileText,
  CreditCard,
  FolderKanban,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `AED ${(value / 1000000).toFixed(1)}M`;
    }
    return `AED ${(value / 1000).toFixed(0)}K`;
  };

  return (
    <MainLayout>
      <Header
        title="Dashboard"
        subtitle="Welcome back! Here's your business overview."
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Sales"
            value={formatCurrency(mockDashboardStats.totalSales)}
            icon={<DollarSign className="h-6 w-6 text-primary" />}
            trend={{ value: 12.5, isPositive: true }}
            variant="accent"
          />
          <StatCard
            title="Pending Quotations"
            value={mockDashboardStats.pendingQuotations}
            icon={<FileText className="h-6 w-6 text-warning" />}
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(mockDashboardStats.outstandingPayments)}
            icon={<CreditCard className="h-6 w-6 text-destructive" />}
          />
          <StatCard
            title="Active Projects"
            value={mockDashboardStats.activeProjects}
            icon={<FolderKanban className="h-6 w-6 text-info" />}
          />
          <StatCard
            title="Conversion Rate"
            value={`${mockDashboardStats.conversionRate}%`}
            icon={<TrendingUp className="h-6 w-6 text-success" />}
            trend={{ value: 5.2, isPositive: true }}
          />
          <StatCard
            title="Stock Alerts"
            value={mockDashboardStats.stockAlerts}
            icon={<AlertTriangle className="h-6 w-6 text-warning" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <ProjectsOverview />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentProjects />
          </div>
          <div className="space-y-6">
            <TopProducts />
            <AlertsWidget />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
