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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import apiClient from '../api/client';

interface Employee {
  id: number;
  user_id: number;
  branch_id: number;
  employee_type_id: number;
  hire_date: string;
  is_active: boolean;
  user: {
    username: string;
    email: string;
  };
  branch: {
    name: string;
  };
  employee_type: {
    name: string;
  };
}

interface Branch {
  id: number;
  name: string;
}

interface EmployeeType {
  id: number;
  name: string;
}

interface EmployeeFormData {
  user_id: number;
  branch_id: number;
  employee_type_id: number;
  hire_date: string;
  is_active: boolean;
}

type Order = 'asc' | 'desc';
type OrderBy = 'username' | 'email' | 'branch' | 'type' | 'hire_date' | 'status';

export default function EmployeesPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    user_id: 0,
    branch_id: 0,
    employee_type_id: 0,
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('username');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<number | 'all'>('all');
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiClient.get('/employees');
      return response.data;
    },
  });

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await apiClient.get('/branches');
      return response.data;
    },
  });

  // Fetch employee types
  const { data: employeeTypes, isLoading: employeeTypesLoading } = useQuery<EmployeeType[]>({
    queryKey: ['employee-types'],
    queryFn: async () => {
      const response = await apiClient.get('/employee-types');
      return response.data;
    },
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: EmployeeFormData) => {
      const response = await apiClient.post('/employees', employeeData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to create employee');
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, employeeData }: { id: number; employeeData: EmployeeFormData }) => {
      const response = await apiClient.put(`/employees/${id}`, employeeData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update employee');
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to delete employee');
    },
  });

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        user_id: employee.user_id,
        branch_id: employee.branch_id,
        employee_type_id: employee.employee_type_id,
        hire_date: employee.hire_date.split('T')[0],
        is_active: employee.is_active,
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        user_id: 0,
        branch_id: 0,
        employee_type_id: 0,
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
    setFormData({
      user_id: 0,
      branch_id: 0,
      employee_type_id: 0,
      hire_date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, employeeData: formData });
    } else {
      createEmployeeMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployeeMutation.mutate(id);
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

  const getSortValue = (employee: Employee, property: OrderBy): string | number | boolean => {
    switch (property) {
      case 'username':
        return employee.user.username;
      case 'email':
        return employee.user.email;
      case 'branch':
        return employee.branch.name;
      case 'type':
        return employee.employee_type.name;
      case 'hire_date':
        return new Date(employee.hire_date).getTime();
      case 'status':
        return employee.is_active;
      default:
        return '';
    }
  };

  const sortData = (data: Employee[]) => {
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

  const filterData = (data: Employee[]) => {
    return data.filter((employee) => {
      const matchesSearch = searchTerm === '' || 
        employee.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_type.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBranch = selectedBranch === 'all' || employee.branch_id === selectedBranch;
      const matchesType = selectedType === 'all' || employee.employee_type_id === selectedType;

      return matchesSearch && matchesBranch && matchesType;
    });
  };

  if (employeesLoading || branchesLoading || employeeTypesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const filteredEmployees = filterData(employees || []);
  const sortedEmployees = sortData([...filteredEmployees]);
  const paginatedEmployees = sortedEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Employees</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Employee
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={3}>
        <TextField
          placeholder="Search employees..."
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
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Employee Type</InputLabel>
          <Select
            value={selectedType}
            label="Employee Type"
            onChange={(e) => setSelectedType(e.target.value as number | 'all')}
          >
            <MenuItem value="all">All Types</MenuItem>
            {employeeTypes?.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
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
                  active={orderBy === 'branch'}
                  direction={orderBy === 'branch' ? order : 'asc'}
                  onClick={() => handleRequestSort('branch')}
                >
                  Branch
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'type'}
                  direction={orderBy === 'type' ? order : 'asc'}
                  onClick={() => handleRequestSort('type')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'hire_date'}
                  direction={orderBy === 'hire_date' ? order : 'asc'}
                  onClick={() => handleRequestSort('hire_date')}
                >
                  Hire Date
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
            {paginatedEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.user.username}</TableCell>
                <TableCell>{employee.user.email}</TableCell>
                <TableCell>{employee.branch.name}</TableCell>
                <TableCell>{employee.employee_type.name}</TableCell>
                <TableCell>{new Date(employee.hire_date).toLocaleDateString()}</TableCell>
                <TableCell>{employee.is_active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(employee)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(employee.id)}>
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
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
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
              <InputLabel>Employee Type</InputLabel>
              <Select
                value={formData.employee_type_id}
                label="Employee Type"
                onChange={(e) => setFormData({ ...formData, employee_type_id: Number(e.target.value) })}
                required
              >
                {employeeTypes?.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Hire Date"
              type="date"
              fullWidth
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
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
              {selectedEmployee ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 