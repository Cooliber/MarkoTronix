import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  Badge, 
  Button, 
  Accordion, 
  AccordionItem, 
  AccordionButton, 
  AccordionPanel, 
  AccordionIcon,
  Code,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';

interface EnvironmentInfo {
  browser: {
    userAgent: string;
    platform: string;
    language: string;
    cookiesEnabled: boolean;
    online: boolean;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
  };
  performance: {
    memory?: {
      jsHeapSizeLimit?: number;
      totalJSHeapSize?: number;
      usedJSHeapSize?: number;
    };
    navigation?: {
      type?: number;
      redirectCount?: number;
    };
    timing?: Record<string, number>;
  };
  features: {
    localStorage: boolean;
    sessionStorage: boolean;
    webWorkers: boolean;
    serviceWorkers: boolean;
    webSockets: boolean;
    webGL: boolean;
    canvas: boolean;
  };
  timestamp: string;
}

export default function ContainerEnvironmentTest() {
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testEnvironment = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test browser information
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio,
      };
      
      // Test performance information
      const performanceInfo: any = {};
      
      if (window.performance) {
        if ('memory' in window.performance) {
          performanceInfo.memory = {
            jsHeapSizeLimit: (window.performance as any).memory?.jsHeapSizeLimit,
            totalJSHeapSize: (window.performance as any).memory?.totalJSHeapSize,
            usedJSHeapSize: (window.performance as any).memory?.usedJSHeapSize,
          };
        }
        
        if ('navigation' in window.performance) {
          performanceInfo.navigation = {
            type: (window.performance as any).navigation?.type,
            redirectCount: (window.performance as any).navigation?.redirectCount,
          };
        }
        
        if ('timing' in window.performance) {
          performanceInfo.timing = (window.performance as any).timing;
        }
      }
      
      // Test feature support
      const featuresInfo = {
        localStorage: testLocalStorage(),
        sessionStorage: testSessionStorage(),
        webWorkers: 'Worker' in window,
        serviceWorkers: 'serviceWorker' in navigator,
        webSockets: 'WebSocket' in window,
        webGL: testWebGL(),
        canvas: testCanvas(),
      };
      
      setEnvironmentInfo({
        browser: browserInfo,
        performance: performanceInfo,
        features: featuresInfo,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Test localStorage support
  const testLocalStorage = () => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Test sessionStorage support
  const testSessionStorage = () => {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Test WebGL support
  const testWebGL = () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  };
  
  // Test Canvas support
  const testCanvas = () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    // Test environment on component mount
    testEnvironment();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Spinner size="xl" />
        <Text mt={2}>Testing container environment...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!environmentInfo) {
    return (
      <Alert status="warning">
        <AlertIcon />
        No environment information available.
      </Alert>
    );
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>Container Environment Test</Heading>
      
      <Text mb={4}>
        This test checks various aspects of the container environment.
      </Text>
      
      <Accordion allowMultiple defaultIndex={[0]} mb={4}>
        {/* Browser Information */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold">
                Browser Information
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  <Tr>
                    <Td fontWeight="bold">User Agent</Td>
                    <Td>
                      <Code fontSize="xs" p={1} whiteSpace="pre-wrap">
                        {environmentInfo.browser.userAgent}
                      </Code>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Platform</Td>
                    <Td>{environmentInfo.browser.platform}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Language</Td>
                    <Td>{environmentInfo.browser.language}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Online</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.browser.online ? 'green' : 'red'}>
                        {environmentInfo.browser.online ? 'Yes' : 'No'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Cookies Enabled</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.browser.cookiesEnabled ? 'green' : 'red'}>
                        {environmentInfo.browser.cookiesEnabled ? 'Yes' : 'No'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Screen Resolution</Td>
                    <Td>{environmentInfo.browser.screenWidth} x {environmentInfo.browser.screenHeight}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Pixel Ratio</Td>
                    <Td>{environmentInfo.browser.pixelRatio}</Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </AccordionPanel>
        </AccordionItem>
        
        {/* Feature Support */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold">
                Feature Support
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  <Tr>
                    <Td fontWeight="bold">Local Storage</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.features.localStorage ? 'green' : 'red'}>
                        {environmentInfo.features.localStorage ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Session Storage</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.features.sessionStorage ? 'green' : 'red'}>
                        {environmentInfo.features.sessionStorage ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Web Workers</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.features.webWorkers ? 'green' : 'red'}>
                        {environmentInfo.features.webWorkers ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Service Workers</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.features.serviceWorkers ? 'green' : 'red'}>
                        {environmentInfo.features.serviceWorkers ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">WebSockets</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.features.webSockets ? 'green' : 'red'}>
                        {environmentInfo.features.webSockets ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">WebGL</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.features.webGL ? 'green' : 'red'}>
                        {environmentInfo.features.webGL ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Canvas</Td>
                    <Td>
                      <Badge colorScheme={environmentInfo.features.canvas ? 'green' : 'red'}>
                        {environmentInfo.features.canvas ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </AccordionPanel>
        </AccordionItem>
        
        {/* Performance Information */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold">
                Performance Information
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            {environmentInfo.performance.memory && (
              <Box mb={4}>
                <Heading size="xs" mb={2}>Memory</Heading>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Tbody>
                      <Tr>
                        <Td fontWeight="bold">JS Heap Size Limit</Td>
                        <Td>{formatBytes(environmentInfo.performance.memory.jsHeapSizeLimit || 0)}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Total JS Heap Size</Td>
                        <Td>{formatBytes(environmentInfo.performance.memory.totalJSHeapSize || 0)}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Used JS Heap Size</Td>
                        <Td>{formatBytes(environmentInfo.performance.memory.usedJSHeapSize || 0)}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            
            {environmentInfo.performance.navigation && (
              <Box mb={4}>
                <Heading size="xs" mb={2}>Navigation</Heading>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Tbody>
                      <Tr>
                        <Td fontWeight="bold">Type</Td>
                        <Td>{getNavigationType(environmentInfo.performance.navigation.type || 0)}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Redirect Count</Td>
                        <Td>{environmentInfo.performance.navigation.redirectCount || 0}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      
      <Text fontSize="sm" color="gray.500" mb={4}>
        Timestamp: {new Date(environmentInfo.timestamp).toLocaleString()}
      </Text>
      
      <Button 
        colorScheme="blue" 
        onClick={testEnvironment}
      >
        Refresh Environment Info
      </Button>
    </Box>
  );
}

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to get navigation type
function getNavigationType(type: number) {
  switch (type) {
    case 0:
      return 'Navigate';
    case 1:
      return 'Reload';
    case 2:
      return 'Back/Forward';
    case 255:
      return 'Reserved';
    default:
      return 'Unknown';
  }
}