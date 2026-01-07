import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies } from '@/hooks/useCompanies';

export interface DashboardStats {
  totalSales: number;
  pendingQuotations: number;
  outstandingPayments: number;
  activeProjects: number;
  conversionRate: number;
  stockAlerts: number;
}

export interface ProjectStatusCount {
  status: string;
  count: number;
}

export interface SalesData {
  month: string;
  revenue: number;
}

export interface RecentProject {
  id: string;
  name: string;
  status: string;
  contractor: { name: string };
  value: number;
  salesManager: string;
  updatedAt: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    pendingQuotations: 0,
    outstandingPayments: 0,
    activeProjects: 0,
    conversionRate: 0,
    stockAlerts: 0,
  });
  const [projectStatusCounts, setProjectStatusCounts] = useState<ProjectStatusCount[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getActiveCompanyDbId, activeCompanyId } = useCompanies();

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const companyDbId = getActiveCompanyDbId();

      // Fetch invoices for total sales and outstanding payments
      let invoicesQuery = supabase.from('invoices').select('total, paid_amount, status, created_at');
      if (companyDbId) {
        invoicesQuery = invoicesQuery.eq('company_id', companyDbId);
      } else {
        invoicesQuery = invoicesQuery.is('company_id', null);
      }
      const { data: invoices } = await invoicesQuery;

      // Fetch quotations for pending count
      let quotationsQuery = supabase.from('quotations').select('status');
      if (companyDbId) {
        quotationsQuery = quotationsQuery.eq('company_id', companyDbId);
      } else {
        quotationsQuery = quotationsQuery.is('company_id', null);
      }
      const { data: quotations } = await quotationsQuery;

      // Fetch projects for active count and status distribution
      let projectsQuery = supabase.from('projects').select('status, name, value, sales_manager, contractor, updated_at, id').order('updated_at', { ascending: false });
      if (companyDbId) {
        projectsQuery = projectsQuery.eq('company_id', companyDbId);
      } else {
        projectsQuery = projectsQuery.is('company_id', null);
      }
      const { data: projects } = await projectsQuery;

      // Fetch products for stock alerts
      let productsQuery = supabase.from('products').select('stock_quantity, reorder_level');
      if (companyDbId) {
        productsQuery = productsQuery.eq('company_id', companyDbId);
      } else {
        productsQuery = productsQuery.is('company_id', null);
      }
      const { data: products } = await productsQuery;

      // Calculate stats
      const totalSales = (invoices || [])
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.total), 0);

      const outstandingPayments = (invoices || [])
        .filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paid_amount)), 0);

      const pendingQuotations = (quotations || [])
        .filter(q => q.status === 'draft' || q.status === 'pending' || q.status === 'sent')
        .length;

      const activeProjects = (projects || [])
        .filter(p => p.status === 'in_progress' || p.status === 'active')
        .length;

      const totalQuotations = (quotations || []).length;
      const approvedQuotations = (quotations || []).filter(q => q.status === 'approved' || q.status === 'accepted').length;
      const conversionRate = totalQuotations > 0 ? Math.round((approvedQuotations / totalQuotations) * 100) : 0;

      const stockAlerts = (products || [])
        .filter(p => p.stock_quantity <= p.reorder_level)
        .length;

      setStats({
        totalSales,
        pendingQuotations,
        outstandingPayments,
        activeProjects,
        conversionRate,
        stockAlerts,
      });

      // Calculate project status counts
      const statusCounts: Record<string, number> = {};
      (projects || []).forEach(p => {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      });
      const statusLabels: Record<string, string> = {
        lead: 'Lead',
        in_progress: 'In Progress',
        active: 'Active',
        completed: 'Completed',
        on_hold: 'On Hold',
        cancelled: 'Cancelled',
      };
      setProjectStatusCounts(
        Object.entries(statusCounts).map(([status, count]) => ({
          status: statusLabels[status] || status,
          count,
        }))
      );

      // Calculate monthly sales data (last 6 months)
      const monthlyData: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleString('default', { month: 'short' });
        monthlyData[key] = 0;
      }
      (invoices || []).forEach(inv => {
        const date = new Date(inv.created_at);
        const key = date.toLocaleString('default', { month: 'short' });
        if (key in monthlyData) {
          monthlyData[key] += Number(inv.total);
        }
      });
      setSalesData(Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue })));

      // Recent projects (top 5)
      setRecentProjects(
        (projects || []).slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          contractor: typeof p.contractor === 'object' && p.contractor ? p.contractor as { name: string } : { name: '' },
          value: Number(p.value),
          salesManager: p.sales_manager || '',
          updatedAt: p.updated_at,
        }))
      );
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getActiveCompanyDbId]);

  useEffect(() => {
    fetchStats();
  }, [user, activeCompanyId]);

  return {
    stats,
    projectStatusCounts,
    salesData,
    recentProjects,
    loading,
    refetch: fetchStats,
  };
}
