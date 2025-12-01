import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import { mockUsers } from '@/data/mockData';
import { User, UserRole } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users as UsersIcon, Shield, Clock, MoreVertical } from 'lucide-react';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  accountant: 'Accountant',
  warehouse: 'Warehouse',
  management: 'Management',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-destructive/10 text-destructive',
  sales_manager: 'bg-primary/10 text-primary',
  sales_executive: 'bg-info/10 text-info',
  accountant: 'bg-success/10 text-success',
  warehouse: 'bg-warning/10 text-warning',
  management: 'bg-accent/10 text-accent',
};

export default function Users() {
  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-semibold text-primary">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className={cn('module-badge', roleColors[user.role])}>
            {roleLabels[user.role]}
          </span>
        </div>
      ),
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      render: (user: User) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {new Date(user.lastActive).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm text-success">Active</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const roleStats = {
    admin: mockUsers.filter((u) => u.role === 'admin').length,
    sales: mockUsers.filter((u) => u.role === 'sales_manager' || u.role === 'sales_executive').length,
    operations: mockUsers.filter((u) => u.role === 'accountant' || u.role === 'warehouse').length,
  };

  return (
    <MainLayout>
      <Header
        title="Users"
        subtitle={`${mockUsers.length} team members`}
        action={{
          label: 'Add User',
          onClick: () => console.log('Add user'),
        }}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{mockUsers.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Administrators</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{roleStats.admin}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="h-5 w-5 text-info" />
              <p className="text-sm text-muted-foreground">Sales Team</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{roleStats.sales}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="h-5 w-5 text-success" />
              <p className="text-sm text-muted-foreground">Operations</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{roleStats.operations}</p>
          </div>
        </div>

        {/* Roles Overview */}
        <div className="bg-card rounded-xl p-6 border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Role Permissions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(roleLabels).map(([role, label]) => (
              <div key={role} className="p-4 rounded-lg bg-secondary/30">
                <span className={cn('module-badge mb-2', roleColors[role as UserRole])}>
                  {label}
                </span>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {role === 'admin' && (
                    <>
                      <li>• Full system access</li>
                      <li>• User management</li>
                      <li>• Settings control</li>
                    </>
                  )}
                  {role === 'sales_manager' && (
                    <>
                      <li>• Projects & quotations</li>
                      <li>• Sales orders</li>
                      <li>• Team oversight</li>
                    </>
                  )}
                  {role === 'sales_executive' && (
                    <>
                      <li>• Own projects</li>
                      <li>• Create quotations</li>
                      <li>• Limited reports</li>
                    </>
                  )}
                  {role === 'accountant' && (
                    <>
                      <li>• Invoices & payments</li>
                      <li>• Financial reports</li>
                      <li>• Credit management</li>
                    </>
                  )}
                  {role === 'warehouse' && (
                    <>
                      <li>• Inventory access</li>
                      <li>• Delivery orders</li>
                      <li>• Stock management</li>
                    </>
                  )}
                  {role === 'management' && (
                    <>
                      <li>• Dashboard only</li>
                      <li>• View reports</li>
                      <li>• Analytics access</li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <DataTable columns={columns} data={mockUsers} emptyMessage="No users found" />
      </div>
    </MainLayout>
  );
}
