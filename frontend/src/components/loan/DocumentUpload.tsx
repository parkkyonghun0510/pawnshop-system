import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  InsertDriveFile as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  AttachFile as AttachmentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

interface DocumentUploadProps {
  applicationId?: number;
  onDocumentsUploaded?: (documents: any[]) => void;
  readOnly?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  applicationId,
  onDocumentsUploaded,
  readOnly = false,
}) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Document types
  const documentTypes = [
    { value: 'id_card', label: 'ID Card' },
    { value: 'proof_of_income', label: 'Proof of Income' },
    { value: 'proof_of_address', label: 'Proof of Address' },
    { value: 'item_photo', label: 'Item Photo' },
    { value: 'item_receipt', label: 'Item Receipt' },
    { value: 'appraisal_certificate', label: 'Appraisal Certificate' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch documents if applicationId is provided
  const {
    data: documents,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['application-documents', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      const response = await apiClient.get(`/applications/${applicationId}/documents`);
      return response.data;
    },
    enabled: !!applicationId,
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, type, notes }: { file: File; type: string; notes: string }) => {
      if (!applicationId) {
        throw new Error('Application ID is required');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', type);
      if (notes) formData.append('notes', notes);

      const response = await apiClient.post(
        `/applications/${applicationId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-documents', applicationId] });
      setSelectedFile(null);
      setDocumentType('');
      setNotes('');
      refetchDocuments();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to upload document');
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      if (!applicationId) {
        throw new Error('Application ID is required');
      }
      await apiClient.delete(`/applications/${applicationId}/documents/${documentId}`);
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-documents', applicationId] });
      refetchDocuments();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to delete document');
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Handle document type selection
  const handleDocumentTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDocumentType(event.target.value as string);
  };

  // Handle notes change
  const handleNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(event.target.value);
  };

  // Handle document upload
  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setError('Please select a file and document type');
      return;
    }

    try {
      await uploadDocumentMutation.mutateAsync({
        file: selectedFile,
        type: documentType,
        notes,
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Handle document deletion
  const handleDelete = async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocumentMutation.mutateAsync(documentId);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  // Get icon based on file type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon />;
    } else if (mimeType === 'application/pdf') {
      return <PdfIcon />;
    } else if (mimeType.startsWith('text/')) {
      return <DocumentIcon />;
    } else {
      return <AttachmentIcon />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Update parent component when documents change
  useEffect(() => {
    if (documents && onDocumentsUploaded) {
      onDocumentsUploaded(documents);
    }
  }, [documents, onDocumentsUploaded]);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!readOnly && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Upload New Document
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadIcon />}
                sx={{ height: '56px' }}
              >
                {selectedFile ? selectedFile.name : 'Select File'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  onChange={handleDocumentTypeChange}
                  label="Document Type"
                >
                  <MenuItem value="">Select Type</MenuItem>
                  {documentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={handleNotesChange}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleUpload}
                disabled={!selectedFile || !documentType || uploadDocumentMutation.isPending}
                sx={{ height: '56px' }}
              >
                {uploadDocumentMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Upload'
                )}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Typography variant="subtitle1" gutterBottom>
        Uploaded Documents
      </Typography>

      {documentsLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : documents?.length > 0 ? (
        <List>
          {documents.map((document: any) => (
            <React.Fragment key={document.id}>
              <ListItem>
                <ListItemIcon>{getFileIcon(document.mime_type)}</ListItemIcon>
                <ListItemText
                  primary={document.file_name}
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" component="span">
                        {formatFileSize(document.file_size)} • Uploaded{' '}
                        {new Date(document.uploaded_at).toLocaleDateString()}
                      </Typography>
                      {document.notes && (
                        <Typography variant="body2" color="textSecondary">
                          Note: {document.notes}
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                />
                <Chip
                  label={documentTypes.find((t) => t.value === document.document_type)?.label || document.document_type}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                {!readOnly && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(document.id)}
                      disabled={deleteDocumentMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <FileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" color="textSecondary">
            No documents uploaded yet
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DocumentUpload;
