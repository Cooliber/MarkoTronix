import { useState, useEffect, useRef } from 'react';
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
  Progress,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
} from '@chakra-ui/react';

interface PerformanceTestResult {
  name: string;
  score: number;
  unit: string;
  details?: string;
}

interface PerformanceResults {
  cpu: PerformanceTestResult[];
  memory: PerformanceTestResult[];
  rendering: PerformanceTestResult[];
  network: PerformanceTestResult[];
  timestamp: string;
}

export default function ContainerPerformanceTest() {
  const [results, setResults] = useState<PerformanceResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const runPerformanceTests = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          return 95;
        }
        return prev + 5;
      });
    }, 500);

    try {
      // CPU Performance Tests
      const cpuResults = await runCPUTests();

      // Memory Performance Tests
      const memoryResults = await runMemoryTests();

      // Rendering Performance Tests
      const renderingResults = await runRenderingTests();

      // Network Performance Tests
      const networkResults = await runNetworkTests();

      // Combine results
      setResults({
        cpu: cpuResults,
        memory: memoryResults,
        rendering: renderingResults,
        network: networkResults,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Set progress to 100%
      setProgress(100);
      setLoading(false);
    }
  };

  // CPU Performance Tests
  const runCPUTests = async (): Promise<PerformanceTestResult[]> => {
    const results: PerformanceTestResult[] = [];

    // Test 1: Fibonacci calculation
    const fibStart = performance.now();
    fibonacci(35); // Computationally intensive
    const fibEnd = performance.now();

    results.push({
      name: 'Fibonacci Calculation',
      score: fibEnd - fibStart,
      unit: 'ms',
      details: 'Time to calculate Fibonacci(35)',
    });

    // Test 2: Array operations
    const arrayStart = performance.now();
    const arr = Array.from({ length: 1000000 }, (_, i) => i);
    arr.filter(n => n % 2 === 0).map(n => n * 2).reduce((a, b) => a + b, 0);
    const arrayEnd = performance.now();

    results.push({
      name: 'Array Operations',
      score: arrayEnd - arrayStart,
      unit: 'ms',
      details: 'Time to perform filter, map, and reduce on 1M elements',
    });

    // Test 3: JSON operations
    const jsonStart = performance.now();
    const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    for (let i = 0; i < 100000; i++) {
      JSON.parse(JSON.stringify(obj));
    }
    const jsonEnd = performance.now();

    results.push({
      name: 'JSON Operations',
      score: jsonEnd - jsonStart,
      unit: 'ms',
      details: 'Time to stringify and parse JSON 100K times',
    });

    return results;
  };

  // Memory Performance Tests
  const runMemoryTests = async (): Promise<PerformanceTestResult[]> => {
    const results: PerformanceTestResult[] = [];

    // Test 1: Memory allocation
    const memStart = performance.now();
    const arrays = [];
    for (let i = 0; i < 100; i++) {
      arrays.push(new Array(10000).fill(Math.random()));
    }
    const memEnd = performance.now();

    results.push({
      name: 'Memory Allocation',
      score: memEnd - memStart,
      unit: 'ms',
      details: 'Time to allocate 100 arrays of 10K elements',
    });

    // Test 2: Current memory usage
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      if (mem) {
        results.push({
          name: 'Used JS Heap',
          score: mem.usedJSHeapSize / (1024 * 1024),
          unit: 'MB',
          details: 'Current JS heap usage',
        });

        results.push({
          name: 'Total JS Heap',
          score: mem.totalJSHeapSize / (1024 * 1024),
          unit: 'MB',
          details: 'Total allocated JS heap',
        });

        results.push({
          name: 'JS Heap Limit',
          score: mem.jsHeapSizeLimit / (1024 * 1024),
          unit: 'MB',
          details: 'Maximum JS heap size',
        });
      }
    }

    return results;
  };

  // Rendering Performance Tests
  const runRenderingTests = async (): Promise<PerformanceTestResult[]> => {
    const results: PerformanceTestResult[] = [];

    // Test 1: DOM operations
    const domStart = performance.now();
    const div = document.createElement('div');
    document.body.appendChild(div);

    for (let i = 0; i < 1000; i++) {
      const child = document.createElement('div');
      child.textContent = `Item ${i}`;
      child.style.padding = '5px';
      child.style.margin = '2px';
      child.style.backgroundColor = i % 2 === 0 ? '#f0f0f0' : '#e0e0e0';
      div.appendChild(child);
    }

    // Force reflow
    div.offsetHeight;

    // Clean up
    document.body.removeChild(div);
    const domEnd = performance.now();

    results.push({
      name: 'DOM Operations',
      score: domEnd - domStart,
      unit: 'ms',
      details: 'Time to create and manipulate 1000 DOM elements',
    });

    // Test 2: Animation frame rate
    let frames = 0;
    const duration = 500; // ms
    const startTime = performance.now();

    await new Promise<void>(resolve => {
      const countFrames = (timestamp: number) => {
        frames++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(countFrames);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(countFrames);
    });

    const fps = Math.round((frames * 1000) / duration);

    results.push({
      name: 'Animation Frame Rate',
      score: fps,
      unit: 'FPS',
      details: `Measured over ${duration}ms`,
    });

    return results;
  };

  // Network Performance Tests
  const runNetworkTests = async (): Promise<PerformanceTestResult[]> => {
    const results: PerformanceTestResult[] = [];

    // Test 1: API response time
    try {
      const apiStart = performance.now();
      await fetch('/api/health');
      const apiEnd = performance.now();

      results.push({
        name: 'API Response Time',
        score: apiEnd - apiStart,
        unit: 'ms',
        details: 'Time to fetch /api/health',
      });
    } catch (e) {
      results.push({
        name: 'API Response Time',
        score: 0,
        unit: 'ms',
        details: 'Failed to fetch /api/health',
      });
    }

    // Test 2: Mock API response time
    try {
      const mockApiStart = performance.now();
      await fetch('http://localhost:18000/api/health', { credentials: 'omit' });
      const mockApiEnd = performance.now();

      results.push({
        name: 'Mock API Response Time',
        score: mockApiEnd - mockApiStart,
        unit: 'ms',
        details: 'Time to fetch http://localhost:18000/api/health',
      });
    } catch (e) {
      results.push({
        name: 'Mock API Response Time',
        score: 0,
        unit: 'ms',
        details: 'Failed to fetch http://localhost:8000/api/health',
      });
    }

    // Test 3: Network latency
    try {
      const latencies: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await fetch('/api/health');
        const end = performance.now();
        latencies.push(end - start);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

      results.push({
        name: 'Average Network Latency',
        score: avgLatency,
        unit: 'ms',
        details: 'Average of 5 requests to /api/health',
      });
    } catch (e) {
      results.push({
        name: 'Average Network Latency',
        score: 0,
        unit: 'ms',
        details: 'Failed to measure network latency',
      });
    }

    return results;
  };

  useEffect(() => {
    // Run tests on component mount
    runPerformanceTests();

    // Clean up interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const statBg = useColorModeValue('white', 'gray.700');

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>Container Performance Test</Heading>

      <Text mb={4}>
        This test measures the performance of the container environment.
      </Text>

      {loading && (
        <VStack spacing={4} mb={6}>
          <Progress value={progress} size="sm" width="100%" colorScheme="blue" />
          <Text>Running performance tests... {progress}%</Text>
        </VStack>
      )}

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {results && (
        <VStack spacing={6} align="stretch">
          {/* Summary Stats */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Stat p={3} borderRadius="md" bg={statBg} shadow="sm">
              <StatLabel>CPU Performance</StatLabel>
              <StatNumber>
                {results.cpu.length > 0
                  ? `${Math.round(results.cpu[0].score)}ms`
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>Fibonacci calculation</StatHelpText>
            </Stat>

            <Stat p={3} borderRadius="md" bg={statBg} shadow="sm">
              <StatLabel>Memory Usage</StatLabel>
              <StatNumber>
                {results.memory.find(r => r.name === 'Used JS Heap')
                  ? `${Math.round(results.memory.find(r => r.name === 'Used JS Heap')!.score)}MB`
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>JS Heap</StatHelpText>
            </Stat>

            <Stat p={3} borderRadius="md" bg={statBg} shadow="sm">
              <StatLabel>Rendering</StatLabel>
              <StatNumber>
                {results.rendering.find(r => r.name === 'Animation Frame Rate')
                  ? `${Math.round(results.rendering.find(r => r.name === 'Animation Frame Rate')!.score)}FPS`
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>Animation frame rate</StatHelpText>
            </Stat>

            <Stat p={3} borderRadius="md" bg={statBg} shadow="sm">
              <StatLabel>Network</StatLabel>
              <StatNumber>
                {results.network.find(r => r.name === 'Average Network Latency')
                  ? `${Math.round(results.network.find(r => r.name === 'Average Network Latency')!.score)}ms`
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>Average latency</StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Detailed Results */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>CPU</Tab>
              <Tab>Memory</Tab>
              <Tab>Rendering</Tab>
              <Tab>Network</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Test</Th>
                        <Th>Score</Th>
                        <Th>Details</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {results.cpu.map((result, index) => (
                        <Tr key={index}>
                          <Td fontWeight="medium">{result.name}</Td>
                          <Td>{result.score.toFixed(2)} {result.unit}</Td>
                          <Td>{result.details}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Test</Th>
                        <Th>Score</Th>
                        <Th>Details</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {results.memory.map((result, index) => (
                        <Tr key={index}>
                          <Td fontWeight="medium">{result.name}</Td>
                          <Td>{result.score.toFixed(2)} {result.unit}</Td>
                          <Td>{result.details}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Test</Th>
                        <Th>Score</Th>
                        <Th>Details</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {results.rendering.map((result, index) => (
                        <Tr key={index}>
                          <Td fontWeight="medium">{result.name}</Td>
                          <Td>{result.score.toFixed(2)} {result.unit}</Td>
                          <Td>{result.details}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Test</Th>
                        <Th>Score</Th>
                        <Th>Details</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {results.network.map((result, index) => (
                        <Tr key={index}>
                          <Td fontWeight="medium">{result.name}</Td>
                          <Td>{result.score.toFixed(2)} {result.unit}</Td>
                          <Td>{result.details}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {results.timestamp && (
            <Text fontSize="sm" color="gray.500">
              Last tested: {new Date(results.timestamp).toLocaleString()}
            </Text>
          )}

          <Button
            colorScheme="blue"
            onClick={runPerformanceTests}
            isLoading={loading}
            loadingText={`Testing (${progress}%)`}
          >
            Run Performance Tests Again
          </Button>
        </VStack>
      )}
    </Box>
  );
}

// Helper function to calculate Fibonacci number (CPU intensive)
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}