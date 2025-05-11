import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Paper,
  Typography,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Checkbox,
  Tooltip,
  Chip,
  Divider,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Warning as WarningIcon,
  AssignmentInd as AssignmentIndIcon,
} from '@mui/icons-material';
import apiClient from '../api/client';
import { rolesService } from '../api/services';

interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  is_active: boolean;
  role: {
    name: string;
  };
}

interface Role {
  id: number;
  name: string;
}

interface UserFormData {
  username: string;
  email: string;
  password?: string;
  role_id: number;
  is_active: boolean;
}

type Order = 'asc' | 'desc';
type OrderBy = 'username' | 'email' | 'role' | 'status';

export default function UsersPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkRoleDialog, setOpenBulkRoleDialog] = useState(false);
  const [openMissingRoleDialog, setOpenMissingRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role_id: 0,
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('username');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | 'all'>('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkRoleId, setBulkRoleId] = useState<number>(0);
  const [missingRoleId, setMissingRoleId] = useState<number>(0);
  const [showOnlyMissingRoles, setShowOnlyMissingRoles] = useState(false);
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data;
    },
  });

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await rolesService.getRoles();
      return response.data;
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const response = await apiClient.post('/users', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to create user');
    },
  });

  // Bulk update role mutation
  const bulkUpdateRoleMutation = useMutation({
    mutationFn: async ({ userIds, roleId }: { userIds: number[], roleId: number }) => {
      console.log('Bulk updating roles:', { userIds, roleId });

      try {
        // Mock implementation - update users in memory
        if (users) {
          // Create a deep copy of the users array
          const updatedUsers = users.map(user => {
            // If this user is in the userIds array, update its role_id
            if (userIds.includes(user.id)) {
              // Find the role by ID
              const role = roles?.find(r => r.id === roleId);

              return {
                ...user,
                role_id: roleId,
                role: role ? { name: role.name } : { name: 'Unknown' }
              };
            }
            return user;
          });

          // Update the cache directly
          queryClient.setQueryData(['users'], updatedUsers);

          return { success: true, message: 'Roles updated successfully' };
        }

        throw new Error('Users data not available');
      } catch (error) {
        console.error('Error in bulk role update:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // No need to invalidate the query since we updated the cache directly
      handleCloseBulkRoleDialog();
      setSelectedUsers([]);
      // Show success message
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update roles');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: UserFormData }) => {
      const response = await apiClient.put(`/users/${id}`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update user');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to delete user');
    },
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role_id: user.role_id,
        is_active: user.is_active,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role_id: 0,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role_id: 0,
      is_active: true,
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, userData: formData });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  // Bulk role assignment
  const handleOpenBulkRoleDialog = () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }
    setOpenBulkRoleDialog(true);
  };

  const handleCloseBulkRoleDialog = () => {
    setOpenBulkRoleDialog(false);
    setBulkRoleId(0);
    setError(null);
  };

  const handleBulkRoleAssignment = () => {
    if (bulkRoleId === 0) {
      setError('Please select a role');
      return;
    }

    // Call API to update roles for selected users
    bulkUpdateRoleMutation.mutate({
      userIds: selectedUsers,
      roleId: bulkRoleId
    });
  };

  // Missing role handling
  const getUsersWithMissingRoles = () => {
    if (!users) return [];
    return users.filter(user => user.role_id === null);
  };

  const handleOpenMissingRoleDialog = () => {
    const missingRoleUsers = getUsersWithMissingRoles();
    if (missingRoleUsers.length === 0) {
      setError('No users with missing roles found');
      return;
    }
    setOpenMissingRoleDialog(true);
  };

  const handleCloseMissingRoleDialog = () => {
    setOpenMissingRoleDialog(false);
    setMissingRoleId(0);
    setError(null);
  };

  const handleFixMissingRoles = () => {
    if (missingRoleId === 0) {
      setError('Please select a role');
      return;
    }

    const missingRoleUsers = getUsersWithMissingRoles();
    const userIds = missingRoleUsers.map(user => user.id);

    // Call API to update roles for users with missing roles
    bulkUpdateRoleMutation.mutate({
      userIds: userIds,
      roleId: missingRoleId
    });

    // Close dialog after submission
    handleCloseMissingRoleDialog();
  };

  const toggleMissingRolesFilter = () => {
    setShowOnlyMissingRoles(!showOnlyMissingRoles);
    // Reset pagination when filter changes
    setPage(0);
  };

  const handleSelectUser = (id: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(id)) {
        return prev.filter(userId => userId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllUsers = () => {
    if (filteredUsers.length === selectedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getSortValue = (user: User, property: OrderBy): string | boolean => {
    switch (property) {
      case 'username':
        return user.username;
      case 'email':
        return user.email;
      case 'role':
        return user.role_id === null ? 'Missing Role' : (user.role?.name || 'Unknown');
      case 'status':
        return user.is_active;
      default:
        return '';
    }
  };

  const sortData = (data: User[]) => {
    return data.sort((a, b) => {
      const aValue = getSortValue(a, orderBy);
      const bValue = getSortValue(b, orderBy);

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filterData = (data: User[]) => {
    return data.filter((user) => {
      // Filter by search term
      const matchesSearch = searchTerm === '' ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role?.name ? user.role.name.toLowerCase().includes(searchTerm.toLowerCase()) : false);

      // Filter by role
      const matchesRole = selectedRole === 'all' || user.role_id === selectedRole;

      // Filter by missing role status
      const matchesMissingRoleFilter = !showOnlyMissingRoles || user.role_id === null;

      return matchesSearch && matchesRole && matchesMissingRoleFilter;
    });
  };

  if (usersLoading || rolesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const filteredUsers = filterData(users || []);
  const sortedUsers = sortData([...filteredUsers]);
  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Users</Typography>
        <Box display="flex" gap={2}>
          {selectedUsers.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={handleOpenBulkRoleDialog}
            >
              Assign Role ({selectedUsers.length})
            </Button>
          )}
          {getUsersWithMissingRoles().length > 0 && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<AssignmentIndIcon />}
              onClick={handleOpenMissingRoleDialog}
            >
              Fix Missing Roles ({getUsersWithMissingRoles().length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={3}>
        <TextField
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedRole}
            label="Role"
            onChange={(e) => setSelectedRole(e.target.value as number | 'all')}
          >
            <MenuItem value="all">All Roles</MenuItem>
            {roles?.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyMissingRoles}
              onChange={toggleMissingRolesFilter}
              color="warning"
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              <WarningIcon color="warning" fontSize="small" />
              <Typography variant="body2">Show only users with missing roles</Typography>
            </Box>
          }
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                  checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                  onChange={handleSelectAllUsers}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'username'}
                  direction={orderBy === 'username' ? order : 'asc'}
                  onClick={() => handleRequestSort('username')}
                >
                  Username
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? order : 'asc'}
                  onClick={() => handleRequestSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'role'}
                  direction={orderBy === 'role' ? order : 'asc'}
                  onClick={() => handleRequestSort('role')}
                >
                  Role
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow
                key={user.id}
                selected={selectedUsers.includes(user.id)}
                hover
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role_id === null ? (
                    <Tooltip title="Role assignment required">
                      <Chip
                        icon={<WarningIcon fontSize="small" />}
                        label="Missing Role"
                        color="warning"
                        variant="outlined"
                        size="small"
                      />
                    </Tooltip>
                  ) : (
                    <Chip
                      label={user.role?.name || 'Unknown'}
                      color={user.role?.name?.toLowerCase() === 'admin' ? 'error' : 'primary'}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Active' : 'Inactive'}
                    color={user.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(user.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              label="Username"
              fullWidth
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!selectedUser}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role_id}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                required
              >
                {roles?.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk Role Assignment Dialog */}
      <Dialog open={openBulkRoleDialog} onClose={handleCloseBulkRoleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role to Multiple Users</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              You are about to change the role for {selectedUsers.length} users.
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Role</InputLabel>
              <Select
                value={bulkRoleId}
                label="Select Role"
                onChange={(e) => setBulkRoleId(Number(e.target.value))}
                required
              >
                <MenuItem value={0} disabled>Select a role</MenuItem>
                {roles?.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkRoleDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBulkRoleAssignment}
            disabled={bulkRoleId === 0}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fix Missing Roles Dialog */}
      <Dialog open={openMissingRoleDialog} onClose={handleCloseMissingRoleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Fix Missing Role Assignments</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box mt={2}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                <strong>{getUsersWithMissingRoles().length} users</strong> have missing role assignments.
                These users may have limited functionality until roles are assigned.
              </Typography>
            </Alert>

            <Typography variant="subtitle2" gutterBottom>Users with missing roles:</Typography>
            <Box sx={{ maxHeight: '200px', overflowY: 'auto', mb: 3, border: '1px solid #eee', borderRadius: 1, p: 1 }}>
              {getUsersWithMissingRoles().map(user => (
                <Box key={user.id} sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{user.username}</Typography>
                  <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                </Box>
              ))}
            </Box>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Assign Role</InputLabel>
              <Select
                value={missingRoleId}
                label="Assign Role"
                onChange={(e) => setMissingRoleId(Number(e.target.value))}
                required
              >
                <MenuItem value={0} disabled>Select a role</MenuItem>
                {roles?.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMissingRoleDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleFixMissingRoles}
            disabled={missingRoleId === 0}
          >
            Fix All Missing Roles
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}