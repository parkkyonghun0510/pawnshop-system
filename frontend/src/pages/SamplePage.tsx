import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  TextField,
  Card,
  CardContent,
  CardActions,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  PageContainer,
  DataTable,
  StatusChip,
  FormContainer,
  ModalDialog,
  ConfirmDialog,
  Notification,
} from '../components/ui';

// Sample data
const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'pending', role: 'Manager' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'active', role: 'User' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'active', role: 'User' },
];

// Column definitions
const columns = [
  { id: 'id', label: 'ID', minWidth: 50 },
  { id: 'name', label: 'Name', minWidth: 150 },
  { id: 'email', label: 'Email', minWidth: 200 },
  {
    id: 'status',
    label: 'Status',
    minWidth: 120,
    format: (value: string) => (
      <StatusChip status={value as any} />
    ),
  },
  { id: 'role', label: 'Role', minWidth: 120 },
];

const SamplePage: React.FC = () => {
  // State for various UI components
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setFormOpen(false);
      setNotificationType('success');
      setNotificationOpen(true);
    }, 1500);
  };

  // Handle item edit
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  // Handle item delete
  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setConfirmOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setConfirmOpen(false);
      setNotificationType('success');
      setNotificationOpen(true);
    }, 1500);
  };

  // Handle modal actions
  const handleModalAction = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setModalOpen(false);
      setNotificationType('info');
      setNotificationOpen(true);
    }, 1500);
  };

  return (
    <PageContainer
      title="Sample Pages"
      subtitle="Demonstrating UI components"
      breadcrumbs={[
        { label: 'Home', path: '/', icon: <AddIcon sx={{ mr: 0.5 }} fontSize="small" /> },
        { label: 'Sample Page' },
      ]}
      actions={
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedItem(null);
            setFormOpen(true);
          }}
        >
          Add New
        </Button>
      }
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Cards and Status Chips
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Status
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This card demonstrates the active status chip.
                </Typography>
                <StatusChip status="active" />
              </CardContent>
              <Divider />
              <CardActions>
                <Button size="small">View Details</Button>
                <Button size="small" color="primary">
                  Edit
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Status
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This card demonstrates the pending status chip.
                </Typography>
                <StatusChip status="pending" />
              </CardContent>
              <Divider />
              <CardActions>
                <Button size="small">View Details</Button>
                <Button size="small" color="primary">
                  Edit
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inactive Status
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This card demonstrates the inactive status chip.
                </Typography>
                <StatusChip status="inactive" />
              </CardContent>
              <Divider />
              <CardActions>
                <Button size="small">View Details</Button>
                <Button size="small" color="primary">
                  Edit
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Data Table
        </Typography>
        <DataTable
          columns={columns}
          data={sampleData}
          keyField="id"
          title="Sample Data"
          loading={loading}
          showActions
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          UI Components
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setFormOpen(true)}
            >
              Open Form
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => setModalOpen(true)}
            >
              Open Modal
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => setConfirmOpen(true)}
            >
              Open Confirm Dialog
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Form Container */}
      {formOpen && (
        <FormContainer
          title={selectedItem ? 'Edit Item' : 'Add New Item'}
          subtitle={selectedItem ? `Editing ${selectedItem.name}` : 'Create a new item'}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
          loading={loading}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                fullWidth
                defaultValue={selectedItem?.name || ''}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                fullWidth
                defaultValue={selectedItem?.email || ''}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Role"
                fullWidth
                defaultValue={selectedItem?.role || ''}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Status"
                fullWidth
                defaultValue={selectedItem?.status || ''}
                required
              />
            </Grid>
          </Grid>
        </FormContainer>
      )}

      {/* Modal Dialog */}
      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Sample Modal"
        subtitle="This is a sample modal dialog"
        onPrimaryAction={handleModalAction}
        onSecondaryAction={() => setModalOpen(false)}
        primaryActionLabel="Save Changes"
        secondaryActionLabel="Cancel"
        loading={loading}
      >
        <Typography variant="body1" paragraph>
          This is a sample modal dialog that demonstrates the ModalDialog component.
        </Typography>
        <TextField
          label="Sample Input"
          fullWidth
          margin="normal"
        />
      </ModalDialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${selectedItem?.name || 'this item'}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        type="delete"
        loading={loading}
      />

      {/* Notification */}
      <Notification
        open={notificationOpen}
        type={notificationType}
        message={
          notificationType === 'success'
            ? 'Operation completed successfully!'
            : notificationType === 'error'
              ? 'An error occurred!'
              : 'Information'
        }
        description={
          notificationType === 'success'
            ? 'Your changes have been saved.'
            : notificationType === 'error'
              ? 'Please try again later.'
              : 'This is an informational message.'
        }
        onClose={() => setNotificationOpen(false)}
      />
    </PageContainer>
  );
};

export default SamplePage;
