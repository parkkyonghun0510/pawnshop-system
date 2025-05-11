import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  MonetizationOn as MoneyIcon,
  Description as DocumentIcon,
  Print as PrintIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

interface LoanDisbursementProps {
  applicationId: number;
  onComplete?: () => void;
}

const LoanDisbursement: React.FC<LoanDisbursementProps> = ({ applicationId, onComplete }) => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [disbursementData, setDisbursementData] = useState({
    loan_agreement_signed: false,
    loan_agreement_signed_at: new Date(),
    loan_disbursed: false,
    loan_disbursed_at: new Date(),
    payment_method: '',
    transaction_reference: '',
    notes: '',
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch application details
  const { data: application, isLoading: applicationLoading } = useQuery({
    queryKey: ['application-details', applicationId],
    queryFn: async () => {
      const response = await apiClient.get(`/applications/${applicationId}`);
      return response.data;
    },
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.patch(`/applications/${applicationId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-details', applicationId] });
      setActiveStep((prevStep) => prevStep + 1);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update application');
    },
  });

  // Create loan mutation
  const createLoanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/applications/${applicationId}/disburse`, {
        payment_method: disbursementData.payment_method,
        transaction_reference: disbursementData.transaction_reference,
        notes: disbursementData.notes,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['application-details', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setActiveStep(3); // Move to completed step
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to disburse loan');
    },
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDisbursementData({
      ...disbursementData,
      [name]: value,
    });
  };

  // Handle select change
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setDisbursementData({
      ...disbursementData,
      [name]: value,
    });
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setDisbursementData({
      ...disbursementData,
      [name]: checked,
    });
  };

  // Handle date change
  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setDisbursementData({
        ...disbursementData,
        [name]: date,
      });
    }
  };

  // Handle agreement signing
  const handleSignAgreement = async () => {
    try {
      await updateApplicationMutation.mutateAsync({
        loan_agreement_signed: true,
        loan_agreement_signed_at: disbursementData.loan_agreement_signed_at.toISOString(),
      });
    } catch (error) {
      console.error('Agreement signing failed:', error);
    }
  };

  // Handle loan disbursement
  const handleDisburseLoan = async () => {
    try {
      setConfirmDialogOpen(false);
      await createLoanMutation.mutateAsync();
    } catch (error) {
      console.error('Loan disbursement failed:', error);
    }
  };

  // Payment method options
  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'mobile_money', label: 'Mobile Money' },
  ];

  // Steps for the stepper
  const steps = [
    {
      label: 'Loan Agreement',
      description: 'Sign the loan agreement',
    },
    {
      label: 'Disbursement',
      description: 'Process loan disbursement',
    },
    {
      label: 'Confirmation',
      description: 'Confirm loan disbursement',
    },
  ];

  // Determine active step based on application status
  React.useEffect(() => {
    if (application) {
      if (application.loan_id) {
        setActiveStep(3); // Completed
      } else if (application.loan_agreement_signed) {
        setActiveStep(1); // Disbursement
      } else {
        setActiveStep(0); // Agreement
      }
    }
  }, [application]);

  if (applicationLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if application is approved
  if (application?.status !== 'APPROVED') {
    return (
      <Alert severity="warning">
        This application is not approved. Loan disbursement is only available for approved applications.
      </Alert>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loan Disbursement Process
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 3 ? (
          <Box textAlign="center" py={3}>
            <SuccessIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Loan Successfully Disbursed
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Loan #{application.loan_id} has been created and funds have been disbursed to the customer.
            </Typography>
            <Box mt={3}>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                sx={{ mr: 2 }}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              <Button
                variant="outlined"
                startIcon={<DocumentIcon />}
                onClick={() => window.location.href = `/loans/${application.loan_id}`}
              >
                View Loan Details
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Loan Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Application #:
                        </Typography>
                        <Typography variant="body1">{application?.application_number}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Customer:
                        </Typography>
                        <Typography variant="body1">
                          {application?.customer?.first_name} {application?.customer?.last_name}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Loan Amount:
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(application?.approved_loan_amount || application?.loan_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Interest Rate:
                        </Typography>
                        <Typography variant="body1">
                          {application?.approved_interest_rate || application?.interest_rate}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Term:
                        </Typography>
                        <Typography variant="body1">
                          {application?.approved_term_days
                            ? `${application.approved_term_days} days`
                            : `${application?.term_months} months`}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Collateral:
                        </Typography>
                        <Typography variant="body1">{application?.item_description}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  <FormControlLabel
                    control={
                      <Checkbox
                        name="loan_agreement_signed"
                        checked={disbursementData.loan_agreement_signed || application?.loan_agreement_signed}
                        onChange={handleCheckboxChange}
                        disabled={application?.loan_agreement_signed}
                      />
                    }
                    label="Loan Agreement Signed by Customer"
                  />

                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Agreement Signing Date"
                      value={
                        application?.loan_agreement_signed_at
                          ? new Date(application.loan_agreement_signed_at)
                          : disbursementData.loan_agreement_signed_at
                      }
                      onChange={(date) => handleDateChange('loan_agreement_signed_at', date)}
                      disabled={application?.loan_agreement_signed}
                      sx={{ mt: 2, width: '100%' }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Loan Agreement Preview
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px dashed #ccc',
                        borderRadius: 1,
                        bgcolor: '#f9f9f9',
                        flex: 1,
                        overflow: 'auto',
                      }}
                    >
                      <Typography variant="h6" align="center" gutterBottom>
                        LOAN AGREEMENT
                      </Typography>
                      <Typography variant="body2" paragraph>
                        This Loan Agreement is made on{' '}
                        {disbursementData.loan_agreement_signed_at.toLocaleDateString()} between:
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Lender:</strong> Pawnshop Management System
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Borrower:</strong> {application?.customer?.first_name}{' '}
                        {application?.customer?.last_name}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Loan Amount:</strong>{' '}
                        {formatCurrency(application?.approved_loan_amount || application?.loan_amount)}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Interest Rate:</strong>{' '}
                        {application?.approved_interest_rate || application?.interest_rate}% per annum
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Term:</strong>{' '}
                        {application?.approved_term_days
                          ? `${application.approved_term_days} days`
                          : `${application?.term_months} months`}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Collateral:</strong> {application?.item_description}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        The Borrower agrees to repay the Loan Amount plus interest according to the terms
                        specified in this agreement. The collateral will be held by the Lender until the loan
                        is fully repaid.
                      </Typography>
                      <Box mt={3} display="flex" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2">Lender Signature:</Typography>
                          <Box
                            sx={{ width: 150, height: 50, border: '1px solid #ccc', borderRadius: 1, mt: 1 }}
                          ></Box>
                        </Box>
                        <Box>
                          <Typography variant="body2">Borrower Signature:</Typography>
                          <Box
                            sx={{ width: 150, height: 50, border: '1px solid #ccc', borderRadius: 1, mt: 1 }}
                          ></Box>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSignAgreement}
                      disabled={
                        !disbursementData.loan_agreement_signed ||
                        updateApplicationMutation.isPending ||
                        application?.loan_agreement_signed
                      }
                    >
                      {updateApplicationMutation.isPending ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Confirm Agreement Signing'
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Disbursement Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel>Payment Method</InputLabel>
                          <Select
                            name="payment_method"
                            value={disbursementData.payment_method}
                            onChange={handleSelectChange}
                            label="Payment Method"
                          >
                            <MenuItem value="">Select Method</MenuItem>
                            {paymentMethods.map((method) => (
                              <MenuItem key={method.value} value={method.value}>
                                {method.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Transaction Reference"
                          name="transaction_reference"
                          value={disbursementData.transaction_reference}
                          onChange={handleInputChange}
                          sx={{ mt: 2 }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="Disbursement Date"
                            value={disbursementData.loan_disbursed_at}
                            onChange={(date) => handleDateChange('loan_disbursed_at', date)}
                            sx={{ mt: 2, width: '100%' }}
                          />
                        </LocalizationProvider>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Notes"
                          name="notes"
                          value={disbursementData.notes}
                          onChange={handleInputChange}
                          multiline
                          rows={3}
                          sx={{ mt: 2 }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Loan Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Application #:
                        </Typography>
                        <Typography variant="body1">{application?.application_number}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Customer:
                        </Typography>
                        <Typography variant="body1">
                          {application?.customer?.first_name} {application?.customer?.last_name}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Loan Amount:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(application?.approved_loan_amount || application?.loan_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Interest Rate:
                        </Typography>
                        <Typography variant="body1">
                          {application?.approved_interest_rate || application?.interest_rate}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Term:
                        </Typography>
                        <Typography variant="body1">
                          {application?.approved_term_days
                            ? `${application.approved_term_days} days`
                            : `${application?.term_months} months`}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Agreement Signed:
                        </Typography>
                        <Typography variant="body1">
                          {application?.loan_agreement_signed
                            ? new Date(application.loan_agreement_signed_at).toLocaleDateString()
                            : 'No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      <Grid item xs={12}>
                        <Alert severity="info">
                          Once you disburse this loan, a new loan record will be created and the application
                          will be marked as disbursed.
                        </Alert>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SendIcon />}
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={!disbursementData.payment_method || createLoanMutation.isPending}
                    >
                      {createLoanMutation.isPending ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Disburse Loan'
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
              <DialogTitle>Confirm Loan Disbursement</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to disburse this loan? This action will create a new loan record and
                  cannot be undone.
                </DialogContentText>
                <Box mt={2}>
                  <Typography variant="subtitle2">Loan Amount:</Typography>
                  <Typography variant="body1">
                    {formatCurrency(application?.approved_loan_amount || application?.loan_amount)}
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Typography variant="subtitle2">Payment Method:</Typography>
                  <Typography variant="body1">
                    {paymentMethods.find((m) => m.value === disbursementData.payment_method)?.label}
                  </Typography>
                </Box>
                {disbursementData.transaction_reference && (
                  <Box mt={1}>
                    <Typography variant="subtitle2">Transaction Reference:</Typography>
                    <Typography variant="body1">{disbursementData.transaction_reference}</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleDisburseLoan} variant="contained" color="primary">
                  Confirm Disbursement
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LoanDisbursement;
