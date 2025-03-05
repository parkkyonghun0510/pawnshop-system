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
  TablePagination,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Grid,
  Tabs,
  Tab,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  AttachMoney as PaymentIcon,
  Search as SearchIcon,
  ReceiptLong as LoanIcon,
  Person as CustomerIcon,
  LocalOffer as PriceTagIcon,
  Extension as ExtendIcon,
  Close as CloseIcon,
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, addDays } from 'date-fns';
import apiClient from '../api/client';

interface Loan {
  id: number;
  loan_number: string;
  customer_id: number;
  customer_name: string;
  principal_amount: number;
  interest_rate: number;
  loan_date: string;
  maturity_date: string;
  status: string;
  items: LoanItem[];
  payments: Payment[];
  total_paid: number;
  balance: number;
  created_at: string;
}

interface LoanItem {
  id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  assessed_value: number;
}

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_type: string;
  receipt_number: string;
}

interface LoanFormData {
  customer_id: number;
  items: { item_id: number; assessed_value: number }[];
  principal_amount: number;
  interest_rate: number;
  loan_date: string;
  maturity_date: string;
}

interface PaymentFormData {
  amount: number;
  payment_date: string;
  payment_type: string;
}

// Predefined options
const loanStatuses = ['Pending', 'Active', 'Paid', 'Defaulted', 'Extended', 'Closed'];
const paymentTypes = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Check'];

