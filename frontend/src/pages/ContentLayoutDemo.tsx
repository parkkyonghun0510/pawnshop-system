import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Switch, 
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Home as HomeIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';

import { 
  PageContainer, 
  ContentCard, 
  ContentSection, 
  GridLayout, 
  GridItem,
  FormContainer,
} from '../components/ui';

const ContentLayoutDemo = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  return (
    <PageContainer
      title="Content Layout Demo"
      subtitle="Demonstrating the new content layout components"
      breadcrumbs={[
        { label: 'Home', path: '/', icon: <HomeIcon sx={{ mr: 0.5 }} fontSize="small" /> },
        { label: 'Content Layout Demo' },
      ]}
      actions={
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Add New
        </Button>
      }
      loading={loading}
      refreshable
      onRefresh={handleRefresh}
      collapsible
      defaultCollapsed={false}
      headerDivider
    >
      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="content layout tabs"
        >
          <Tab label="Cards Layout" />
          <Tab label="Sections Layout" />
          <Tab label="Form Layout" />
        </Tabs>
      </Box>

      {/* Cards Layout Tab */}
      {tabValue === 0 && (
        <>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2 
          }}>
            <Typography variant="h6">Cards Layout Example</Typography>
            <Box>
              <Tooltip title={viewMode === 'grid' ? "List View" : "Grid View"}>
                <IconButton onClick={toggleViewMode}>
                  {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <GridLayout spacing={3}>
            <GridItem xs={12} md={6} lg={4}>
              <ContentCard
                title="Active Status"
                subtitle="This card demonstrates the active status chip"
                icon={<DashboardIcon color="primary" />}
                refreshable
                onRefresh={handleRefresh}
                loading={loading}
                footer={
                  <Button size="small" color="primary">
                    View Details
                  </Button>
                }
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This is a content card with an active status. It demonstrates the ContentCard component with various props.
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'success.light', 
                    color: 'success.dark',
                    py: 1,
                    px: 2,
                    borderRadius: 1,
                    display: 'inline-block'
                  }}>
                    Active
                  </Box>
                </Box>
              </ContentCard>
            </GridItem>

            <GridItem xs={12} md={6} lg={4}>
              <ContentCard
                title="Pending Status"
                subtitle="This card demonstrates the pending status chip"
                icon={<InfoIcon color="warning" />}
                expandable
                defaultExpanded={true}
                headerBgColor={theme.palette.warning.main}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This is a content card with a pending status. It demonstrates the expandable feature of the ContentCard component.
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'warning.light', 
                    color: 'warning.dark',
                    py: 1,
                    px: 2,
                    borderRadius: 1,
                    display: 'inline-block'
                  }}>
                    Pending
                  </Box>
                </Box>
              </ContentCard>
            </GridItem>

            <GridItem xs={12} md={6} lg={4}>
              <ContentCard
                title="Inactive Status"
                subtitle="This card demonstrates the inactive status chip"
                icon={<SettingsIcon color="error" />}
                variant="outlined"
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This is a content card with an inactive status. It demonstrates the outlined variant of the ContentCard component.
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'text.disabled', 
                    color: 'background.paper',
                    py: 1,
                    px: 2,
                    borderRadius: 1,
                    display: 'inline-block'
                  }}>
                    Inactive
                  </Box>
                </Box>
              </ContentCard>
            </GridItem>
          </GridLayout>
        </>
      )}

      {/* Sections Layout Tab */}
      {tabValue === 1 && (
        <>
          <ContentSection
            title="Basic Section"
            subtitle="This is a basic content section"
            icon={<DashboardIcon color="primary" />}
            actions={
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            }
          >
            <Typography paragraph>
              This is a basic content section that demonstrates the ContentSection component. 
              It can be used to organize content into logical sections on a page.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="body2">
                Content sections can contain any type of content, including text, forms, tables, and more.
              </Typography>
            </Box>
          </ContentSection>

          <ContentSection
            title="Collapsible Section"
            subtitle="This section can be collapsed"
            icon={<InfoIcon color="info" />}
            collapsible
            defaultExpanded={true}
          >
            <Typography paragraph>
              This is a collapsible content section. Click the toggle button next to the title to collapse or expand this section.
            </Typography>
            <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="info.dark">
                Collapsible sections are useful for organizing content that doesn't need to be visible all the time.
              </Typography>
            </Box>
          </ContentSection>

          <ContentSection
            variant="paper"
            elevation={2}
            title="Paper Section"
            subtitle="This section uses the paper variant"
            icon={<SettingsIcon color="secondary" />}
          >
            <Typography paragraph>
              This content section uses the paper variant, which gives it a card-like appearance with elevation.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary">Primary Action</Button>
              <Button variant="outlined" color="secondary">Secondary Action</Button>
            </Box>
          </ContentSection>
        </>
      )}

      {/* Form Layout Tab */}
      {tabValue === 2 && (
        <FormContainer
          title="Sample Form"
          subtitle="This demonstrates the enhanced FormContainer component"
          description="Fill out this form to see how the FormContainer component works with various form elements."
          loading={loading}
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
            }, 1500);
          }}
          onCancel={() => {}}
          collapsible
          helpText="This form is for demonstration purposes only. The data entered here will not be saved or processed."
        >
          <GridLayout spacing={3}>
            <GridItem xs={12} md={6}>
              <TextField
                label="Name"
                fullWidth
                required
              />
            </GridItem>
            <GridItem xs={12} md={6}>
              <TextField
                label="Email"
                fullWidth
                required
                type="email"
              />
            </GridItem>
            <GridItem xs={12}>
              <TextField
                label="Message"
                fullWidth
                multiline
                rows={4}
              />
            </GridItem>
            <GridItem xs={12}>
              <FormControlLabel
                control={<Switch />}
                label="Subscribe to newsletter"
              />
            </GridItem>
          </GridLayout>
        </FormContainer>
      )}
    </PageContainer>
  );
};

export default ContentLayoutDemo;
