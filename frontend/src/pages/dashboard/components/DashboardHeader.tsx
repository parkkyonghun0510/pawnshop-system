import React from 'react';
import { Box, Typography, Button, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { RefreshOutlined as RefreshIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { FilterState } from '../types';

interface DashboardHeaderProps {
  isConnected: boolean;
  onRefresh: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isConnected,
  onRefresh,
  filters,
  onFilterChange
}) => {
  const { dateRange, branchFilter } = filters;

  return (
    <>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back! Here's what's happening across your pawn shop network.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isConnected ? (
            <Alert severity="success" sx={{ mr: 2 }}>Live updates active</Alert>
          ) : (
            <Alert severity="info" sx={{ mr: 2 }}>Using periodic updates</Alert>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>Date Range:</Typography>
            <DatePicker
              label="Start Date"
              value={dateRange[0]}
              onChange={(newValue) => 
                onFilterChange({ dateRange: [newValue || dayjs().subtract(30, 'day'), dateRange[1]] })
              }
              slotProps={{ textField: { size: 'small' } }}
            />
            <Box sx={{ mx: 1 }}>to</Box>
            <DatePicker
              label="End Date"
              value={dateRange[1]}
              onChange={(newValue) => 
                onFilterChange({ dateRange: [dateRange[0], newValue || dayjs()] })
              }
              slotProps={{ textField: { size: 'small' } }}
            />
          </Box>
        </LocalizationProvider>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={branchFilter}
            label="Branch"
            onChange={(e) => onFilterChange({ branchFilter: e.target.value })}
          >
            <MenuItem value="all">All Branches</MenuItem>
            <MenuItem value="1">Branch A</MenuItem>
            <MenuItem value="2">Branch B</MenuItem>
            <MenuItem value="3">Branch C</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </>
  );
};

export default DashboardHeader;