export default function LoansPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanFormData, setLoanFormData] = useState<LoanFormData>({
    customer_id: 0,
    items: [],
    principal_amount: 0,
    interest_rate: 10,
    loan_date: format(new Date(), 'yyyy-MM-dd'),
    maturity_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amount: 0,
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_type: 'Cash',
  });
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [itemValues, setItemValues] = useState<{ [key: number]: number }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch loans
  const { data: loans, isLoading, error } = useQuery({
    queryKey: ['loans', page, rowsPerPage, search, statusFilter, tabValue],
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      // Filter by tab value
      if (tabValue === 1) { // Active loans
        params.append('status', 'Active,Pending,Extended');
      } else if (tabValue === 2) { // Completed loans
        params.append('status', 'Paid,Closed');
      } else if (tabValue === 3) { // Defaulted loans
        params.append('status', 'Defaulted');
      }
      
      const response = await apiClient.get(`/loans/?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: async () => {
      const response = await apiClient.get('/customers/?limit=1000&fields=id,first_name,last_name,customer_code');
      return response.data;
    },
  });

  // Fetch available inventory items for loan
  const { data: availableItems } = useQuery({
    queryKey: ['inventory-available'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/?status=Available&limit=1000&fields=id,name,item_code,marked_price');
      return response.data;
    },
  });

  // Create loan mutation
  const createLoanMutation = useMutation({
    mutationFn: (data: LoanFormData) => {
      return apiClient.post('/loans/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      handleCloseLoanDialog();
      setSnackbar({
        open: true,
        message: 'Loan created successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error creating loan: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: { loan_id: number; data: PaymentFormData }) => {
      return apiClient.post(`/loans/${data.loan_id}/payments`, data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      handleClosePaymentDialog();
      setSnackbar({
        open: true,
        message: 'Payment processed successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error processing payment: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Update loan status mutation
  const updateLoanStatusMutation = useMutation({
    mutationFn: (data: { loan_id: number; status: string }) => {
      return apiClient.patch(`/loans/${data.loan_id}/status`, { status: data.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setSnackbar({
        open: true,
        message: 'Loan status updated successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error updating loan status: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Handle loan form input changes
  const handleLoanInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement & { name?: string; value: unknown };
    
    if (!name) return;
    
    setLoanFormData({
      ...loanFormData,
      [name]: name === 'principal_amount' || name === 'interest_rate' 
        ? parseFloat(value as string) || 0 
        : value,
    });
  };

  // Handle date changes
  const handleDateChange = (name: string, date: Date | null) => {
    if (!date) return;
    
    setLoanFormData({
      ...loanFormData,
      [name]: format(date, 'yyyy-MM-dd'),
    });
  };

  // Handle payment form input changes
  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement & { name?: string; value: unknown };
    
    if (!name) return;
    
    setPaymentFormData({
      ...paymentFormData,
      [name]: name === 'amount' ? parseFloat(value as string) || 0 : value,
    });
  };

  // Open loan dialog
  const handleOpenLoanDialog = () => {
    setLoanFormData({
      customer_id: 0,
      items: [],
      principal_amount: 0,
      interest_rate: 10,
      loan_date: format(new Date(), 'yyyy-MM-dd'),
      maturity_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    });
    setSelectedItems([]);
    setItemValues({});
    setOpenLoanDialog(true);
  };

  // Close loan dialog
  const handleCloseLoanDialog = () => {
    setOpenLoanDialog(false);
  };

  // Open payment dialog
  const handleOpenPaymentDialog = (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentFormData({
      amount: loan.balance,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_type: 'Cash',
    });
    setOpenPaymentDialog(true);
  };

  // Close payment dialog
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedLoan(null);
  };

  // Handle item selection for loan
  const handleItemSelection = (e: React.ChangeEvent<{ value: unknown }>) => {
    const selectedIds = e.target.value as number[];
    setSelectedItems(selectedIds);
    
    // Initialize item values if not already set
    const newItemValues = { ...itemValues };
    selectedIds.forEach(id => {
      if (!newItemValues[id]) {
        const item = availableItems?.find((i: any) => i.id === id);
        newItemValues[id] = item?.marked_price || 0;
      }
    });
    setItemValues(newItemValues);
    
    // Update principal amount based on selected items
    const total = selectedIds.reduce((sum, id) => sum + (newItemValues[id] || 0), 0);
    setLoanFormData({
      ...loanFormData,
      principal_amount: total,
      items: selectedIds.map(id => ({ item_id: id, assessed_value: newItemValues[id] || 0 })),
    });
  };

  // Handle item value change
  const handleItemValueChange = (itemId: number, value: number) => {
    const newItemValues = { ...itemValues, [itemId]: value };
    setItemValues(newItemValues);
    
    // Update principal amount based on item values
    const total = selectedItems.reduce((sum, id) => sum + (newItemValues[id] || 0), 0);
    setLoanFormData({
      ...loanFormData,
      principal_amount: total,
      items: selectedItems.map(id => ({ item_id: id, assessed_value: newItemValues[id] || 0 })),
    });
  };

  // Submit loan form
  const handleSubmitLoan = (e: React.FormEvent) => {
    e.preventDefault();
    createLoanMutation.mutate(loanFormData);
  };

  // Submit payment form
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLoan) {
      createPaymentMutation.mutate({ 
        loan_id: selectedLoan.id, 
        data: paymentFormData 
      });
    }
  };

  // Update loan status
  const handleUpdateStatus = (loanId: number, status: string) => {
    if (window.confirm(`Are you sure you want to mark this loan as ${status}?`)) {
      updateLoanStatusMutation.mutate({ loan_id: loanId, status });
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

  // Tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Pending': return 'info';
      case 'Paid': return 'secondary';
      case 'Defaulted': return 'error';
      case 'Extended': return 'warning';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Loans</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search loans..."
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
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {loanStatuses.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenLoanDialog}
          >
            New Loan
          </Button>
        </Box>
      </Box>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ mb: 2 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="All Loans" />
        <Tab label="Active Loans" />
        <Tab label="Completed Loans" />
        <Tab label="Defaulted Loans" />
      </Tabs>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Error loading loans: {(error as any).message}</Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 640 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>Loan #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Interest</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loans?.map((loan: Loan) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={loan.id}>
                      <TableCell>{loan.loan_number}</TableCell>
                      <TableCell>{loan.customer_name}</TableCell>
                      <TableCell>{formatCurrency(loan.principal_amount)}</TableCell>
                      <TableCell>{loan.interest_rate}%</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="caption">
                            <strong>Loan:</strong> {new Date(loan.loan_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption">
                            <strong>Due:</strong> {new Date(loan.maturity_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2">{formatCurrency(loan.balance)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Paid: {formatCurrency(loan.total_paid)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={loan.status}
                          color={getStatusColor(loan.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {(['Active', 'Pending', 'Extended'].includes(loan.status)) && (
                            <IconButton 
                              onClick={() => handleOpenPaymentDialog(loan)} 
                              size="small" 
                              color="primary"
                              title="Process Payment"
                            >
                              <PaymentIcon />
                            </IconButton>
                          )}
                          {loan.status === 'Pending' && (
                            <>
                              <IconButton 
                                onClick={() => handleUpdateStatus(loan.id, 'Active')} 
                                size="small" 
                                color="success"
                                title="Approve Loan"
                              >
                                <ApproveIcon />
                              </IconButton>
                              <IconButton 
                                onClick={() => handleUpdateStatus(loan.id, 'Closed')} 
                                size="small" 
                                color="error"
                                title="Deny Loan"
                              >
                                <DenyIcon />
                              </IconButton>
                            </>
                          )}
                          {loan.status === 'Active' && (
                            <>
                              <IconButton 
                                onClick={() => handleUpdateStatus(loan.id, 'Extended')} 
                                size="small" 
                                color="warning"
                                title="Extend Loan"
                              >
                                <ExtendIcon />
                              </IconButton>
                              <IconButton 
                                onClick={() => handleUpdateStatus(loan.id, 'Defaulted')} 
                                size="small" 
                                color="error"
                                title="Mark as Defaulted"
                              >
                                <CloseIcon />
                              </IconButton>
                            </>
                          )}
                        </Box>
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

      {/* New Loan Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openLoanDialog} onClose={handleCloseLoanDialog} fullWidth maxWidth="md">
          <form onSubmit={handleSubmitLoan}>
            <DialogTitle>Create New Loan</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Customer</InputLabel>
                    <Select
                      name="customer_id"
                      value={loanFormData.customer_id || ''}
                      label="Customer"
                      onChange={handleLoanInputChange}
                    >
                      <MenuItem value="">Select Customer</MenuItem>
                      {customers?.map((customer: any) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {`${customer.first_name} ${customer.last_name} (${customer.customer_code})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Interest Rate (%)"
                    name="interest_rate"
                    type="number"
                    value={loanFormData.interest_rate}
                    onChange={handleLoanInputChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Principal Amount"
                    name="principal_amount"
                    type="number"
                    value={loanFormData.principal_amount}
                    onChange={handleLoanInputChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    required
                    disabled={selectedItems.length > 0}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Loan Date"
                    value={new Date(loanFormData.loan_date)}
                    onChange={(date) => handleDateChange('loan_date', date)}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Maturity Date"
                    value={new Date(loanFormData.maturity_date)}
                    onChange={(date) => handleDateChange('maturity_date', date)}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider>
                    <Typography variant="subtitle2">Collateral Items</Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Select Items</InputLabel>
                    <Select
                      multiple
                      value={selectedItems}
                      onChange={handleItemSelection}
                      label="Select Items"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as number[]).map((id) => {
                            const item = availableItems?.find((i: any) => i.id === id);
                            return (
                              <Chip 
                                key={id} 
                                label={item?.name || id} 
                                size="small" 
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {availableItems?.map((item: any) => (
                        <MenuItem key={item.id} value={item.id}>
                          {`${item.item_code} - ${item.name} (${formatCurrency(item.marked_price)})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {selectedItems.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Item Values:</Typography>
                    <Grid container spacing={2}>
                      {selectedItems.map(itemId => {
                        const item = availableItems?.find((i: any) => i.id === itemId);
                        return (
                          <Grid item xs={12} md={6} key={itemId}>
                            <TextField
                              fullWidth
                              label={`${item?.name} Value`}
                              type="number"
                              value={itemValues[itemId] || 0}
                              onChange={(e) => handleItemValueChange(itemId, parseFloat(e.target.value) || 0)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                              size="small"
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseLoanDialog}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createLoanMutation.isPending}
              >
                {createLoanMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  'Create Loan'
                )}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </LocalizationProvider>

      {/* Payment Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} fullWidth maxWidth="sm">
          <form onSubmit={handleSubmitPayment}>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogContent>
              {selectedLoan && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <Typography variant="body1">
                        <strong>Loan #:</strong> {selectedLoan.loan_number}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Customer:</strong> {selectedLoan.customer_name}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Current Balance:</strong> {formatCurrency(selectedLoan.balance)}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Payment Amount"
                      name="amount"
                      type="number"
                      value={paymentFormData.amount}
                      onChange={handlePaymentInputChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Payment Date"
                      value={new Date(paymentFormData.payment_date)}
                      onChange={(date) => date && setPaymentFormData({
                        ...paymentFormData,
                        payment_date: format(date, 'yyyy-MM-dd')
                      })}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Payment Type</InputLabel>
                      <Select
                        name="payment_type"
                        value={paymentFormData.payment_type}
                        label="Payment Type"
                        onChange={handlePaymentInputChange}
                      >
                        {paymentTypes.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePaymentDialog}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createPaymentMutation.isPending}
              >
                {createPaymentMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  'Process Payment'
                )}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </LocalizationProvider>

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