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
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Store as StoreIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import apiClient from '../api/client';
import { PageContainer, ContentSection } from '../components/ui';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
}

interface BranchFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
}

type Order = 'asc' | 'desc';
type OrderBy = 'name' | 'address' | 'phone' | 'email' | 'status';

export default function BranchesPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await apiClient.get('/branches');
      return response.data;
    },
  });

  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: async (branchData: BranchFormData) => {
      const response = await apiClient.post('/branches', branchData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to create branch');
    },
  });

  // Update branch mutation
  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, branchData }: { id: number; branchData: BranchFormData }) => {
      const response = await apiClient.put(`/branches/${id}`, branchData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update branch');
    },
  });

  // Delete branch mutation
  const deleteBranchMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to delete branch');
    },
  });

  const handleOpenDialog = (branch?: Branch) => {
    if (branch) {
      setSelectedBranch(branch);
      setFormData({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        is_active: branch.is_active,
      });
    } else {
      setSelectedBranch(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBranch(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      is_active: true,
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBranch) {
      updateBranchMutation.mutate({ id: selectedBranch.id, branchData: formData });
    } else {
      createBranchMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      deleteBranchMutation.mutate(id);
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

  const getSortValue = (branch: Branch, property: OrderBy): string | boolean => {
    switch (property) {
      case 'name':
        return branch.name;
      case 'address':
        return branch.address;
      case 'phone':
        return branch.phone;
      case 'email':
        return branch.email;
      case 'status':
        return branch.is_active;
      default:
        return '';
    }
  };

  const sortData = (data: Branch[]) => {
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

  const filterData = (data: Branch[]) => {
    return data.filter((branch) => {
      return searchTerm === '' ||
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.email.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const filteredBranches = filterData(branches || []);
  const sortedBranches = sortData([...filteredBranches]);
  const paginatedBranches = sortedBranches.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <PageContainer
      title="Branches"
      subtitle="Manage your pawnshop branch locations"
      breadcrumbs={[
        { label: 'Home', path: '/', icon: <HomeIcon sx={{ mr: 0.5 }} fontSize="small" /> },
        { label: 'Branch Management' },
        { label: 'Branches' },
      ]}
      actions={
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Branch
        </Button>
      }
      loading={branchesLoading}
      refreshable
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <ContentSection
        title="Branch Locations"
        icon={<StoreIcon color="primary" />}
        variant="paper"
        elevation={1}
      >
        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search branches..."
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
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'address'}
                    direction={orderBy === 'address' ? order : 'asc'}
                    onClick={() => handleRequestSort('address')}
                  >
                    Address
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'phone'}
                    direction={orderBy === 'phone' ? order : 'asc'}
                    onClick={() => handleRequestSort('phone')}
                  >
                    Phone
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
              {paginatedBranches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>{branch.phone}</TableCell>
                  <TableCell>{branch.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={branch.is_active ? 'Active' : 'Inactive'}
                      color={branch.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(branch)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(branch.id)}>
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
            count={filteredBranches.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </ContentSection>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedBranch ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Phone"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              {selectedBranch ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
}