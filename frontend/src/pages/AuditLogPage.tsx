import React, { useState } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  InputAdornment,
  IconButton,
  TablePagination,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface AuditLogFilter {
  user_id?: number;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  start_date?: Date;
  end_date?: Date;
}

const AuditLogPage: React.FC = () => {
  const [filters, setFilters] = useState<AuditLogFilter>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch audit logs
  const { data: auditLogs, isLoading, error, refetch } = useQuery<AuditLog[]>({
    queryKey: ['auditLogs', filters, page, rowsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.user_id) params.append('user_id', filters.user_id.toString());
      if (filters.action) params.append('action', filters.action);
      if (filters.resource_type) params.append('resource_type', filters.resource_type);
      if (filters.resource_id) params.append('resource_id', filters.resource_id);
      if (filters.start_date) params.append('start_date', filters.start_date.toISOString());
      if (filters.end_date) params.append('end_date', filters.end_date.toISOString());
      
      params.append('skip', (page * rowsPerPage).toString());
      params.append('limit', rowsPerPage.toString());
      
      const response = await fetch(`/api/v1/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      return response.json();
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (name: keyof AuditLogFilter, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(0);
  };

  // Filter logs by search term
  const filteredLogs = auditLogs?.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource_type.toLowerCase().includes(searchLower) ||
      log.resource_id.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower) ||
      log.user?.username.toLowerCase().includes(searchLower)
    );
  });

  // Get unique values for filters
  const actions = [...new Set(auditLogs?.map(log => log.action) || [])];
  const resourceTypes = [...new Set(auditLogs?.map(log => log.resource_type) || [])];
  const users = [...new Set(auditLogs?.filter(log => log.user).map(log => ({ id: log.user!.id, username: log.user!.username })) || [])];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'role':
        return 'primary';
      case 'permission':
        return 'secondary';
      case 'user':
        return 'warning';
      case 'user_role':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as Error).message}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Filters
              <Tooltip title="Filter audit logs by various criteria">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search logs..."
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
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                  label="Action"
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {actions.map(action => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Resource Type</InputLabel>
                <Select
                  value={filters.resource_type || ''}
                  onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
                  label="Resource Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {resourceTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>User</InputLabel>
                <Select
                  value={filters.user_id || ''}
                  onChange={(e) => handleFilterChange('user_id', e.target.value || undefined)}
                  label="User"
                >
                  <MenuItem value="">All Users</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>{user.username}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack direction="row" spacing={2}>
                  <DatePicker
                    label="Start Date"
                    value={filters.start_date || null}
                    onChange={(date) => handleFilterChange('start_date', date)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={filters.end_date || null}
                    onChange={(date) => handleFilterChange('end_date', date)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Stack>
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" alignItems="center">
              <IconButton onClick={clearFilters} color="primary">
                <FilterIcon />
              </IconButton>
              <Typography variant="body2" color="textSecondary">
                {filteredLogs?.length || 0} results found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Resource Type</TableCell>
              <TableCell>Resource ID</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : filteredLogs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs?.slice(0, rowsPerPage).map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell>{log.user?.username || log.user_id}</TableCell>
                  <TableCell>
                    <Chip 
                      label={log.action} 
                      size="small" 
                      color={getActionColor(log.action) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={log.resource_type} 
                      size="small" 
                      color={getResourceTypeColor(log.resource_type) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{log.resource_id}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{log.ip_address}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredLogs?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default AuditLogPage;
