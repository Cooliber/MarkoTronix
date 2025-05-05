import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Heading,
  Text,
  Grid,
  FormControl,
  FormLabel,
  Input,
  Button,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Switch,
  useToast,
  Spinner,
  Flex,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import Head from 'next/head';
import { api } from '@/api/axios';
import { useLocalStorage } from '@/hooks/usehooks';

// Define the configuration interface
interface ConfigSection {
  [key: string]: string | boolean | number;
}

interface Config {
  api: {
    apiUrl: string;
    websocketUrl: string;
  };
  mail: {
    mailServer: string;
    mailPort: string;
    mailUsername: string;
    mailPassword: string;
    mailUseTls: boolean;
    mailCheckInterval: string;
  };
  offer: {
    openaiApiKey: string;
    defaultLlmModel: string;
  };
  link: {
    secretKey: string;
    docusignClientId: string;
    docusignUserId: string;
    docusignAccountId: string;
    hellosignApiKey: string;
  };
  database: {
    databaseUrl: string;
    redisUrl: string;
  };
  supabase: {
    supabaseUrl: string;
    supabaseKey: string;
  };
}

// Default configuration values
const defaultConfig: Config = {
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
  // Use localStorage to persist settings between sessions
  const [savedConfig, setSavedConfig, removeSavedConfig] = useLocalStorage<Config>('hvac-settings', defaultConfig);
  
  // State for the current form values
  const [config, setConfig] = useState<Config>(savedConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Password visibility toggles
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // Toast for notifications
  const toast = useToast();
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load configuration on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await api.get('/settings');
        if (response.data) {
          const loadedConfig = response.data;
          setConfig(loadedConfig);
          setSavedConfig(loadedConfig);
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        toast({
          title: 'Failed to load configuration',
          description: 'Using saved or default values.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Handle input changes
  const handleChange = (section: keyof Config, field: string, value: string | boolean) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: string) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.post('/settings', config);
      setSavedConfig(config);
      toast({
        title: 'Configuration saved',
        description: 'Your settings have been saved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Failed to save configuration',
        description: 'There was an error saving your settings.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default configuration
  const handleReset = () => {
    setConfig(defaultConfig);
    toast({
      title: 'Reset to defaults',
      description: 'Configuration has been reset to default values. Click Save to apply.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Flex height="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <>
      <Head>
        <title>System Settings - HVAC CRM</title>
      </Head>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading as="h1" size="xl" mb={2}>
            System Settings
          </Heading>
          <Text color="gray.500">
            Configure your HVAC CRM system settings. Changes will be applied to the microservices on restart.
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid templateColumns="1fr" gap={6}>
            {/* API Configuration */}
            <Accordion defaultIndex={[0]} allowMultiple>
              <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={4}>
                <h2>
                  <AccordionButton bg={bgColor} borderTopRadius="md">
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      API Configuration
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <FormControl>
                      <FormLabel>API URL</FormLabel>
                      <Input
                        value={config.api.apiUrl}
                        onChange={(e) => handleChange('api', 'apiUrl', e.target.value)}
                        placeholder="http://localhost:18000/api"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>WebSocket URL</FormLabel>
                      <Input
                        value={config.api.websocketUrl}
                        onChange={(e) => handleChange('api', 'websocketUrl', e.target.value)}
                        placeholder="ws://localhost:18000/ws"
                      />
                    </FormControl>
                  </Grid>
                </AccordionPanel>
              </AccordionItem>

              {/* Mail Service Configuration */}
              <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={4}>
                <h2>
                  <AccordionButton bg={bgColor} borderTopRadius="md">
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Mail Service Configuration
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <FormControl>
                      <FormLabel>Mail Server</FormLabel>
                      <Input
                        value={config.mail.mailServer}
                        onChange={(e) => handleChange('mail', 'mailServer', e.target.value)}
                        placeholder="imap.example.com"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Mail Port</FormLabel>
                      <Input
                        value={config.mail.mailPort}
                        onChange={(e) => handleChange('mail', 'mailPort', e.target.value)}
                        placeholder="993"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Mail Username</FormLabel>
                      <Input
                        value={config.mail.mailUsername}
                        onChange={(e) => handleChange('mail', 'mailUsername', e.target.value)}
                        placeholder="user@example.com"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Mail Password</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords['mailPassword'] ? 'text' : 'password'}
                          value={config.mail.mailPassword}
                          onChange={(e) => handleChange('mail', 'mailPassword', e.target.value)}
                          placeholder="Password"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPasswords['mailPassword'] ? 'Hide password' : 'Show password'}
                            icon={showPasswords['mailPassword'] ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => togglePasswordVisibility('mailPassword')}
                            variant="ghost"
                            size="sm"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Use TLS</FormLabel>
                      <Switch
                        isChecked={config.mail.mailUseTls as boolean}
                        onChange={(e) => handleChange('mail', 'mailUseTls', e.target.checked)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Check Interval (seconds)</FormLabel>
                      <Input
                        value={config.mail.mailCheckInterval}
                        onChange={(e) => handleChange('mail', 'mailCheckInterval', e.target.value)}
                        placeholder="60"
                      />
                    </FormControl>
                  </Grid>
                </AccordionPanel>
              </AccordionItem>

              {/* Offer Generation Configuration */}
              <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={4}>
                <h2>
                  <AccordionButton bg={bgColor} borderTopRadius="md">
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Offer Generation Configuration
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <FormControl>
                      <FormLabel>OpenAI API Key</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords['openaiApiKey'] ? 'text' : 'password'}
                          value={config.offer.openaiApiKey}
                          onChange={(e) => handleChange('offer', 'openaiApiKey', e.target.value)}
                          placeholder="sk-..."
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPasswords['openaiApiKey'] ? 'Hide API key' : 'Show API key'}
                            icon={showPasswords['openaiApiKey'] ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => togglePasswordVisibility('openaiApiKey')}
                            variant="ghost"
                            size="sm"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Default LLM Model</FormLabel>
                      <Input
                        value={config.offer.defaultLlmModel}
                        onChange={(e) => handleChange('offer', 'defaultLlmModel', e.target.value)}
                        placeholder="gpt-3.5-turbo"
                      />
                    </FormControl>
                  </Grid>
                </AccordionPanel>
              </AccordionItem>

              {/* Link Service Configuration */}
              <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={4}>
                <h2>
                  <AccordionButton bg={bgColor} borderTopRadius="md">
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Link & e-Signature Configuration
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <FormControl>
                      <FormLabel>Secret Key</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords['secretKey'] ? 'text' : 'password'}
                          value={config.link.secretKey}
                          onChange={(e) => handleChange('link', 'secretKey', e.target.value)}
                          placeholder="Secret key for JWT tokens"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPasswords['secretKey'] ? 'Hide secret key' : 'Show secret key'}
                            icon={showPasswords['secretKey'] ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => togglePasswordVisibility('secretKey')}
                            variant="ghost"
                            size="sm"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    
                    <Box gridColumn="1 / -1">
                      <Text fontWeight="bold" mt={4} mb={2}>DocuSign Configuration</Text>
                    </Box>
                    
                    <FormControl>
                      <FormLabel>DocuSign Client ID</FormLabel>
                      <Input
                        value={config.link.docusignClientId}
                        onChange={(e) => handleChange('link', 'docusignClientId', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>DocuSign User ID</FormLabel>
                      <Input
                        value={config.link.docusignUserId}
                        onChange={(e) => handleChange('link', 'docusignUserId', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>DocuSign Account ID</FormLabel>
                      <Input
                        value={config.link.docusignAccountId}
                        onChange={(e) => handleChange('link', 'docusignAccountId', e.target.value)}
                      />
                    </FormControl>
                    
                    <Box gridColumn="1 / -1">
                      <Text fontWeight="bold" mt={4} mb={2}>HelloSign Configuration</Text>
                    </Box>
                    
                    <FormControl>
                      <FormLabel>HelloSign API Key</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords['hellosignApiKey'] ? 'text' : 'password'}
                          value={config.link.hellosignApiKey}
                          onChange={(e) => handleChange('link', 'hellosignApiKey', e.target.value)}
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPasswords['hellosignApiKey'] ? 'Hide API key' : 'Show API key'}
                            icon={showPasswords['hellosignApiKey'] ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => togglePasswordVisibility('hellosignApiKey')}
                            variant="ghost"
                            size="sm"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                  </Grid>
                </AccordionPanel>
              </AccordionItem>

              {/* Database Configuration */}
              <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={4}>
                <h2>
                  <AccordionButton bg={bgColor} borderTopRadius="md">
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Database Configuration
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <FormControl>
                      <FormLabel>Database URL</FormLabel>
                      <Input
                        value={config.database.databaseUrl}
                        onChange={(e) => handleChange('database', 'databaseUrl', e.target.value)}
                        placeholder="postgresql://postgres:postgres@postgres:15432/hvac_crm"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Redis URL</FormLabel>
                      <Input
                        value={config.database.redisUrl}
                        onChange={(e) => handleChange('database', 'redisUrl', e.target.value)}
                        placeholder="redis://redis:16379/0"
                      />
                    </FormControl>
                  </Grid>
                </AccordionPanel>
              </AccordionItem>

              {/* Supabase Configuration */}
              <AccordionItem border="1px" borderColor={borderColor} borderRadius="md" mb={4}>
                <h2>
                  <AccordionButton bg={bgColor} borderTopRadius="md">
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Supabase Configuration
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                    <FormControl>
                      <FormLabel>Supabase URL</FormLabel>
                      <Input
                        value={config.supabase.supabaseUrl}
                        onChange={(e) => handleChange('supabase', 'supabaseUrl', e.target.value)}
                        placeholder="https://your-project.supabase.co"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Supabase Key</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPasswords['supabaseKey'] ? 'text' : 'password'}
                          value={config.supabase.supabaseKey}
                          onChange={(e) => handleChange('supabase', 'supabaseKey', e.target.value)}
                          placeholder="your-supabase-key"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPasswords['supabaseKey'] ? 'Hide key' : 'Show key'}
                            icon={showPasswords['supabaseKey'] ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => togglePasswordVisibility('supabaseKey')}
                            variant="ghost"
                            size="sm"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                  </Grid>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            {/* Action Buttons */}
            <Flex justifyContent="space-between" mt={4}>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={handleReset}
                isDisabled={saving}
              >
                Reset to Defaults
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={saving}
                loadingText="Saving..."
              >
                Save Configuration
              </Button>
            </Flex>
          </Grid>
        </form>
      </Container>
    </>
  );
}