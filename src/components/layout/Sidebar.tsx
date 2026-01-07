import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth, roleLabels, getRolesForPath } from '@/contexts/AuthContext';
import { useCompanies } from '@/hooks/useCompanies';
import {
  LayoutDashboard,
  FolderKanban,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  CreditCard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import targetLogo from '@/assets/target-logo.jpg';
import alhadafLogo from '@/assets/alhadaf-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
  { name: 'Delivery Orders', href: '/delivery-orders', icon: Truck },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, role, signOut, hasAccess } = useAuth();
  const { activeDisplayId } = useCompanies();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    const allowedRoles = getRolesForPath(item.href);
    if (allowedRoles.length === 0) return true;
    return hasAccess(allowedRoles);
  });

  // Get the appropriate logo and company name based on active company display ID
  const isAlhadaf = activeDisplayId === 'alhadaf-projects';
  const currentLogo = isAlhadaf ? alhadafLogo : targetLogo;
  const companyDisplayName = isAlhadaf ? 'Al Hadaf' : 'Target';
  const companySubtitle = isAlhadaf ? 'Al Kabeer' : 'Specialties';

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
          <div className={`${isAlhadaf ? 'h-10 w-10 bg-white rounded-lg flex items-center justify-center' : ''}`}>
            <img 
              src={currentLogo} 
              alt={`${companyDisplayName} Logo`} 
              className={isAlhadaf ? 'h-8 w-8 object-contain' : 'h-10 w-10 object-contain rounded-lg'}
            />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-sidebar-foreground">{companyDisplayName}</h1>
              <p className="text-xs text-sidebar-foreground/60">{companySubtitle}</p>
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
          {filteredNavigation.map((item) => (
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-sidebar-accent/50 rounded-lg p-2 transition-colors">
              <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </span>
              </div>
              {!collapsed && (
                <div className="animate-fade-in text-left min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60">
                    {role ? roleLabels[role] : 'Loading...'}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{role ? roleLabels[role] : ''}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
