'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  UserPlus,
  Mail,
  Phone,
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
  ChefHat,
  Utensils,
  DollarSign,
  Package,
  Settings as SettingsIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/shared/components/ui/switch';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: Array<{
    id: string;
    role_id: string;
    role_name: string;
    role_description: string;
    assigned_at: string;
    valid_until?: string;
  }>;
  status: 'active' | 'inactive';
  createdAt: string;
  permissions: {
    pos: boolean;
    inventory: boolean;
    analytics: boolean;
    settings: boolean;
  };
}

interface DatabaseRole {
  id: string;
  role_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  valid_until?: string;
}

// Role icons mapping
const ROLE_ICONS: { [key: string]: any } = {
  'Owner': Shield,
  'Restaurant Manager': SettingsIcon,
  'Assistant Manager / Shift Lead': SettingsIcon,
  'Chef/Kitchen Manager': ChefHat,
  'Server/Waiter': Users,
  'Bartender/Barback': Utensils,
  'Cashier': DollarSign,
  'Inventory Manager': Package,
  'Delivery Driver': Package,
  'Marketing Manager': SettingsIcon,
  'Accountant/Finance': DollarSign,
  'HR Admin': Users,
  'Employee (App Access)': Users,
};

// Role colors mapping
const ROLE_COLORS: { [key: string]: string } = {
  'Owner': 'bg-red-100 text-red-800',
  'Restaurant Manager': 'bg-purple-100 text-purple-800',
  'Assistant Manager / Shift Lead': 'bg-purple-100 text-purple-800',
  'Chef/Kitchen Manager': 'bg-orange-100 text-orange-800',
  'Server/Waiter': 'bg-blue-100 text-blue-800',
  'Bartender/Barback': 'bg-yellow-100 text-yellow-800',
  'Cashier': 'bg-green-100 text-green-800',
  'Inventory Manager': 'bg-teal-100 text-teal-800',
  'Delivery Driver': 'bg-indigo-100 text-indigo-800',
  'Marketing Manager': 'bg-pink-100 text-pink-800',
  'Accountant/Finance': 'bg-emerald-100 text-emerald-800',
  'HR Admin': 'bg-cyan-100 text-cyan-800',
  'Employee (App Access)': 'bg-gray-100 text-gray-800',
};

const DEFAULT_PERMISSIONS = {
  owner: { pos: true, inventory: true, analytics: true, settings: true },
  manager: { pos: true, inventory: true, analytics: true, settings: true },
  chef: { pos: true, inventory: true, analytics: false, settings: false },
  'kitchen-staff': { pos: true, inventory: false, analytics: false, settings: false },
  waiter: { pos: true, inventory: false, analytics: false, settings: false },
  cashier: { pos: true, inventory: false, analytics: false, settings: false },
  'inventory-manager': { pos: false, inventory: true, analytics: true, settings: false },
};

