import { Box, Button, Container, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { NextPageContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ErrorProps {
  statusCode: number;
  message?: string;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

const Error = ({ statusCode, message, err }: ErrorProps) => {
  const router = useRouter();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    // Log error to monitoring system
    if (err && process.env.NODE_ENV === 'production') {
      // In a real app, you would send this to your error tracking service
      console.error('Page Error:', {
        statusCode,
        message: message || err.message,
        stack: err?.stack,
        url: router.asPath,
      });
    }
  }, [err, statusCode, message, router.asPath]);

  const getErrorMessage = () => {
    if (message) return message;
    
    switch (statusCode) {
      case 404:
        return 'The page you are looking for does not exist.';
      case 500:
        return 'An internal server error occurred.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  const getErrorTitle = () => {
    switch (statusCode) {
      case 404:
        return 'Page Not Found';
      case 500:
        return 'Server Error';
      default:
        return `Error ${statusCode || ''}`;
    }
  };

  return (
    <>
      <Head>
        <title>{getErrorTitle()} | HVAC CRM</title>
      </Head>
      <Box 
        minH="100vh" 
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
              <Heading as="h1" size="xl">
                {getErrorTitle()}
              </Heading>
              
              <Text fontSize="lg">
                {getErrorMessage()}
              </Text>
              
              <Button 
                colorScheme="blue" 
                onClick={() => router.push('/')}
                size="lg"
              >
                Return to Home
              </Button>
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
};

Error.getInitialProps = ({ res, err, asPath }: NextPageContext): ErrorProps => {
  const statusCode = res ? res.statusCode : err ? err.statusCode ?? 500 : 404;
  
  // Log server-side errors
  if (err && !process.browser) {
    console.error(`Server-side error occurred on ${asPath}:`, err);
  }
  
  return { 
    statusCode,
    err,
    hasGetInitialPropsRun: true
  };
};

export default Error;