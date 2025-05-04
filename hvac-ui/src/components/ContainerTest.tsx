import { useState, useEffect } from 'react';
import { Box, Heading, Text, Button, Code, VStack, Badge, Spinner, Alert, AlertIcon, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';

interface ContainerStatus {
  status: string;
  message: string;
  container: string;
  environment: string;
  timestamp: string;
  nextVersion?: string;
  nodeVersion?: string;
}

export default function ContainerTest() {
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiContainerStatus, setApiContainerStatus] = useState<ContainerStatus | null>(null);
  
  const [uiLoading, setUiLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiContainerStatus, setUiContainerStatus] = useState<ContainerStatus | null>(null);

  const testApiContainer = async () => {
    setApiLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch('/api/container-test');
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setApiContainerStatus(data);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setApiLoading(false);
    }
  };
  
  const testUiContainer = async () => {
    setUiLoading(true);
    setUiError(null);
    
    try {
      const response = await fetch('/api/container-test');
      
      if (!response.ok) {
        throw new Error(`UI API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setUiContainerStatus(data);
    } catch (err) {
      setUiError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setUiLoading(false);
    }
  };

  useEffect(() => {
    // Test containers on component mount
    testApiContainer();
    testUiContainer();
  }, []);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>Container Status Test</Heading>
      
      <Tabs variant="enclosed" colorScheme="blue" mb={4}>
        <TabList>
          <Tab>API Container</Tab>
          <Tab>UI Container</Tab>
        </TabList>
        
        <TabPanels>
          {/* API Container Tab */}
          <TabPanel>
            {apiLoading && (
              <Box textAlign="center" py={4}>
                <Spinner size="lg" />
                <Text mt={2}>Testing API container...</Text>
              </Box>
            )}
            
            {apiError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {apiError}
              </Alert>
            )}
            
            {apiContainerStatus && (
              <VStack align="start" spacing={3} mb={4}>
                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Badge colorScheme={apiContainerStatus.status === 'ok' ? 'green' : 'red'}>
                    {apiContainerStatus.status}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Message:</Text>
                  <Text>{apiContainerStatus.message}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Container:</Text>
                  <Text>{apiContainerStatus.container}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Environment:</Text>
                  <Badge colorScheme={apiContainerStatus.environment === 'production' ? 'purple' : 'blue'}>
                    {apiContainerStatus.environment}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Timestamp:</Text>
                  <Text>{new Date(apiContainerStatus.timestamp).toLocaleString()}</Text>
                </Box>
              </VStack>
            )}
            
            <Button 
              colorScheme="blue" 
              onClick={testApiContainer} 
              isLoading={apiLoading}
              loadingText="Testing"
            >
              Test API Container Again
            </Button>
          </TabPanel>
          
          {/* UI Container Tab */}
          <TabPanel>
            {uiLoading && (
              <Box textAlign="center" py={4}>
                <Spinner size="lg" />
                <Text mt={2}>Testing UI container...</Text>
              </Box>
            )}
            
            {uiError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {uiError}
              </Alert>
            )}
            
            {uiContainerStatus && (
              <VStack align="start" spacing={3} mb={4}>
                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Badge colorScheme={uiContainerStatus.status === 'ok' ? 'green' : 'red'}>
                    {uiContainerStatus.status}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Message:</Text>
                  <Text>{uiContainerStatus.message}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Container:</Text>
                  <Text>{uiContainerStatus.container}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Environment:</Text>
                  <Badge colorScheme={uiContainerStatus.environment === 'production' ? 'purple' : 'blue'}>
                    {uiContainerStatus.environment}
                  </Badge>
                </Box>
                
                {uiContainerStatus.nextVersion && (
                  <Box>
                    <Text fontWeight="bold">Next.js Version:</Text>
                    <Text>{uiContainerStatus.nextVersion}</Text>
                  </Box>
                )}
                
                {uiContainerStatus.nodeVersion && (
                  <Box>
                    <Text fontWeight="bold">Node.js Version:</Text>
                    <Text>{uiContainerStatus.nodeVersion}</Text>
                  </Box>
                )}
                
                <Box>
                  <Text fontWeight="bold">Timestamp:</Text>
                  <Text>{new Date(uiContainerStatus.timestamp).toLocaleString()}</Text>
                </Box>
              </VStack>
            )}
            
            <Button 
              colorScheme="blue" 
              onClick={testUiContainer} 
              isLoading={uiLoading}
              loadingText="Testing"
            >
              Test UI Container Again
            </Button>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}