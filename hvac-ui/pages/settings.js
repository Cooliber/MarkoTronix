import { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, TextField, Button, Card, CardContent, CardHeader, Switch, FormControlLabel, Divider, Snackbar, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Head from 'next/head';
import { api } from '../api/axios';

// Default configuration values
const defaultConfig = {
  api: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18000/api',
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:18000/ws',
  },
  mail: {
    mailServer: '',
    mailPort: '993',
    mailUsername: '',
    mailPassword: '',
    mailUseTls: true,
    mailCheckInterval: '60',
  },
  offer: {
    openaiApiKey: '',
    defaultLlmModel: 'gpt-3.5-turbo',
  },
  link: {
    secretKey: '',
    docusignClientId: '',
    docusignUserId: '',
    docusignAccountId: '',
    hellosignApiKey: '',
  },
  database: {
    databaseUrl: 'postgresql://postgres:postgres@postgres:15432/hvac_crm',
    redisUrl: 'redis://redis:16379/0',
  },
  supabase: {
    supabaseUrl: '',
    supabaseKey: '',
  },
};

export default function Settings() {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load configuration on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await api.get('/settings');
        if (response.data) {
          setConfig(response.data);
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load configuration. Using default values.',
          severity: 'warning',
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Handle input changes
  const handleChange = (section, field, value) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/settings', config);
      setSnackbar({
        open: true,
        message: 'Configuration saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save configuration.',
        severity: 'error',
      });
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">Loading configuration...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>System Settings - HVAC CRM</title>
      </Head>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Configure your HVAC CRM system settings. Changes will be applied to the microservices on restart.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* API Configuration */}
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">API Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="API URL"
                        value={config.api.apiUrl}
                        onChange={(e) => handleChange('api', 'apiUrl', e.target.value)}
                        helperText="Main API gateway URL"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="WebSocket URL"
                        value={config.api.websocketUrl}
                        onChange={(e) => handleChange('api', 'websocketUrl', e.target.value)}
                        helperText="WebSocket URL for real-time updates"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Mail Service Configuration */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Mail Service Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Mail Server"
                        value={config.mail.mailServer}
                        onChange={(e) => handleChange('mail', 'mailServer', e.target.value)}
                        helperText="IMAP mail server hostname"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Mail Port"
                        value={config.mail.mailPort}
                        onChange={(e) => handleChange('mail', 'mailPort', e.target.value)}
                        helperText="IMAP mail server port (usually 993 for SSL)"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Mail Username"
                        value={config.mail.mailUsername}
                        onChange={(e) => handleChange('mail', 'mailUsername', e.target.value)}
                        helperText="Email address for mail fetching"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Mail Password"
                        value={config.mail.mailPassword}
                        onChange={(e) => handleChange('mail', 'mailPassword', e.target.value)}
                        helperText="Password for mail account"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.mail.mailUseTls}
                            onChange={(e) => handleChange('mail', 'mailUseTls', e.target.checked)}
                          />
                        }
                        label="Use TLS"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Check Interval (seconds)"
                        value={config.mail.mailCheckInterval}
                        onChange={(e) => handleChange('mail', 'mailCheckInterval', e.target.value)}
                        helperText="How often to check for new emails (in seconds)"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Offer Generation Configuration */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Offer Generation Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="OpenAI API Key"
                        value={config.offer.openaiApiKey}
                        onChange={(e) => handleChange('offer', 'openaiApiKey', e.target.value)}
                        helperText="API key for OpenAI services"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Default LLM Model"
                        value={config.offer.defaultLlmModel}
                        onChange={(e) => handleChange('offer', 'defaultLlmModel', e.target.value)}
                        helperText="Default language model to use (e.g., gpt-3.5-turbo)"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Link Service Configuration */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Link & e-Signature Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Secret Key"
                        value={config.link.secretKey}
                        onChange={(e) => handleChange('link', 'secretKey', e.target.value)}
                        helperText="Secret key for JWT token generation"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>DocuSign Configuration</Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="DocuSign Client ID"
                        value={config.link.docusignClientId}
                        onChange={(e) => handleChange('link', 'docusignClientId', e.target.value)}
                        helperText="DocuSign Integration Key"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="DocuSign User ID"
                        value={config.link.docusignUserId}
                        onChange={(e) => handleChange('link', 'docusignUserId', e.target.value)}
                        helperText="DocuSign User ID"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="DocuSign Account ID"
                        value={config.link.docusignAccountId}
                        onChange={(e) => handleChange('link', 'docusignAccountId', e.target.value)}
                        helperText="DocuSign Account ID"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>HelloSign Configuration</Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="HelloSign API Key"
                        value={config.link.hellosignApiKey}
                        onChange={(e) => handleChange('link', 'hellosignApiKey', e.target.value)}
                        helperText="HelloSign API Key"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Database Configuration */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Database Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Database URL"
                        value={config.database.databaseUrl}
                        onChange={(e) => handleChange('database', 'databaseUrl', e.target.value)}
                        helperText="PostgreSQL connection string"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Redis URL"
                        value={config.database.redisUrl}
                        onChange={(e) => handleChange('database', 'redisUrl', e.target.value)}
                        helperText="Redis connection string"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Supabase Configuration */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Supabase Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Supabase URL"
                        value={config.supabase.supabaseUrl}
                        onChange={(e) => handleChange('supabase', 'supabaseUrl', e.target.value)}
                        helperText="Supabase project URL"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Supabase Key"
                        value={config.supabase.supabaseKey}
                        onChange={(e) => handleChange('supabase', 'supabaseKey', e.target.value)}
                        helperText="Supabase service role key"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Save Configuration
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
