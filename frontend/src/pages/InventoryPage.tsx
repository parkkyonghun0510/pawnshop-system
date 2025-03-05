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
  FormControlLabel,
  Switch,
  TablePagination,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceTagIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import apiClient from '../api/client';

interface InventoryItem {
  id: number;
  item_code: string;
  name: string;
  description: string;
  category: string;
  acquisition_date: string;
  acquisition_price: number;
  marked_price: number;
  condition: string;
  status: string;
  location: string;
  customer_id: number | null;
  customer_name?: string;
  created_at: string;
  is_active: boolean;
  images?: string[];
}

interface ItemFormData {
  name: string;
  description: string;
  category: string;
  acquisition_price: number;
  marked_price: number;
  condition: string;
  status: string;
  location: string;
  customer_id?: number | null;
  is_active: boolean;
}

// Predefined options
const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'];
const statuses = ['Available', 'On Loan', 'Sold', 'Reserved', 'In Repair', 'Lost'];
const categories = ['Electronics', 'Jewelry', 'Watches', 'Musical Instruments', 'Tools', 'Firearms', 'Collectibles', 'Other'];

export default function InventoryPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    category: '',
    acquisition_price: 0,
    marked_price: 0,
    condition: 'Good',
    status: 'Available',
    location: '',
    customer_id: null,
    is_active: true,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch inventory items
  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['inventory', page, rowsPerPage, search, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await apiClient.get(`/inventory/?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ['customers-simple'],
    queryFn: async () => {
      const response = await apiClient.get('/customers/?limit=1000&fields=id,first_name,last_name');
      return response.data;
    },
  });

  // Create inventory item mutation
  const createItemMutation = useMutation({
    mutationFn: (data: ItemFormData) => {
      return apiClient.post('/inventory/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Inventory item created successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error creating item: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: (data: { id: number; data: ItemFormData }) => {
      return apiClient.put(`/inventory/${data.id}`, data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Inventory item updated successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error updating item: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.delete(`/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSnackbar({
        open: true,
        message: 'Inventory item deleted successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error deleting item: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value, checked } = e.target as HTMLInputElement & { name?: string; value: unknown; checked?: boolean };
    
    if (!name) return;
    
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : (
        name === 'acquisition_price' || name === 'marked_price' ? parseFloat(value as string) || 0 : value
      ),
    });
  };

  // Open dialog for creating/editing item
  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        category: item.category,
        acquisition_price: item.acquisition_price,
        marked_price: item.marked_price,
        condition: item.condition,
        status: item.status,
        location: item.location,
        customer_id: item.customer_id,
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        acquisition_price: 0,
        marked_price: 0,
        condition: 'Good',
        status: 'Available',
        location: '',
        customer_id: null,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createItemMutation.mutate(formData);
    }
  };

  // Delete item
  const handleDeleteItem = (id: number) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      deleteItemMutation.mutate(id);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search inventory..."
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Error loading inventory: {(error as any).message}</Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 640 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Prices</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory?.map((item: InventoryItem) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={item.id}>
                      <TableCell>{item.item_code}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {item.description.length > 50 
                              ? `${item.description.substring(0, 50)}...` 
                              : item.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={<CategoryIcon fontSize="small" />} 
                          label={item.category} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2">
                            <strong>Marked:</strong> {formatCurrency(item.marked_price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <strong>Acquisition:</strong> {formatCurrency(item.acquisition_price)}
                          </Typography>
                          {item.marked_price > item.acquisition_price && (
                            <Typography variant="caption" color="success.main">
                              Margin: {Math.round((item.marked_price - item.acquisition_price) / item.acquisition_price * 100)}%
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{item.condition}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={
                            item.status === 'Available' ? 'success' :
                            item.status === 'On Loan' ? 'primary' :
                            item.status === 'Sold' ? 'secondary' :
                            item.status === 'Reserved' ? 'info' :
                            item.status === 'In Repair' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleOpenDialog(item)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteItem(item.id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={-1} // -1 indicates that the total count is unknown
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Inventory Item Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Item Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    label="Category"
                    onChange={handleInputChange}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Acquisition Price"
                  name="acquisition_price"
                  type="number"
                  value={formData.acquisition_price}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Marked Price"
                  name="marked_price"
                  type="number"
                  value={formData.marked_price}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    name="condition"
                    value={formData.condition}
                    label="Condition"
                    onChange={handleInputChange}
                  >
                    {conditions.map((condition) => (
                      <MenuItem key={condition} value={condition}>{condition}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleInputChange}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Owner (Customer)</InputLabel>
                  <Select
                    name="customer_id"
                    value={formData.customer_id || ''}
                    label="Owner (Customer)"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    {customers?.map((customer: any) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {`${customer.first_name} ${customer.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createItemMutation.isPending || updateItemMutation.isPending}
            >
              {(createItemMutation.isPending || updateItemMutation.isPending) ? (
                <CircularProgress size={24} />
              ) : editingItem ? (
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