import { Box, Heading, Text, VStack, Badge } from '@chakra-ui/react';

export default function UIContainerTest() {
  // Get environment information from the browser
  const browserInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    timestamp: new Date().toISOString(),
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>UI Container Browser Test</Heading>
      
      <VStack align="start" spacing={3}>
        <Box>
          <Text fontWeight="bold">User Agent:</Text>
          <Text fontSize="sm" fontFamily="monospace" whiteSpace="pre-wrap">
            {browserInfo.userAgent}
          </Text>
        </Box>
        
        <Box>
          <Text fontWeight="bold">Platform:</Text>
          <Text>{browserInfo.platform}</Text>
        </Box>
        
        <Box>
          <Text fontWeight="bold">Language:</Text>
          <Text>{browserInfo.language}</Text>
        </Box>
        
        <Box>
          <Text fontWeight="bold">Cookies Enabled:</Text>
          <Badge colorScheme={browserInfo.cookiesEnabled ? 'green' : 'red'}>
            {browserInfo.cookiesEnabled ? 'Yes' : 'No'}
          </Badge>
        </Box>
        
        <Box>
          <Text fontWeight="bold">Timestamp:</Text>
          <Text>{new Date(browserInfo.timestamp).toLocaleString()}</Text>
        </Box>
      </VStack>
    </Box>
  );
}