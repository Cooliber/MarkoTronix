import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
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
  Badge,
  Code,
  VStack,
} from '@chakra-ui/react';

interface NetworkTestResult {
  endpoint: string;
  status: 'success' | 'error';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  data?: any;
}

export default function ContainerNetworkTest() {
  const [results, setResults] = useState<NetworkTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState<string>('');

  // List of endpoints to test
  const endpoints = [
    { name: 'API Health', url: '/api/health' },
    { name: 'API Container Test', url: '/api/container-test' },
    { name: 'UI Health', url: '/api/health' },
    { name: 'UI Container Test', url: '/api/container-test' },
    { name: 'Mock API Health', url: 'http://localhost:8000/api/health' },
    { name: 'Mock API Container Test', url: 'http://localhost:8000/api/container-test' },
  ];

  const runNetworkTests = async () => {
    setLoading(true);
    const newResults: NetworkTestResult[] = [];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = performance.now();
        const response = await fetch(endpoint.url, { 
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Don't include credentials for cross-origin requests
          credentials: endpoint.url.startsWith('/') ? 'same-origin' : 'omit',
        });
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = null;
        }
        
        newResults.push({
          endpoint: endpoint.name,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          responseTime,
          data,
        });
      } catch (err) {
        newResults.push({
          endpoint: endpoint.name,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
    
    setResults(newResults);
    setTimestamp(new Date().toISOString());
    setLoading(false);
  };

  useEffect(() => {
    // Run tests on component mount
    runNetworkTests();
  }, []);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>Container Network Test</Heading>
      
      <Text mb={4}>
        This test checks network connectivity between containers.
      </Text>
      
      {loading ? (
        <Box textAlign="center" py={4}>
          <Spinner size="xl" />
          <Text mt={2}>Running network tests...</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Endpoint</Th>
                  <Th>Status</Th>
                  <Th>Response Time</Th>
                  <Th>Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {results.map((result, index) => (
                  <Tr key={index}>
                    <Td fontWeight="medium">{result.endpoint}</Td>
                    <Td>
                      <Badge colorScheme={result.status === 'success' ? 'green' : 'red'}>
                        {result.status === 'success' ? 'Success' : 'Error'}
                      </Badge>
                      {result.statusCode && (
                        <Text fontSize="xs" mt={1}>
                          Status: {result.statusCode}
                        </Text>
                      )}
                    </Td>
                    <Td>
                      {result.responseTime ? 
                        `${result.responseTime.toFixed(2)} ms` : 
                        'N/A'}
                    </Td>
                    <Td>
                      {result.error ? (
                        <Text color="red.500" fontSize="sm">{result.error}</Text>
                      ) : result.data ? (
                        <Code fontSize="xs" p={1} whiteSpace="pre-wrap">
                          {JSON.stringify(result.data, null, 2).substring(0, 100)}
                          {JSON.stringify(result.data, null, 2).length > 100 ? '...' : ''}
                        </Code>
                      ) : 'No data'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          
          {timestamp && (
            <Text fontSize="sm" color="gray.500">
              Last tested: {new Date(timestamp).toLocaleString()}
            </Text>
          )}
          
          <Button 
            colorScheme="blue" 
            onClick={runNetworkTests} 
            isLoading={loading}
            loadingText="Testing"
          >
            Run Network Tests Again
          </Button>
        </VStack>
      )}
    </Box>
  );
}