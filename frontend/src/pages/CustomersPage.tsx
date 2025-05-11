import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import apiClient from '../api/client';
import { DataTable, TableSkeleton } from '../components/ui';

interface Customer {
  id: number;
  customer_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  is_active: boolean;
  created_at: string;
}

interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  is_active: boolean;
}

export default function CustomersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    is_active: true,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', page, rowsPerPage, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get(`/customers/?${params.toString()}`);
      return response.data;
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: (data: CustomerFormData) => {
      return apiClient.post('/customers/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Customer created successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error creating customer: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: (data: { id: number; data: CustomerFormData }) => {
      return apiClient.put(`/customers/${data.id}`, data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Customer updated successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error updating customer: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSnackbar({
        open: true,
        message: 'Customer deleted successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error deleting customer: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : value,
    });
  };

  // Open dialog for creating/editing customer
  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip_code: customer.zip_code,
        is_active: customer.is_active,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      createCustomerMutation.mutate(formData);
    }
  };

  // Delete customer
  const handleDeleteCustomer = (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomerMutation.mutate(id);
    }
  };

  // Table pagination change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Customers</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search customers..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      <DataTable
        columns={[
          { id: 'id', label: 'ID', minWidth: 70 },
          { id: 'customer_code', label: 'Code', minWidth: 100 },
          {
            id: 'name',
            label: 'Name',
            minWidth: 150,
            format: (value, row: any) => `${row.first_name} ${row.last_name}`
          },
          {
            id: 'contact',
            label: 'Contact',
            minWidth: 200,
            format: (value, row: any) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  {row.email}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" />
                  {row.phone}
                </Box>
              </Box>
            )
          },
          {
            id: 'address',
            label: 'Address',
            minWidth: 250,
            format: (value, row: any) =>
              `${row.address}, ${row.city}, ${row.state} ${row.zip_code}`
          },
          {
            id: 'is_active',
            label: 'Status',
            minWidth: 100,
            format: (value) => (
              <Chip
                label={value ? 'Active' : 'Inactive'}
                color={value ? 'success' : 'default'}
                size="small"
              />
            )
          },
        ]}
        data={customers || []}
        keyField="id"
        loading={isLoading}
        error={error ? `Error loading customers: ${(error as any).message}` : null}
        showActions
        onEdit={handleOpenDialog}
        onDelete={handleDeleteCustomer}
        pagination
        page={page}
        initialRowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        virtualized={!isMobile}
        maxHeight={640}
        rowHeight={70}
        elevation={1}
      />

      {/* Customer Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Zip Code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    name="is_active"
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
            >
              {(createCustomerMutation.isPending || updateCustomerMutation.isPending) ? (
                <CircularProgress size={24} />
              ) : editingCustomer ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.type}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}