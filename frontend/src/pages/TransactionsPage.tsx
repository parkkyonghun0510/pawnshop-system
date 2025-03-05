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
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Link as LinkIcon,
  DateRange as DateIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import apiClient from '../api/client';

interface Transaction {
  id: number;
  transaction_number: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  reference_id: number | null;
  reference_type: string | null;
  reference_number: string | null;
  description: string;
  employee_id: number;
  employee_name: string;
  created_at: string;
}

interface TransactionFormData {
  transaction_date: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  reference_id?: number | null;
  reference_type?: string | null;
  description: string;
  employee_id: number;
}

// Predefined options
const transactionTypes = ['Sale', 'Purchase', 'Loan Payment', 'Expense', 'Income', 'Refund', 'Adjustment'];
const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Check', 'Mobile Payment'];
const referenceTypes = ['Loan', 'Inventory', 'Customer', 'Employee', 'Supplier', 'Other'];

export default function TransactionsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    transaction_type: '',
    amount: 0,
    payment_method: 'Cash',
    reference_id: null,
    reference_type: null,
    description: '',
    employee_id: 0,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', page, rowsPerPage, search, typeFilter, tabValue, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
        start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
        end_date: format(dateRange.endDate, 'yyyy-MM-dd'),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      if (typeFilter) {
        params.append('transaction_type', typeFilter);
      }
      
      // Filter by tab value
      if (tabValue === 1) { // Income
        params.append('transaction_type', 'Sale,Loan Payment,Income');
      } else if (tabValue === 2) { // Expenses
        params.append('transaction_type', 'Purchase,Expense');
      }
      
      const response = await apiClient.get(`/transactions/?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: async () => {
      const response = await apiClient.get('/employees/?limit=1000&fields=id,first_name,last_name,employee_code');
      return response.data;
    },
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (data: TransactionFormData) => {
      return apiClient.post('/transactions/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Transaction created successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error creating transaction: ${error.response?.data?.detail || error.message}`,
        type: 'error',
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement & { name?: string; value: unknown };
    
    if (!name) return;
    
    setFormData({
      ...formData,
      [name]: name === 'amount' ? parseFloat(value as string) || 0 : value,
    });
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    
    setFormData({
      ...formData,
      transaction_date: format(date, 'yyyy-MM-dd'),
    });
  };

  // Handle date range changes
  const handleDateRangeChange = (field: 'startDate' | 'endDate', date: Date | null) => {
    if (!date) return;
    
    setDateRange({
      ...dateRange,
      [field]: date,
    });
  };

  // Preset date ranges
  const handlePresetRange = (range: string) => {
    const today = new Date();
    
    switch (range) {
      case 'today':
        setDateRange({
          startDate: today,
          endDate: today,
        });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({
          startDate: yesterday,
          endDate: yesterday,
        });
        break;
      case 'thisWeek':
        const thisWeekStart = subDays(today, today.getDay());
        setDateRange({
          startDate: thisWeekStart,
          endDate: today,
        });
        break;
      case 'thisMonth':
        setDateRange({
          startDate: startOfMonth(today),
          endDate: endOfMonth(today),
        });
        break;
      case 'last30Days':
        setDateRange({
          startDate: subDays(today, 30),
          endDate: today,
        });
        break;
      default:
        break;
    }
  };

  // Open dialog for creating transaction
  const handleOpenDialog = () => {
    setFormData({
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      transaction_type: '',
      amount: 0,
      payment_method: 'Cash',
      reference_id: null,
      reference_type: null,
      description: '',
      employee_id: 0,
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransactionMutation.mutate(formData);
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'Sale':
      case 'Loan Payment':
      case 'Income':
        return 'success';
      case 'Purchase':
      case 'Expense':
        return 'error';
      case 'Refund':
        return 'warning';
      case 'Adjustment':
        return 'info';
      default:
        return 'default';
    }
  };

  // Calculate totals for summary
  const calculateTotals = () => {
    if (!transactions) return { income: 0, expense: 0, net: 0 };
    
    const totals = transactions.reduce(
      (acc: { income: number; expense: number }, transaction: Transaction) => {
        if (['Sale', 'Loan Payment', 'Income'].includes(transaction.transaction_type)) {
          acc.income += transaction.amount;
        } else if (['Purchase', 'Expense', 'Refund'].includes(transaction.transaction_type)) {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
    
    return {
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
    };
  };

  const totals = calculateTotals();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Transactions</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search transactions..."
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Transaction Type</InputLabel>
            <Select
              value={typeFilter}
              label="Transaction Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {transactionTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            New Transaction
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(date) => handleDateRangeChange('startDate', date)}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <Typography>to</Typography>
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(date) => handleDateRangeChange('endDate', date)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>
              <Box sx={{ ml: 2 }}>
                <Button size="small" onClick={() => handlePresetRange('today')}>Today</Button>
                <Button size="small" onClick={() => handlePresetRange('thisWeek')}>This Week</Button>
                <Button size="small" onClick={() => handlePresetRange('thisMonth')}>This Month</Button>
                <Button size="small" onClick={() => handlePresetRange('last30Days')}>Last 30 Days</Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Summary</Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption">Income</Typography>
                  <Typography variant="body2" color="success.main">{formatCurrency(totals.income)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption">Expense</Typography>
                  <Typography variant="body2" color="error.main">{formatCurrency(totals.expense)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption">Net</Typography>
                  <Typography 
                    variant="body2" 
                    color={totals.net >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(totals.net)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ mb: 2 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="All Transactions" />
        <Tab label="Income" />
        <Tab label="Expenses" />
      </Tabs>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Error loading transactions: {(error as any).message}</Alert>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions?.map((transaction: Transaction) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={transaction.id}>
                      <TableCell>{transaction.transaction_number}</TableCell>
                      <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.transaction_type}
                          color={getTransactionTypeColor(transaction.transaction_type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={
                            ['Sale', 'Loan Payment', 'Income'].includes(transaction.transaction_type)
                              ? 'success.main'
                              : 'error.main'
                          }
                          fontWeight="medium"
                        >
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.payment_method}</TableCell>
                      <TableCell>
                        {transaction.reference_number && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LinkIcon fontSize="small" />
                            <Typography variant="body2">
                              {transaction.reference_type}: {transaction.reference_number}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{transaction.employee_name}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
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

      {/* New Transaction Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
          <form onSubmit={handleSubmit}>
            <DialogTitle>Create New Transaction</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Transaction Type</InputLabel>
                    <Select
                      name="transaction_type"
                      value={formData.transaction_type}
                      label="Transaction Type"
                      onChange={handleInputChange}
                    >
                      {transactionTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Transaction Date"
                    value={new Date(formData.transaction_date)}
                    onChange={handleDateChange}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      name="payment_method"
                      value={formData.payment_method}
                      label="Payment Method"
                      onChange={handleInputChange}
                    >
                      {paymentMethods.map((method) => (
                        <MenuItem key={method} value={method}>{method}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Reference Type</InputLabel>
                    <Select
                      name="reference_type"
                      value={formData.reference_type || ''}
                      label="Reference Type"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">None</MenuItem>
                      {referenceTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Reference ID"
                    name="reference_id"
                    type="number"
                    value={formData.reference_id || ''}
                    onChange={handleInputChange}
                    disabled={!formData.reference_type}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Employee</InputLabel>
                    <Select
                      name="employee_id"
                      value={formData.employee_id || ''}
                      label="Employee"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">Select Employee</MenuItem>
                      {employees?.map((employee: any) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {`${employee.first_name} ${employee.last_name} (${employee.employee_code})`}
                        </MenuItem>
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
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createTransactionMutation.isPending}
              >
                {createTransactionMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  'Create Transaction'
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