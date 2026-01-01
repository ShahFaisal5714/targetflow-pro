import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logError } from '@/lib/logger';
import { Users as UsersIcon, Shield, Clock, Loader2, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AppRole, roleLabels } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import UserFormDialog from '@/components/users/UserFormDialog';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  role: AppRole;
  created_at: string;
}

const roleColors: Record<AppRole, string> = {
  admin: 'bg-destructive/10 text-destructive',
  sales_manager: 'bg-primary/10 text-primary',
  operations: 'bg-success/10 text-success',
  viewer: 'bg-muted text-muted-foreground',
};

const rolePermissions: Record<AppRole, string[]> = {
  admin: ['Full system access', 'User management', 'Settings control'],
  sales_manager: ['Projects & quotations', 'Sales orders', 'Invoices & payments'],
  operations: ['Deliveries', 'Inventory management', 'Projects view'],
  viewer: ['Read-only access', 'View reports', 'Dashboard access'],
};

export default function Users() {
  const { user: currentUser, role: currentUserRole } = useAuth();
  const isAdmin = currentUserRole === 'admin';
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles (admin can see all via RLS policy)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          email: profile.full_name, // We don't have direct access to auth.users email
          role: (userRole?.role as AppRole) || 'viewer',
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      logError('Users.fetchUsers', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (!isAdmin) {
      toast.error("Only admins can change user roles");
      return;
    }
    
    if (userId === currentUser?.id) {
      toast.error("You cannot change your own role");
      return;
    }

    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('Role updated successfully');
    } catch (error) {
      logError('Users.handleRoleChange', error);
      toast.error('Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast.error("Only admins can delete users");
      return;
    }
    
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    setDeletingUserId(userId);
    try {
      // Delete user role first (due to foreign key constraints if any)
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      logError('Users.handleDeleteUser', error);
      toast.error('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateUser = async (data: {
    email: string;
    password: string;
    fullName: string;
    role: AppRole;
  }) => {
    if (!isAdmin) {
      toast.error('Only admins can create users');
      return;
    }

    setIsCreatingUser(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the role if not viewer (default)
        if (data.role !== 'viewer') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: data.role })
            .eq('user_id', authData.user.id);

          if (roleError) throw roleError;
        }

        toast.success('User created successfully');
        setShowAddUserDialog(false);
        fetchUsers();
      }
    } catch (error: any) {
      logError('Users.handleCreateUser', error);
      if (error.message?.includes('already registered')) {
        toast.error('A user with this email already exists');
      } else {
        toast.error('Failed to create user');
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const roleStats = {
    admin: users.filter((u) => u.role === 'admin').length,
    sales: users.filter((u) => u.role === 'sales_manager').length,
    operations: users.filter((u) => u.role === 'operations').length,
    viewer: users.filter((u) => u.role === 'viewer').length,
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header
        title="User Management"
        subtitle={`${users.length} team members`}
        action={
          isAdmin && (
            <Button onClick={() => setShowAddUserDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )
        }
      />

      <UserFormDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onSubmit={handleCreateUser}
        isLoading={isCreatingUser}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
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
              <UsersIcon className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Sales Managers</p>
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

        {/* Role Permissions Overview */}
        <div className="bg-card rounded-xl p-6 border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(roleLabels) as AppRole[]).map((role) => (
              <div key={role} className="p-4 rounded-lg bg-secondary/30">
                <span className={cn('inline-block px-2 py-1 rounded text-xs font-medium mb-2', roleColors[role])}>
                  {roleLabels[role]}
                </span>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {rolePermissions[role].map((perm) => (
                    <li key={perm}>• {perm}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold text-primary">
                            {user.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.user_id === currentUser?.id && '(You)'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className={cn('inline-block px-2 py-1 rounded text-xs font-medium', roleColors[user.role])}>
                          {roleLabels[user.role]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.user_id === currentUser?.id ? (
                          <span className="text-sm text-muted-foreground">Cannot edit own account</span>
                        ) : isAdmin ? (
                          <>
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                              disabled={updatingUserId === user.user_id}
                            >
                              <SelectTrigger className="w-[140px]">
                                {updatingUserId === user.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(roleLabels) as AppRole[]).map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {roleLabels[role]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingUserId === user.user_id}
                                >
                                  {deletingUserId === user.user_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.full_name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">View only</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
