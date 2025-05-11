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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Assignment as ReviewIcon,
  MonetizationOn as MoneyIcon,
  Assessment as RiskIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import DocumentUpload from './DocumentUpload';

interface ReviewWorkflowProps {
  applicationId: number;
  onComplete?: () => void;
}

const ReviewWorkflow: React.FC<ReviewWorkflowProps> = ({ applicationId, onComplete }) => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [reviewData, setReviewData] = useState({
    review_step: 'initial_review',
    status: '',
    comments: '',
    risk_assessment: '',
    approved_loan_amount: '',
    approved_interest_rate: '',
    approved_term_days: '',
    decision_notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch application details
  const { data: application, isLoading: applicationLoading } = useQuery({
    queryKey: ['application-details', applicationId],
    queryFn: async () => {
      const response = await apiClient.get(`/applications/${applicationId}`);
      return response.data;
    },
  });

  // Fetch application reviews
  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['application-reviews', applicationId],
    queryFn: async () => {
      const response = await apiClient.get(`/applications/${applicationId}/reviews`);
      return response.data;
    },
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post(`/applications/${applicationId}/reviews`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-reviews', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application-details', applicationId] });
      refetchReviews();
      setActiveStep((prevStep) => prevStep + 1);
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to submit review');
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
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update application');
    },
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewData({
      ...reviewData,
      [name]: value,
    });
  };

  // Handle select change
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setReviewData({
      ...reviewData,
      [name]: value,
    });
  };

  // Handle review submission
  const handleSubmitReview = async (step: string, status: string) => {
    try {
      // Update review data
      const updatedReviewData = {
        ...reviewData,
        review_step: step,
        status: status,
      };
      
      // Submit review
      await createReviewMutation.mutateAsync(updatedReviewData);
      
      // If this is the final approval and it's approved, update application with additional data
      if (step === 'final_approval' && status === 'approved') {
        await updateApplicationMutation.mutateAsync({
          risk_assessment: reviewData.risk_assessment,
          approved_loan_amount: parseFloat(reviewData.approved_loan_amount as string),
          approved_interest_rate: parseFloat(reviewData.approved_interest_rate as string),
          approved_term_days: parseInt(reviewData.approved_term_days as string, 10),
          decision_notes: reviewData.decision_notes,
        });
      }
      
      // Reset form
      setReviewData({
        review_step: getNextReviewStep(step),
        status: '',
        comments: '',
        risk_assessment: reviewData.risk_assessment,
        approved_loan_amount: reviewData.approved_loan_amount,
        approved_interest_rate: reviewData.approved_interest_rate,
        approved_term_days: reviewData.approved_term_days,
        decision_notes: reviewData.decision_notes,
      });
      
      // If workflow is complete, call onComplete callback
      if (step === 'final_approval' && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Review submission failed:', error);
    }
  };

  // Get next review step
  const getNextReviewStep = (currentStep: string): string => {
    switch (currentStep) {
      case 'initial_review':
        return 'risk_assessment';
      case 'risk_assessment':
        return 'manager_approval';
      case 'manager_approval':
        return 'final_approval';
      default:
        return 'completed';
    }
  };

  // Check if a step has been completed
  const isStepCompleted = (step: string): boolean => {
    return reviews?.some((review: any) => review.review_step === step);
  };

  // Get review status for a step
  const getStepStatus = (step: string): string => {
    const review = reviews?.find((review: any) => review.review_step === step);
    return review?.status || '';
  };

  // Get review comments for a step
  const getStepComments = (step: string): string => {
    const review = reviews?.find((review: any) => review.review_step === step);
    return review?.comments || '';
  };

  // Determine active step based on completed reviews
  React.useEffect(() => {
    if (reviews?.length) {
      if (isStepCompleted('final_approval')) {
        setActiveStep(4); // Completed
      } else if (isStepCompleted('manager_approval')) {
        setActiveStep(3); // Final Approval
      } else if (isStepCompleted('risk_assessment')) {
        setActiveStep(2); // Manager Approval
      } else if (isStepCompleted('initial_review')) {
        setActiveStep(1); // Risk Assessment
      } else {
        setActiveStep(0); // Initial Review
      }
    }
  }, [reviews]);

  // Review steps
  const steps = [
    {
      label: 'Initial Review',
      key: 'initial_review',
      description: 'Verify application details and customer information',
    },
    {
      label: 'Risk Assessment',
      key: 'risk_assessment',
      description: 'Evaluate risk and determine loan terms',
    },
    {
      label: 'Manager Approval',
      key: 'manager_approval',
      description: 'Manager review of application and risk assessment',
    },
    {
      label: 'Final Approval',
      key: 'final_approval',
      description: 'Final decision and loan disbursement approval',
    },
    {
      label: 'Completed',
      key: 'completed',
      description: 'Application review process completed',
    },
  ];

  // Risk assessment options
  const riskOptions = [
    { value: 'low', label: 'Low Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'high', label: 'High Risk' },
  ];

  if (applicationLoading || reviewsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Application Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Application #</Typography>
                <Typography variant="body2">{application?.application_number}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip
                  label={application?.status}
                  color={
                    application?.status === 'APPROVED'
                      ? 'success'
                      : application?.status === 'REJECTED'
                      ? 'error'
                      : 'primary'
                  }
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2">Loan Amount</Typography>
                <Typography variant="body2">{formatCurrency(application?.loan_amount)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Term</Typography>
                <Typography variant="body2">{application?.term_months} months</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2">Interest Rate</Typography>
                <Typography variant="body2">{application?.interest_rate}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Item Category</Typography>
                <Typography variant="body2">{application?.item_category}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2">Item Description</Typography>
                <Typography variant="body2">{application?.item_description}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2">Documents</Typography>
                <Box mt={1}>
                  <DocumentUpload applicationId={applicationId} readOnly />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Process
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.key} completed={isStepCompleted(step.key)}>
                  <StepLabel>
                    <Box display="flex" alignItems="center">
                      {step.label}
                      {isStepCompleted(step.key) && (
                        <Chip
                          label={getStepStatus(step.key)}
                          color={getStepStatus(step.key) === 'approved' ? 'success' : 'error'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </StepLabel>
                  <StepContent>
                    {index === 4 ? (
                      <Box my={2}>
                        <Alert severity="success">
                          Application review process completed with status:{' '}
                          <strong>{application?.status}</strong>
                        </Alert>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {step.description}
                        </Typography>
                        
                        {isStepCompleted(step.key) ? (
                          <Box my={2}>
                            <Typography variant="subtitle2">Review Comments:</Typography>
                            <Typography variant="body2">{getStepComments(step.key)}</Typography>
                          </Box>
                        ) : (
                          <Box my={2}>
                            <Grid container spacing={2}>
                              {step.key === 'risk_assessment' && (
                                <>
                                  <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                      <InputLabel>Risk Assessment</InputLabel>
                                      <Select
                                        name="risk_assessment"
                                        value={reviewData.risk_assessment}
                                        onChange={handleSelectChange}
                                        label="Risk Assessment"
                                      >
                                        <MenuItem value="">Select Risk Level</MenuItem>
                                        {riskOptions.map((option) => (
                                          <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <TextField
                                      fullWidth
                                      label="Approved Loan Amount"
                                      name="approved_loan_amount"
                                      type="number"
                                      value={reviewData.approved_loan_amount}
                                      onChange={handleInputChange}
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                      }}
                                    />
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <TextField
                                      fullWidth
                                      label="Approved Interest Rate"
                                      name="approved_interest_rate"
                                      type="number"
                                      value={reviewData.approved_interest_rate}
                                      onChange={handleInputChange}
                                      InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                      }}
                                    />
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <TextField
                                      fullWidth
                                      label="Approved Term (Days)"
                                      name="approved_term_days"
                                      type="number"
                                      value={reviewData.approved_term_days}
                                      onChange={handleInputChange}
                                    />
                                  </Grid>
                                </>
                              )}
                              
                              {step.key === 'final_approval' && (
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Decision Notes"
                                    name="decision_notes"
                                    multiline
                                    rows={2}
                                    value={reviewData.decision_notes}
                                    onChange={handleInputChange}
                                  />
                                </Grid>
                              )}
                              
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label="Comments"
                                  name="comments"
                                  multiline
                                  rows={3}
                                  value={reviewData.comments}
                                  onChange={handleInputChange}
                                />
                              </Grid>
                            </Grid>
                            
                            <Box display="flex" justifyContent="flex-end" mt={2}>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => handleSubmitReview(step.key, 'rejected')}
                                sx={{ mr: 1 }}
                                disabled={createReviewMutation.isPending}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleSubmitReview(step.key, 'approved')}
                                disabled={
                                  createReviewMutation.isPending ||
                                  (step.key === 'risk_assessment' &&
                                    (!reviewData.risk_assessment ||
                                      !reviewData.approved_loan_amount ||
                                      !reviewData.approved_interest_rate ||
                                      !reviewData.approved_term_days))
                                }
                              >
                                {createReviewMutation.isPending ? (
                                  <CircularProgress size={24} color="inherit" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewWorkflow;
