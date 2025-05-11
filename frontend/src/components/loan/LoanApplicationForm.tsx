import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Paper,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  Help as HelpIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import DocumentUpload from './DocumentUpload';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  customer_code: string;
  email: string;
  phone: string;
}

interface Branch {
  id: number;
  name: string;
}

interface ItemCategory {
  value: string;
  name: string;
}

interface LoanApplicationFormProps {
  onSuccess?: (applicationId: number) => void;
  onCancel?: () => void;
  initialData?: any;
}

const LoanApplicationForm: React.FC<LoanApplicationFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
}) => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    customer_id: initialData?.customer_id || '',
    branch_id: initialData?.branch_id || '',
    item_category: initialData?.item_category || '',
    item_description: initialData?.item_description || '',
    estimated_value: initialData?.estimated_value || '',
    loan_amount: initialData?.loan_amount || '',
    interest_rate: initialData?.interest_rate || 5,
    term_months: initialData?.term_months || 3,
    notes: initialData?.notes || '',
    credit_score: initialData?.credit_score || '',
    monthly_income: initialData?.monthly_income || '',
    employment_status: initialData?.employment_status || '',
    employer_name: initialData?.employer_name || '',
    employment_duration: initialData?.employment_duration || '',
    has_existing_loans: initialData?.has_existing_loans || false,
    existing_loan_amount: initialData?.existing_loan_amount || '',
    collateral_description: initialData?.collateral_description || '',
    collateral_condition: initialData?.collateral_condition || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: async () => {
      const response = await apiClient.get('/customers/?limit=1000&fields=id,first_name,last_name,customer_code,email,phone');
      return response.data;
    },
  });

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: async () => {
      const response = await apiClient.get('/branches/?limit=100&fields=id,name');
      return response.data;
    },
  });

  // Item categories
  const itemCategories: ItemCategory[] = [
    { value: 'jewelry', name: 'Jewelry' },
    { value: 'electronics', name: 'Electronics' },
    { value: 'watches', name: 'Watches' },
    { value: 'tools', name: 'Tools' },
    { value: 'musical_instruments', name: 'Musical Instruments' },
    { value: 'collectibles', name: 'Collectibles' },
    { value: 'luxury_items', name: 'Luxury Items' },
    { value: 'other', name: 'Other' },
  ];

  // Employment status options
  const employmentStatusOptions = [
    'Full-time',
    'Part-time',
    'Self-employed',
    'Unemployed',
    'Retired',
    'Student',
  ];

  // Collateral condition options
  const collateralConditionOptions = [
    'New',
    'Excellent',
    'Good',
    'Fair',
    'Poor',
  ];

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/applications/', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
  });

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checked,
      });
      return;
    }
    
    // Handle numeric inputs
    if (['estimated_value', 'loan_amount', 'interest_rate', 'term_months', 'credit_score', 'monthly_income', 'employment_duration', 'existing_loan_amount'].includes(name)) {
      const numValue = value === '' ? '' : Number(value);
      setFormData({
        ...formData,
        [name]: numValue,
      });
      return;
    }
    
    // Handle other inputs
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle select input change
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Step 1 validation
    if (activeStep === 0) {
      if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
      if (!formData.branch_id) newErrors.branch_id = 'Branch is required';
      if (!formData.item_category) newErrors.item_category = 'Item category is required';
      if (!formData.item_description) newErrors.item_description = 'Item description is required';
      if (!formData.estimated_value) newErrors.estimated_value = 'Estimated value is required';
      if (!formData.loan_amount) newErrors.loan_amount = 'Loan amount is required';
      if (formData.loan_amount > formData.estimated_value) {
        newErrors.loan_amount = 'Loan amount cannot exceed estimated value';
      }
    }
    
    // Step 2 validation
    if (activeStep === 1) {
      if (!formData.employment_status) newErrors.employment_status = 'Employment status is required';
      if (formData.employment_status !== 'Unemployed' && !formData.employer_name) {
        newErrors.employer_name = 'Employer name is required';
      }
      if (formData.has_existing_loans && !formData.existing_loan_amount) {
        newErrors.existing_loan_amount = 'Existing loan amount is required';
      }
    }
    
    // Step 3 validation
    if (activeStep === 2) {
      if (!formData.collateral_description) newErrors.collateral_description = 'Collateral description is required';
      if (!formData.collateral_condition) newErrors.collateral_condition = 'Collateral condition is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateForm()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createApplicationMutation.mutate(formData);
    }
  };

  // Steps for the stepper
  const steps = [
    'Basic Information',
    'Financial Details',
    'Collateral Information',
    'Document Upload',
    'Review & Submit',
  ];

  // Get selected customer details
  const selectedCustomer = customers?.find((c: Customer) => c.id === formData.customer_id);

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {createApplicationMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(createApplicationMutation.error as any)?.response?.data?.detail || 'Failed to create application'}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Information */}
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Customer & Item Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.customer_id}>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleSelectChange}
                  label="Customer"
                >
                  <MenuItem value="">Select Customer</MenuItem>
                  {customers?.map((customer: Customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {`${customer.first_name} ${customer.last_name} (${customer.customer_code})`}
                    </MenuItem>
                  ))}
                </Select>
                {errors.customer_id && <FormHelperText>{errors.customer_id}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.branch_id}>
                <InputLabel>Branch</InputLabel>
                <Select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleSelectChange}
                  label="Branch"
                >
                  <MenuItem value="">Select Branch</MenuItem>
                  {branches?.map((branch: Branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.branch_id && <FormHelperText>{errors.branch_id}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.item_category}>
                <InputLabel>Item Category</InputLabel>
                <Select
                  name="item_category"
                  value={formData.item_category}
                  onChange={handleSelectChange}
                  label="Item Category"
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {itemCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.item_category && <FormHelperText>{errors.item_category}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Description"
                name="item_description"
                value={formData.item_description}
                onChange={handleInputChange}
                error={!!errors.item_description}
                helperText={errors.item_description}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Value"
                name="estimated_value"
                type="number"
                value={formData.estimated_value}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                error={!!errors.estimated_value}
                helperText={errors.estimated_value}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Loan Amount"
                name="loan_amount"
                type="number"
                value={formData.loan_amount}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                error={!!errors.loan_amount}
                helperText={errors.loan_amount}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Interest Rate (%)"
                name="interest_rate"
                type="number"
                value={formData.interest_rate}
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Term (Months)"
                name="term_months"
                type="number"
                value={formData.term_months}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        )}

        {/* Step 2: Financial Details */}
        {activeStep === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Financial Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Credit Score"
                name="credit_score"
                type="number"
                value={formData.credit_score}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Income"
                name="monthly_income"
                type="number"
                value={formData.monthly_income}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.employment_status}>
                <InputLabel>Employment Status</InputLabel>
                <Select
                  name="employment_status"
                  value={formData.employment_status}
                  onChange={handleSelectChange}
                  label="Employment Status"
                >
                  <MenuItem value="">Select Status</MenuItem>
                  {employmentStatusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
                {errors.employment_status && <FormHelperText>{errors.employment_status}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employer Name"
                name="employer_name"
                value={formData.employer_name}
                onChange={handleInputChange}
                disabled={formData.employment_status === 'Unemployed' || formData.employment_status === 'Student' || formData.employment_status === 'Retired'}
                error={!!errors.employer_name}
                helperText={errors.employer_name}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employment Duration (Months)"
                name="employment_duration"
                type="number"
                value={formData.employment_duration}
                onChange={handleInputChange}
                disabled={formData.employment_status === 'Unemployed' || formData.employment_status === 'Student' || formData.employment_status === 'Retired'}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="has_existing_loans"
                    checked={formData.has_existing_loans}
                    onChange={(e) => setFormData({ ...formData, has_existing_loans: e.target.checked })}
                  />
                }
                label="Has Existing Loans"
              />
            </Grid>

            {formData.has_existing_loans && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Existing Loan Amount"
                  name="existing_loan_amount"
                  type="number"
                  value={formData.existing_loan_amount}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  error={!!errors.existing_loan_amount}
                  helperText={errors.existing_loan_amount}
                />
              </Grid>
            )}
          </Grid>
        )}

        {/* Step 3: Collateral Information */}
        {activeStep === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Collateral Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Collateral Description"
                name="collateral_description"
                value={formData.collateral_description}
                onChange={handleInputChange}
                multiline
                rows={4}
                error={!!errors.collateral_description}
                helperText={errors.collateral_description}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.collateral_condition}>
                <InputLabel>Collateral Condition</InputLabel>
                <Select
                  name="collateral_condition"
                  value={formData.collateral_condition}
                  onChange={handleSelectChange}
                  label="Collateral Condition"
                >
                  <MenuItem value="">Select Condition</MenuItem>
                  {collateralConditionOptions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition}
                    </MenuItem>
                  ))}
                </Select>
                {errors.collateral_condition && <FormHelperText>{errors.collateral_condition}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        )}

        {/* Step 4: Document Upload */}
        {activeStep === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Document Upload
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <DocumentUpload
                applicationId={initialData?.id}
                onDocumentsUploaded={(docs) => setUploadedDocuments(docs)}
              />
            </Grid>
          </Grid>
        )}

        {/* Step 5: Review & Submit */}
        {activeStep === 4 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Review Application
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Customer</Typography>
                    <Typography variant="body1">
                      {selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Branch</Typography>
                    <Typography variant="body1">
                      {branches?.find((b: Branch) => b.id === formData.branch_id)?.name || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Item Category</Typography>
                    <Typography variant="body1">
                      {itemCategories.find((c) => c.value === formData.item_category)?.name || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Item Description</Typography>
                    <Typography variant="body1">{formData.item_description}</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Estimated Value</Typography>
                    <Typography variant="body1">{formatCurrency(formData.estimated_value)}</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Loan Amount</Typography>
                    <Typography variant="body1">{formatCurrency(formData.loan_amount)}</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Interest Rate</Typography>
                    <Typography variant="body1">{formData.interest_rate}%</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Term</Typography>
                    <Typography variant="body1">{formData.term_months} months</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Employment Status</Typography>
                    <Typography variant="body1">{formData.employment_status || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Employer</Typography>
                    <Typography variant="body1">{formData.employer_name || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Monthly Income</Typography>
                    <Typography variant="body1">
                      {formData.monthly_income ? formatCurrency(formData.monthly_income) : 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Existing Loans</Typography>
                    <Typography variant="body1">
                      {formData.has_existing_loans
                        ? `Yes (${formatCurrency(formData.existing_loan_amount)})`
                        : 'No'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Collateral Condition</Typography>
                    <Typography variant="body1">{formData.collateral_condition || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Collateral Description</Typography>
                    <Typography variant="body1">{formData.collateral_description || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Notes</Typography>
                    <Typography variant="body1">{formData.notes || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Uploaded Documents</Typography>
                    {uploadedDocuments.length > 0 ? (
                      <Box sx={{ mt: 1 }}>
                        {uploadedDocuments.map((doc, index) => (
                          <Typography key={index} variant="body2">
                            • {doc.file_name} ({doc.document_type})
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2">No documents uploaded</Typography>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? onCancel : handleBack}
            startIcon={activeStep > 0 ? <BackIcon /> : undefined}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            endIcon={activeStep < steps.length - 1 ? <NextIcon /> : undefined}
            disabled={createApplicationMutation.isPending}
          >
            {activeStep === steps.length - 1 ? (
              createApplicationMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Submit Application'
              )
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default LoanApplicationForm;
