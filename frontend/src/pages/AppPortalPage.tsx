import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
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
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Chip,
  Grid,
  Divider,
  Tooltip,
  Checkbox,
  Collapse,
  FormGroup,
  FormControlLabel,
  Slider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiClient from '../api/client';

interface Application {
  id: number;
  customer_id: number;
  branch_id: number;
  item_type_id: number;
  item_description: string;
  estimated_value: number;
  loan_amount: number;
  interest_rate: number;
  term_days: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  customer: {
    name: string;
    email: string;
  };
  branch: {
    name: string;
  };
  item_type: {
    name: string;
  };
}

interface ApplicationFormData {
  customer_id: number;
  branch_id: number;
  item_type_id: number;
  item_description: string;
  estimated_value: number;
  loan_amount: number;
  interest_rate: number;
  term_days: number;
  status: Application['status'];
}

type Order = 'asc' | 'desc';
type OrderBy = 'customer' | 'branch' | 'item_type' | 'estimated_value' | 'loan_amount' | 'status' | 'created_at';

export default function AppPortalPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData>({
    customer_id: 0,
    branch_id: 0,
    item_type_id: 0,
    item_description: '',
    estimated_value: 0,
    loan_amount: 0,
    interest_rate: 0,
    term_days: 30,
    status: 'pending',
  });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('created_at');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Application['status'] | 'all'>('all');
  const [selectedBranch, setSelectedBranch] = useState<number | 'all'>('all');
  const queryClient = useQueryClient();
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [valueRange, setValueRange] = useState<[number, number]>([0, 10000]);
  const [loanRange, setLoanRange] = useState<[number, number]>([0, 10000]);

  // Fetch applications
  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await apiClient.get('/applications');
      return response.data;
    },
  });

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await apiClient.get('/branches');
      return response.data;
    },
  });

  // Fetch item types
  const { data: itemTypes, isLoading: itemTypesLoading } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['item-types'],
    queryFn: async () => {
      const response = await apiClient.get('/item-types');
      return response.data;
    },
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (applicationData: ApplicationFormData) => {
      const response = await apiClient.post('/applications', applicationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to create application');
    },
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, applicationData }: { id: number; applicationData: ApplicationFormData }) => {
      const response = await apiClient.put(`/applications/${id}`, applicationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update application');
    },
  });

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to delete application');
    },
  });

  // Bulk status update mutation
  const bulkStatusUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: Application['status'] }) => {
      await Promise.all(
        ids.map(id => apiClient.put(`/applications/${id}`, { status }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApplications([]);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update applications');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => apiClient.delete(`/applications/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApplications([]);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to delete applications');
    },
  });

  const handleOpenDialog = (application?: Application) => {
    if (application) {
      setSelectedApplication(application);
      setFormData({
        customer_id: application.customer_id,
        branch_id: application.branch_id,
        item_type_id: application.item_type_id,
        item_description: application.item_description,
        estimated_value: application.estimated_value,
        loan_amount: application.loan_amount,
        interest_rate: application.interest_rate,
        term_days: application.term_days,
        status: application.status,
      });
    } else {
      setSelectedApplication(null);
      setFormData({
        customer_id: 0,
        branch_id: 0,
        item_type_id: 0,
        item_description: '',
        estimated_value: 0,
        loan_amount: 0,
        interest_rate: 0,
        term_days: 30,
        status: 'pending',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedApplication(null);
    setFormData({
      customer_id: 0,
      branch_id: 0,
      item_type_id: 0,
      item_description: '',
      estimated_value: 0,
      loan_amount: 0,
      interest_rate: 0,
      term_days: 30,
      status: 'pending',
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedApplication) {
      updateApplicationMutation.mutate({ id: selectedApplication.id, applicationData: formData });
    } else {
      createApplicationMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteApplicationMutation.mutate(id);
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

  const getSortValue = (application: Application, property: OrderBy): string | number => {
    switch (property) {
      case 'customer':
        return application.customer.name;
      case 'branch':
        return application.branch.name;
      case 'item_type':
        return application.item_type.name;
      case 'estimated_value':
        return application.estimated_value;
      case 'loan_amount':
        return application.loan_amount;
      case 'status':
        return application.status;
      case 'created_at':
        return new Date(application.created_at).getTime();
      default:
        return '';
    }
  };

  const sortData = (data: Application[]) => {
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

  const filterData = (data: Application[]) => {
    return data.filter((application) => {
      const matchesSearch = searchTerm === '' || 
        application.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.item_type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.item_description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || application.status === selectedStatus;
      const matchesBranch = selectedBranch === 'all' || application.branch_id === selectedBranch;

      // Advanced filters
      const applicationDate = new Date(application.created_at);
      const matchesDateRange = (!dateRange[0] || applicationDate >= dateRange[0]) &&
                             (!dateRange[1] || applicationDate <= dateRange[1]);
      
      const matchesValueRange = application.estimated_value >= valueRange[0] &&
                               application.estimated_value <= valueRange[1];
      
      const matchesLoanRange = application.loan_amount >= loanRange[0] &&
                              application.loan_amount <= loanRange[1];

      return matchesSearch && matchesStatus && matchesBranch &&
             matchesDateRange && matchesValueRange && matchesLoanRange;
    });
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleOpenViewDialog = (application: Application) => {
    setSelectedApplication(application);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedApplication(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Customer Name',
      'Customer Email',
      'Branch',
      'Item Type',
      'Item Description',
      'Estimated Value',
      'Loan Amount',
      'Interest Rate',
      'Term (Days)',
      'Status',
      'Created At',
    ];

    const csvContent = [
      headers.join(','),
      ...filteredApplications.map(app => [
        `"${app.customer.name}"`,
        `"${app.customer.email}"`,
        `"${app.branch.name}"`,
        `"${app.item_type.name}"`,
        `"${app.item_description}"`,
        app.estimated_value,
        app.loan_amount,
        app.interest_rate,
        app.term_days,
        app.status,
        new Date(app.created_at).toLocaleDateString(),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedApplications(paginatedApplications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (id: number) => {
    setSelectedApplications(prev =>
      prev.includes(id)
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = (status: Application['status']) => {
    if (window.confirm(`Are you sure you want to update ${selectedApplications.length} applications to ${status}?`)) {
      bulkStatusUpdateMutation.mutate({ ids: selectedApplications, status });
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedApplications.length} applications?`)) {
      bulkDeleteMutation.mutate(selectedApplications);
    }
  };

  if (applicationsLoading || branchesLoading || itemTypesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const filteredApplications = filterData(applications || []);
  const sortedApplications = sortData([...filteredApplications]);
  const paginatedApplications = sortedApplications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Application Portal</Typography>
        <Box>
          <Tooltip title="Export to CSV">
            <IconButton onClick={handleExportCSV} sx={{ mr: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Application
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
          placeholder="Search applications..."
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
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            label="Status"
            onChange={(e) => setSelectedStatus(e.target.value as Application['status'] | 'all')}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={selectedBranch}
            label="Branch"
            onChange={(e) => setSelectedBranch(e.target.value as number | 'all')}
          >
            <MenuItem value="all">All Branches</MenuItem>
            {branches?.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          startIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          Advanced Filters
        </Button>
      </Box>

      <Collapse in={showAdvancedFilters}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Date Range
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box display="flex" gap={2}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange[0]}
                    onChange={(date) => setDateRange([date, dateRange[1]])}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={dateRange[1]}
                    onChange={(date) => setDateRange([dateRange[0], date])}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Estimated Value Range
              </Typography>
              <Slider
                value={valueRange}
                onChange={(_, newValue) => setValueRange(newValue as [number, number])}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                marks
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">${valueRange[0]}</Typography>
                <Typography variant="body2">${valueRange[1]}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Loan Amount Range
              </Typography>
              <Slider
                value={loanRange}
                onChange={(_, newValue) => setLoanRange(newValue as [number, number])}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                marks
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">${loanRange[0]}</Typography>
                <Typography variant="body2">${loanRange[1]}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {selectedApplications.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="subtitle1">
              {selectedApplications.length} applications selected
            </Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Update Status</InputLabel>
              <Select
                label="Update Status"
                onChange={(e) => handleBulkStatusUpdate(e.target.value as Application['status'])}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedApplications.length > 0 && selectedApplications.length < paginatedApplications.length}
                  checked={paginatedApplications.length > 0 && selectedApplications.length === paginatedApplications.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'customer'}
                  direction={orderBy === 'customer' ? order : 'asc'}
                  onClick={() => handleRequestSort('customer')}
                >
                  Customer
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'branch'}
                  direction={orderBy === 'branch' ? order : 'asc'}
                  onClick={() => handleRequestSort('branch')}
                >
                  Branch
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'item_type'}
                  direction={orderBy === 'item_type' ? order : 'asc'}
                  onClick={() => handleRequestSort('item_type')}
                >
                  Item Type
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'estimated_value'}
                  direction={orderBy === 'estimated_value' ? order : 'asc'}
                  onClick={() => handleRequestSort('estimated_value')}
                >
                  Estimated Value
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'loan_amount'}
                  direction={orderBy === 'loan_amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('loan_amount')}
                >
                  Loan Amount
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
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'created_at'}
                  direction={orderBy === 'created_at' ? order : 'asc'}
                  onClick={() => handleRequestSort('created_at')}
                >
                  Created At
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedApplications.map((application) => (
              <TableRow key={application.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedApplications.includes(application.id)}
                    onChange={() => handleSelectApplication(application.id)}
                  />
                </TableCell>
                <TableCell>{application.customer.name}</TableCell>
                <TableCell>{application.branch.name}</TableCell>
                <TableCell>{application.item_type.name}</TableCell>
                <TableCell>${application.estimated_value.toLocaleString()}</TableCell>
                <TableCell>${application.loan_amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    color={getStatusColor(application.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton onClick={() => handleOpenViewDialog(application)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenDialog(application)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(application.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredApplications.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedApplication ? 'Edit Application' : 'New Application'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Branch</InputLabel>
              <Select
                value={formData.branch_id}
                label="Branch"
                onChange={(e) => setFormData({ ...formData, branch_id: Number(e.target.value) })}
                required
              >
                {branches?.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Item Type</InputLabel>
              <Select
                value={formData.item_type_id}
                label="Item Type"
                onChange={(e) => setFormData({ ...formData, item_type_id: Number(e.target.value) })}
                required
              >
                {itemTypes?.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Item Description"
              fullWidth
              multiline
              rows={3}
              value={formData.item_description}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Estimated Value"
              type="number"
              fullWidth
              value={formData.estimated_value}
              onChange={(e) => setFormData({ ...formData, estimated_value: Number(e.target.value) })}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              margin="dense"
              label="Loan Amount"
              type="number"
              fullWidth
              value={formData.loan_amount}
              onChange={(e) => setFormData({ ...formData, loan_amount: Number(e.target.value) })}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              margin="dense"
              label="Interest Rate (%)"
              type="number"
              fullWidth
              value={formData.interest_rate}
              onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
              required
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
            <TextField
              margin="dense"
              label="Term (Days)"
              type="number"
              fullWidth
              value={formData.term_days}
              onChange={(e) => setFormData({ ...formData, term_days: Number(e.target.value) })}
              required
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Application['status'] })}
                required
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedApplication ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Detailed View Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer Information
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Name: {selectedApplication.customer.name}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Email: {selectedApplication.customer.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Branch Information
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Branch: {selectedApplication.branch.name}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Status: <Chip
                      label={selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                      color={getStatusColor(selectedApplication.status)}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Item Information
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Type: {selectedApplication.item_type.name}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Description: {selectedApplication.item_description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Financial Details
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Estimated Value: ${selectedApplication.estimated_value.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Loan Amount: ${selectedApplication.loan_amount.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Interest Rate: {selectedApplication.interest_rate}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Loan Terms
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Term: {selectedApplication.term_days} days
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Created At: {new Date(selectedApplication.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Last Updated: {new Date(selectedApplication.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleCloseViewDialog();
              if (selectedApplication) {
                handleOpenDialog(selectedApplication);
              }
            }}
          >
            Edit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 