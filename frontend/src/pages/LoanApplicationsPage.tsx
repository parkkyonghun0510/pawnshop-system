import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as ReviewIcon,
  MonetizationOn as DisbursementIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoanApplicationForm from '../components/loan/LoanApplicationForm';
import ReviewWorkflow from '../components/loan/ReviewWorkflow';
import LoanDisbursement from '../components/loan/LoanDisbursement';

const LoanApplicationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuApplicationId, setMenuApplicationId] = useState<number | null>(null);

  // Fetch applications
  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['applications', tabValue, searchQuery],
    queryFn: async () => {
      let url = '/applications/?limit=100';
      
      // Add status filter based on tab
      if (tabValue === 1) {
        url += '&status=PENDING';
      } else if (tabValue === 2) {
        url += '&status=APPROVED';
      } else if (tabValue === 3) {
        url += '&status=REJECTED';
      }
      
      // Add search query if provided
      if (searchQuery) {
        url += `&search=${searchQuery}`;
      }
      
      const response = await apiClient.get(url);
      return response.data;
    },
  });

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/applications/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDeleteDialogOpen(false);
    },
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, applicationId: number) => {
    setAnchorEl(event.currentTarget);
    setMenuApplicationId(applicationId);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuApplicationId(null);
  };

  // Handle view application
  const handleViewApplication = (application: any) => {
    setSelectedApplication(application);
    handleMenuClose();
    // Navigate to application details page
    navigate(`/applications/${application.id}`);
  };

  // Handle edit application
  const handleEditApplication = (application: any) => {
    setSelectedApplication(application);
    setFormDialogOpen(true);
    handleMenuClose();
  };

  // Handle review application
  const handleReviewApplication = (application: any) => {
    setSelectedApplication(application);
    setReviewDialogOpen(true);
    handleMenuClose();
  };

  // Handle disburse loan
  const handleDisburseLoan = (application: any) => {
    setSelectedApplication(application);
    setDisbursementDialogOpen(true);
    handleMenuClose();
  };

  // Handle delete application
  const handleDeleteApplication = (application: any) => {
    setSelectedApplication(application);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Get status chip color
  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'primary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <ApprovedIcon fontSize="small" />;
      case 'REJECTED':
        return <RejectedIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Loan Applications</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedApplication(null);
            setFormDialogOpen(true);
          }}
        >
          New Application
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" p={2}>
          <TextField
            placeholder="Search applications..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mr: 2, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter">
            <IconButton>
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : applications?.length > 0 ? (
        <Grid container spacing={3}>
          {applications.map((application: any) => (
            <Grid item xs={12} md={6} lg={4} key={application.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">
                      Application #{application.application_number}
                    </Typography>
                    <Chip
                      label={application.status}
                      color={getStatusChipColor(application.status)}
                      size="small"
                      icon={getStatusIcon(application.status)}
                    />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Customer:
                      </Typography>
                      <Typography variant="body1">
                        {application.customer?.first_name} {application.customer?.last_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Branch:
                      </Typography>
                      <Typography variant="body1">{application.branch?.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Loan Amount:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(application.loan_amount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Term:
                      </Typography>
                      <Typography variant="body1">{application.term_months} months</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">
                        Item:
                      </Typography>
                      <Typography variant="body1" noWrap>
                        {application.item_description}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">
                        Created:
                      </Typography>
                      <Typography variant="body1">{formatDate(application.created_at)}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewApplication(application)}
                  >
                    View
                  </Button>
                  {application.status === 'PENDING' && (
                    <Button
                      size="small"
                      startIcon={<ReviewIcon />}
                      onClick={() => handleReviewApplication(application)}
                    >
                      Review
                    </Button>
                  )}
                  {application.status === 'APPROVED' && !application.loan_id && (
                    <Button
                      size="small"
                      startIcon={<DisbursementIcon />}
                      onClick={() => handleDisburseLoan(application)}
                    >
                      Disburse
                    </Button>
                  )}
                  <Box flexGrow={1} />
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, application.id)}
                  >
                    <MoreIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No applications found
          </Typography>
        </Paper>
      )}

      {/* Application Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const application = applications?.find((a: any) => a.id === menuApplicationId);
            if (application) handleViewApplication(application);
          }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const application = applications?.find((a: any) => a.id === menuApplicationId);
            if (application) handleEditApplication(application);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {menuApplicationId && applications?.find((a: any) => a.id === menuApplicationId)?.status === 'PENDING' && (
          <MenuItem
            onClick={() => {
              const application = applications?.find((a: any) => a.id === menuApplicationId);
              if (application) handleReviewApplication(application);
            }}
          >
            <ListItemIcon>
              <ReviewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Review</ListItemText>
          </MenuItem>
        )}
        {menuApplicationId && 
          applications?.find((a: any) => a.id === menuApplicationId)?.status === 'APPROVED' &&
          !applications?.find((a: any) => a.id === menuApplicationId)?.loan_id && (
          <MenuItem
            onClick={() => {
              const application = applications?.find((a: any) => a.id === menuApplicationId);
              if (application) handleDisburseLoan(application);
            }}
          >
            <ListItemIcon>
              <DisbursementIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Disburse Loan</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            const application = applications?.find((a: any) => a.id === menuApplicationId);
            if (application) handleDeleteApplication(application);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* New/Edit Application Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedApplication ? 'Edit Application' : 'New Loan Application'}
        </DialogTitle>
        <DialogContent>
          <LoanApplicationForm
            initialData={selectedApplication}
            onSuccess={() => {
              setFormDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['applications'] });
            }}
            onCancel={() => setFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Review Application Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Review Application #{selectedApplication?.application_number}</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <ReviewWorkflow
              applicationId={selectedApplication.id}
              onComplete={() => {
                setReviewDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['applications'] });
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Loan Disbursement Dialog */}
      <Dialog
        open={disbursementDialogOpen}
        onClose={() => setDisbursementDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Disburse Loan for Application #{selectedApplication?.application_number}</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <LoanDisbursement
              applicationId={selectedApplication.id}
              onComplete={() => {
                setDisbursementDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['applications'] });
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisbursementDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Application</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete application #{selectedApplication?.application_number}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (selectedApplication) {
                deleteApplicationMutation.mutate(selectedApplication.id);
              }
            }}
            disabled={deleteApplicationMutation.isPending}
          >
            {deleteApplicationMutation.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoanApplicationsPage;