export default function UserManagementPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<DatabaseRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    selectedRoles: [] as string[],
    password: '',
    permissions: {
      pos: true,
      inventory: false,
      analytics: false,
      settings: false,
    },
  });

  // Load data from database
  useEffect(() => {
    // Check if user is authenticated before loading data
    const sessionToken = localStorage.getItem('ioms_session_token');
    
    if (!sessionToken) {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }
    
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadUsers(), loadRoles()]);
    } catch (error) {
      console.error('Error loading data:', error);
      
      // If it's an authentication error, don't show the error toast
      // as the user will be redirected to login
      if (error instanceof Error && !error.message.includes('401')) {
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const result = await response.json();
      
      if (result.success) {
        setRoles(result.data);
      } else {
        throw new Error(result.error || 'Failed to load roles');
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      throw error;
    }
  };

  const loadUsers = async () => {
    try {
      const sessionToken = localStorage.getItem('ioms_session_token');
      if (!sessionToken) {
        setIsRedirecting(true);
        router.push('/login');
        return;
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
      } else if (response.status === 401) {
        localStorage.removeItem('ioms_session_token');
        setIsRedirecting(true);
        router.push('/login');
        return;
      } else {
        throw new Error(result.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // If it's a network error or other issue, show error but don't redirect
      if (error instanceof Error && error.message.includes('401')) {
        localStorage.removeItem('ioms_session_token');
        router.push('/login');
        return;
      }
      throw error;
    }
  };

  // Helper functions for role management
  const getRoleInfo = (roleName: string) => {
    const role = roles.find(r => r.role_name === roleName);
    if (!role) return { icon: Users, color: 'bg-gray-100 text-gray-800' };
    
    return {
      icon: ROLE_ICONS[roleName] || Users,
      color: ROLE_COLORS[roleName] || 'bg-gray-100 text-gray-800'
    };
  };

  const assignRoleToUser = async (userId: string, roleId: string) => {
    try {
      // Check if user already has Owner role
      const user = users.find(u => u.id === userId);
      if (user?.roles.some(role => role.role_name === 'Owner')) {
        const roleToAdd = roles.find(r => r.id === roleId);
        if (roleToAdd?.role_name !== 'Owner') {
          toast({
            title: 'Warning',
            description: 'Owner users should only have the Owner role. Additional roles are not recommended.',
            variant: 'destructive',
          });
          return;
        }
      }

      const sessionToken = localStorage.getItem('ioms_session_token');
      if (!sessionToken) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ user_id: userId, role_id: roleId }),
      });

      const result = await response.json();
      
      if (result.success) {
        await loadUsers(); // Reload users to get updated roles
        toast({
          title: 'Success',
          description: 'Role assigned successfully',
        });
      } else if (response.status === 401) {
        localStorage.removeItem('ioms_session_token');
        router.push('/login');
        return;
      } else {
        throw new Error(result.error || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const removeRoleFromUser = async (userRoleId: string) => {
    try {
      const sessionToken = localStorage.getItem('ioms_session_token');
      if (!sessionToken) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/user-roles?user_role_id=${userRoleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        await loadUsers(); // Reload users to get updated roles
        toast({
          title: 'Success',
          description: 'Role removed successfully',
        });
      } else if (response.status === 401) {
        localStorage.removeItem('ioms_session_token');
        router.push('/login');
        return;
      } else {
        throw new Error(result.error || 'Failed to remove role');
      }
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    
    const matchesRole = filterRole === 'all' || 
      user.roles.some(role => role.role_name === filterRole);
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.selectedRoles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one role.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First, create the user account
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || 'TempPassword123!', // Generate a temporary password
        }),
      });

      const signupResult = await signupResponse.json();
      
      if (!signupResponse.ok || !signupResult.success) {
        throw new Error(signupResult.error || 'Failed to create user account');
      }

      if (!signupResult.userId) {
        throw new Error('User ID not returned from signup');
      }

      // Then, assign roles to the user
      for (const roleId of formData.selectedRoles) {
        await assignRoleToUser(signupResult.userId, roleId);
      }

      // Reload users to show the new user
      await loadUsers();

      toast({
        title: 'Success',
        description: `User ${formData.name} added successfully!`,
      });

      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add user',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.name || !formData.email || !formData.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.selectedRoles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one role.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get current user roles
      const currentRoleIds = selectedUser.roles.map(role => role.role_id);
      const newRoleIds = formData.selectedRoles;
      
      // Find roles to add and remove
      const rolesToAdd = newRoleIds.filter(roleId => !currentRoleIds.includes(roleId));
      const rolesToRemove = currentRoleIds.filter(roleId => !newRoleIds.includes(roleId));
      
      // Remove roles that are no longer selected
      for (const roleId of rolesToRemove) {
        const userRole = selectedUser.roles.find(role => role.role_id === roleId);
        if (userRole) {
          await removeRoleFromUser(userRole.id);
        }
      }
      
      // Add new roles
      for (const roleId of rolesToAdd) {
        await assignRoleToUser(selectedUser.id, roleId);
      }

      // Reload users to show the updated roles
      await loadUsers();

      toast({
        title: 'Success',
        description: `User ${formData.name} updated successfully!`,
      });

      setShowEditDialog(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.roles.some(role => role.role_name === 'Owner')) {
      toast({
        title: 'Error',
        description: 'Cannot delete owner account.',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      // TODO: Implement user deletion API
      toast({
        title: 'Info',
        description: 'User deletion not yet implemented. This would require a DELETE /api/users endpoint.',
        variant: 'default',
      });
    }
  };

  const handleToggleStatus = (user: User) => {
    if (user.roles.some(role => role.role_name === 'Owner')) {
      toast({
        title: 'Error',
        description: 'Cannot deactivate owner account.',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement user status toggle API
    toast({
      title: 'Info',
      description: 'User status toggle not yet implemented. This would require a PATCH /api/users endpoint.',
      variant: 'default',
    });
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      selectedRoles: user.roles.map(role => role.role_id),
      password: '',
      permissions: user.permissions,
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      selectedRoles: [],
      password: '',
      permissions: {
        pos: true,
        inventory: false,
        analytics: false,
        settings: false,
      },
    });
    setShowPassword(false);
    setShowRoleDropdown(false);
  };

    const handleRoleToggle = (roleId: string, isSelected: boolean) => {
    if (isSelected) {
      setFormData({
        ...formData,
        selectedRoles: [...formData.selectedRoles, roleId],
      });
    } else {
      setFormData({
        ...formData,
        selectedRoles: formData.selectedRoles.filter(id => id !== roleId),
      });
    }
  };

  const handleAddRoleFromDropdown = (roleId: string) => {
    // Check if user already has Owner role and trying to add another role
    const hasOwnerRole = formData.selectedRoles.some(roleId => {
      const role = roles.find(r => r.id === roleId);
      return role?.role_name === 'Owner';
    });
    
    if (hasOwnerRole) {
      toast({
        title: 'Warning',
        description: 'Owner users should only have the Owner role. Additional roles are not recommended.',
        variant: 'destructive',
      });
      setShowRoleDropdown(false);
      return;
    }
    
    if (!formData.selectedRoles.includes(roleId)) {
      setFormData({
        ...formData,
        selectedRoles: [...formData.selectedRoles, roleId],
      });
    }
    setShowRoleDropdown(false);
  };

  const handleRemoveRole = (roleId: string) => {
    setFormData({
      ...formData,
      selectedRoles: formData.selectedRoles.filter(id => id !== roleId),
    });
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/setup')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Setup
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              User Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your restaurant staff and their permissions</p>
          </div>
          <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                name="user-search"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.role_name}>
                    {role.role_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List - Professional Table */}
      <Card className="shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-200">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                <Users className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-base font-bold text-gray-900">Staff Members</span>
              <span className="text-sm font-normal text-gray-500">({filteredUsers.length})</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isRedirecting ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Redirecting to login...</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No users found</p>
              <Button onClick={openAddDialog} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add First User
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => {
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length > 0 ? (
                              user.roles.map(role => {
                                const roleInfo = getRoleInfo(role.role_name);
                                const RoleIcon = roleInfo.icon;
                                const isOwner = role.role_name === 'Owner';
                                return (
                                  <Badge 
                                    key={role.id} 
                                    className={`${roleInfo.color} text-xs font-medium flex items-center gap-1 ${
                                      isOwner ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
                                    }`}
                                    title={isOwner ? 'Owner role - should be the only role for this user' : ''}
                                  >
                                    <RoleIcon className="h-3 w-3" />
                                    {role.role_name}
                                    {isOwner && <span className="ml-1">👑</span>}
                                  </Badge>
                                );
                              })
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600 text-xs font-medium">
                                No Roles
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {user.email ? 'Email provided' : 'No email'}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {user.phone ? 'Phone provided' : 'No phone'}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.pos && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">POS</span>
                            )}
                            {user.permissions.inventory && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Inventory</span>
                            )}
                            {user.permissions.analytics && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Analytics</span>
                            )}
                            {user.permissions.settings && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Settings</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.status === 'active'}
                              onCheckedChange={() => handleToggleStatus(user)}
                              disabled={user.roles.some(role => role.role_name.toLowerCase() === 'owner')}
                              className="scale-75"
                            />
                            <span className={`text-xs font-medium ${
                              user.status === 'active' ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditDialog(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={user.roles.some(role => role.role_name.toLowerCase() === 'owner')}
                              className={`p-2 rounded-lg transition-colors ${
                                user.roles.some(role => role.role_name.toLowerCase() === 'owner') 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={user.roles.some(role => role.role_name.toLowerCase() === 'owner') ? 'Cannot delete owner' : 'Delete User'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="roles">Roles *</Label>
                
                {/* Selected Roles Display */}
                {formData.selectedRoles.length > 0 && (
                  <div className="mt-1 mb-2">
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedRoles.map(roleId => {
                        const role = roles.find(r => r.id === roleId);
                        if (!role) return null;
                        
                        return (
                          <div
                            key={roleId}
                            className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{role.role_name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRole(roleId)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Role Button or Dropdown */}
                {!showRoleDropdown ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRoleDropdown(true)}
                    className="mt-1"
                  >
                    {formData.selectedRoles.length === 0 ? 'Select Role' : 'Add New Role'}
                  </Button>
                ) : (
                  <div className="mt-1">
                    <Select onValueChange={handleAddRoleFromDropdown}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          .filter(role => !formData.selectedRoles.includes(role.id))
                          .map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.role_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRoleDropdown(false)}
                      className="mt-2"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@restaurant.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Permissions</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="perm-pos" className="font-medium">POS Access</Label>
                    <p className="text-xs text-gray-600">Allow access to Point of Sale system</p>
                  </div>
                  <Switch
                    id="perm-pos"
                    checked={formData.permissions.pos}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, pos: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="perm-inventory" className="font-medium">Inventory Management</Label>
                    <p className="text-xs text-gray-600">Allow access to inventory and stock management</p>
                  </div>
                  <Switch
                    id="perm-inventory"
                    checked={formData.permissions.inventory}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, inventory: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="perm-analytics" className="font-medium">Analytics & Reports</Label>
                    <p className="text-xs text-gray-600">Allow access to analytics and reporting</p>
                  </div>
                  <Switch
                    id="perm-analytics"
                    checked={formData.permissions.analytics}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, analytics: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="perm-settings" className="font-medium">System Settings</Label>
                    <p className="text-xs text-gray-600">Allow access to system configuration</p>
                  </div>
                  <Switch
                    id="perm-settings"
                    checked={formData.permissions.settings}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, settings: checked }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-roles">Roles *</Label>
                
                {/* Selected Roles Display */}
                {formData.selectedRoles.length > 0 && (
                  <div className="mt-1 mb-2">
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedRoles.map(roleId => {
                        const role = roles.find(r => r.id === roleId);
                        if (!role) return null;
                        const isOwnerRole = role.role_name === 'Owner';
                        
                        return (
                          <div
                            key={roleId}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                              isOwnerRole 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            <span>{role.role_name}</span>
                            {!isOwnerRole && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRole(roleId)}
                                className="text-purple-600 hover:text-purple-800"
                              >
                                ×
                              </button>
                            )}
                            {isOwnerRole && (
                              <span className="text-xs text-red-600">(Cannot remove)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Role Button or Dropdown */}
                {!showRoleDropdown ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRoleDropdown(true)}
                    className="mt-1"
                  >
                    Add New Role
                  </Button>
                ) : (
                  <div className="mt-1">
                    <Select onValueChange={handleAddRoleFromDropdown}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          .filter(role => !formData.selectedRoles.includes(role.id))
                          .map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.role_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRoleDropdown(false)}
                      className="mt-2"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@restaurant.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Permissions</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-perm-pos" className="font-medium">POS Access</Label>
                    <p className="text-xs text-gray-600">Allow access to Point of Sale system</p>
                  </div>
                  <Switch
                    id="edit-perm-pos"
                    checked={formData.permissions.pos}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, pos: checked }
                    })}
                    disabled={selectedUser?.roles.some(role => role.role_name.toLowerCase() === 'owner')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-perm-inventory" className="font-medium">Inventory Management</Label>
                    <p className="text-xs text-gray-600">Allow access to inventory and stock management</p>
                  </div>
                  <Switch
                    id="edit-perm-inventory"
                    checked={formData.permissions.inventory}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, inventory: checked }
                    })}
                    disabled={selectedUser?.roles.some(role => role.role_name.toLowerCase() === 'owner')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-perm-analytics" className="font-medium">Analytics & Reports</Label>
                    <p className="text-xs text-gray-600">Allow access to analytics and reporting</p>
                  </div>
                  <Switch
                    id="edit-perm-analytics"
                    checked={formData.permissions.analytics}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, analytics: checked }
                    })}
                    disabled={selectedUser?.roles.some(role => role.role_name.toLowerCase() === 'owner')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-perm-settings" className="font-medium">System Settings</Label>
                    <p className="text-xs text-gray-600">Allow access to system configuration</p>
                  </div>
                  <Switch
                    id="edit-perm-settings"
                    checked={formData.permissions.settings}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, settings: checked }
                    })}
                    disabled={selectedUser?.roles.some(role => role.role_name.toLowerCase() === 'owner')}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} className="bg-purple-600 hover:bg-purple-700">
              <Edit className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

