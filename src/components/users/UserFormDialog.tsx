import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppRole, roleLabels } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters');
const emailSchema = z.string().trim().email('Please enter a valid email address').max(255, 'Email must not exceed 255 characters');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password must not exceed 128 characters');
const avatarUrlSchema = z.string().max(500, 'Avatar URL must not exceed 500 characters').optional().or(z.literal(''));

interface UserFormData {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
}

interface EditUserFormData {
  fullName: string;
  avatarUrl: string;
  role: AppRole;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  editData?: {
    fullName: string;
    avatarUrl: string | null;
    role: AppRole;
  };
  onEditSubmit?: (data: EditUserFormData) => Promise<void>;
}

export default function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  mode = 'create',
  editData,
  onEditSubmit,
}: UserFormDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    fullName: '',
    role: 'viewer',
  });
  
  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    fullName: '',
    avatarUrl: '',
    role: 'viewer',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCreateForm = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      nameSchema.parse(formData.fullName);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.fullName = e.errors[0].message;
    }
    
    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
    }
    
    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.password = e.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      nameSchema.parse(editFormData.fullName);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.fullName = e.errors[0].message;
    }
    
    try {
      avatarUrlSchema.parse(editFormData.avatarUrl);
    } catch (e) {
      if (e instanceof z.ZodError) newErrors.avatarUrl = e.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (open) {
      if (mode === 'create') {
        setFormData({
          email: '',
          password: '',
          fullName: '',
          role: 'viewer',
        });
        setShowPassword(false);
      } else if (editData) {
        setEditFormData({
          fullName: editData.fullName,
          avatarUrl: editData.avatarUrl || '',
          role: editData.role,
        });
      }
    }
  }, [open, mode, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (mode === 'create') {
      if (!validateCreateForm()) return;
      await onSubmit({
        ...formData,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      });
    } else if (onEditSubmit) {
      if (!validateEditForm()) return;
      await onEditSubmit({
        ...editFormData,
        fullName: editFormData.fullName.trim(),
        avatarUrl: editFormData.avatarUrl.trim(),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new user account. They will receive login credentials.'
              : 'Update user profile information.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="John Doe"
                  maxLength={100}
                  required
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  maxLength={255}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    minLength={6}
                    maxLength={128}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as AppRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(roleLabels) as AppRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="editFullName">Full Name</Label>
                <Input
                  id="editFullName"
                  value={editFormData.fullName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, fullName: e.target.value })
                  }
                  placeholder="John Doe"
                  maxLength={100}
                  required
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={editFormData.avatarUrl}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, avatarUrl: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg"
                  maxLength={500}
                />
                {errors.avatarUrl && (
                  <p className="text-sm text-destructive">{errors.avatarUrl}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, role: value as AppRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(roleLabels) as AppRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Create User' : 'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
