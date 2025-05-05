import { Box, Button, Container, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring system
    if (process.env.NODE_ENV === 'production') {
      // In a real app, you would send this to your error tracking service
      console.error('Component Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      const bgColor = useColorModeValue('gray.50', 'gray.900');
      const cardBgColor = useColorModeValue('white', 'gray.800');
      
      return (
        <Box 
          minH="100%" 
          bg={bgColor} 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          py={10}
        >
          <Container maxW="lg">
            <Box 
              bg={cardBgColor} 
              p={8} 
              borderRadius="lg" 
              boxShadow="lg"
              textAlign="center"
            >
              <VStack spacing={6}>
                <Heading as="h2" size="lg">
                  Something went wrong
                </Heading>
                
                <Text>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Text>
                
                {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
                  <Box 
                    as="pre" 
                    p={4} 
                    bg="gray.100" 
                    color="red.500" 
                    borderRadius="md"
                    fontSize="sm"
                    textAlign="left"
                    overflowX="auto"
                    maxH="200px"
                  >
                    {this.state.errorInfo.componentStack}
                  </Box>
                )}
                
                <Button 
                  colorScheme="blue" 
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
              </VStack>
            </Box>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;