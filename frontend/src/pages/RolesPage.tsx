import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  Alert,
  Checkbox,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService, permissionsService } from '../api/services';
import { Role, Permission } from '../api/types';

// Helper function to group permissions by category
interface PermissionGroup {
  category: string;
  permissions: Permission[];
}

const groupPermissionsByCategory = (permissions: Permission[]): PermissionGroup[] => {
  const groups: Record<string, Permission[]> = {};

  permissions.forEach(permission => {
    // Extract category from permission value (e.g., "view_users" -> "users")
    const category = permission.value.split('_').slice(1).join('_') || 'general';

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(permission);
  });

  // Convert to array and sort by category name
  return Object.keys(groups)
    .sort()
    .map(category => ({
      category,
      permissions: groups[category].sort((a, b) => a.name.localeCompare(b.name))
    }));
};

// Helper function to format category name
const formatCategoryName = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Form data type
interface RoleFormData {
  name: string;
  description: string;
  permissions: number[];
}

const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await rolesService.getRoles();
      return response.data;
    },
  });

  // Fetch permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await permissionsService.getPermissions();
      return response.data;
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: RoleFormData) => {
      console.log('Creating role with form data:', roleData);
      // First create the role with basic info
      const response = await rolesService.createRole({
        name: roleData.name,
        description: roleData.description
      });
      console.log('Role created:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to create role');
    },
  });

  // Assign permissions mutation
  const assignPermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) => {
      console.log('Assigning permissions:', { roleId, permissionIds });
      const response = await rolesService.assignPermissions(roleId, permissionIds);
      console.log('Permissions assigned:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to assign permissions');
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, roleData }: { id: number; roleData: RoleFormData }) => {
      console.log('Updating role with form data:', { id, roleData });
      // First update the role with basic info
      const response = await rolesService.updateRole(id, {
        name: roleData.name,
        description: roleData.description
      });
      console.log('Role updated:', response);

      // Then assign permissions
      if (roleData.permissions.length > 0) {
        await assignPermissionsMutation.mutateAsync({
          roleId: id,
          permissionIds: roleData.permissions
        });
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update role');
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      await rolesService.deleteRole(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to delete role');
    },
  });

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions.map(p => p.id),
      });
    } else {
      setSelectedRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedRole) {
        await updateRoleMutation.mutateAsync({ id: selectedRole.id, roleData: formData });
      } else {
        // Create role first
        const createResponse = await createRoleMutation.mutateAsync(formData);

        // Then assign permissions if any are selected
        if (formData.permissions.length > 0) {
          await assignPermissionsMutation.mutateAsync({
            roleId: createResponse.data.id,
            permissionIds: formData.permissions
          });
        }
      }
    } catch (error: any) {
      console.error('Operation failed:', error);
      setError(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate(id);
    }
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Role Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {role.permissions.map((permission) => (
                      <Chip
                        key={permission.id}
                        label={permission.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(role)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(role.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{selectedRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Role Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Permissions
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
                  {permissions && groupPermissionsByCategory(permissions).map((group) => (
                    <Box key={group.category} mb={2}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {formatCategoryName(group.category)}
                      </Typography>
                      <Grid container spacing={1}>
                        {group.permissions.map((permission) => (
                          <Grid item xs={12} sm={6} md={4} key={permission.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.permissions.includes(permission.id)}
                                  onChange={(e) => {
                                    const newPermissions = e.target.checked
                                      ? [...formData.permissions, permission.id]
                                      : formData.permissions.filter(id => id !== permission.id);
                                    setFormData({ ...formData, permissions: newPermissions });
                                  }}
                                />
                              }
                              label={
                                <Tooltip title={permission.description || ''} placement="top">
                                  <Typography variant="body2">{permission.name}</Typography>
                                </Tooltip>
                              }
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedRole ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RolesPage;
