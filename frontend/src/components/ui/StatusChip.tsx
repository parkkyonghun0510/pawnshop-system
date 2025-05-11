import React from 'react';
import { Chip, ChipProps, useTheme } from '@mui/material';

// Status types
type StatusType = 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'default' 
  | 'pending' 
  | 'active' 
  | 'inactive' 
  | 'completed' 
  | 'processing' 
  | 'cancelled' 
  | 'approved' 
  | 'rejected' 
  | 'draft';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
  label?: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  size = 'small',
  variant = 'filled',
  ...rest
}) => {
  const theme = useTheme();

  // Map status to color and default label
  const getStatusConfig = (status: StatusType): { color: string; bgColor: string; label: string } => {
    switch (status) {
      case 'success':
        return {
          color: theme.palette.success.main,
          bgColor: theme.palette.success.light,
          label: 'Success',
        };
      case 'warning':
        return {
          color: theme.palette.warning.main,
          bgColor: theme.palette.warning.light,
          label: 'Warning',
        };
      case 'error':
        return {
          color: theme.palette.error.main,
          bgColor: theme.palette.error.light,
          label: 'Error',
        };
      case 'info':
        return {
          color: theme.palette.info.main,
          bgColor: theme.palette.info.light,
          label: 'Info',
        };
      case 'pending':
        return {
          color: theme.palette.warning.main,
          bgColor: theme.palette.warning.light,
          label: 'Pending',
        };
      case 'active':
        return {
          color: theme.palette.success.main,
          bgColor: theme.palette.success.light,
          label: 'Active',
        };
      case 'inactive':
        return {
          color: theme.palette.text.secondary,
          bgColor: theme.palette.action.hover,
          label: 'Inactive',
        };
      case 'completed':
        return {
          color: theme.palette.success.main,
          bgColor: theme.palette.success.light,
          label: 'Completed',
        };
      case 'processing':
        return {
          color: theme.palette.info.main,
          bgColor: theme.palette.info.light,
          label: 'Processing',
        };
      case 'cancelled':
        return {
          color: theme.palette.error.main,
          bgColor: theme.palette.error.light,
          label: 'Cancelled',
        };
      case 'approved':
        return {
          color: theme.palette.success.main,
          bgColor: theme.palette.success.light,
          label: 'Approved',
        };
      case 'rejected':
        return {
          color: theme.palette.error.main,
          bgColor: theme.palette.error.light,
          label: 'Rejected',
        };
      case 'draft':
        return {
          color: theme.palette.text.secondary,
          bgColor: theme.palette.action.hover,
          label: 'Draft',
        };
      default:
        return {
          color: theme.palette.text.primary,
          bgColor: theme.palette.background.default,
          label: 'Default',
        };
    }
  };

  const { color, bgColor, label: defaultLabel } = getStatusConfig(status);
  const displayLabel = label || defaultLabel;

  return (
    <Chip
      label={displayLabel}
      size={size}
      variant={variant}
      sx={{
        color: variant === 'outlined' ? color : '#fff',
        backgroundColor: variant === 'outlined' ? 'transparent' : color,
        borderColor: color,
        fontWeight: 500,
        '& .MuiChip-label': {
          px: 1,
        },
      }}
      {...rest}
    />
  );
};

export default StatusChip;
