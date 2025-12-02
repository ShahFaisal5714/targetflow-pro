import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  CreditCard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import targetLogo from '@/assets/target-logo.jpg';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Quotations', href: '/quotations', icon: FileText },
  { name: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
  { name: 'Deliveries', href: '/deliveries', icon: Truck },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img 
            src={targetLogo} 
            alt="Target Specialties Logo" 
            className="h-10 w-10 object-contain rounded-lg"
          />
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-sidebar-foreground">Target</h1>
              <p className="text-xs text-sidebar-foreground/60">Specialties</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-sidebar-primary')} />
                    {!collapsed && (
                      <span className="text-sm font-medium animate-fade-in">{item.name}</span>
                    )}
                    {isActive && (
                      <div className="absolute left-0 h-8 w-1 rounded-r-full bg-sidebar-primary" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-foreground">JD</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p className="text-sm font-medium text-sidebar-foreground">John Doe</p>
              <p className="text-xs text-sidebar-foreground/60">Sales Manager</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
