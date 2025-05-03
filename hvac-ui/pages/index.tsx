import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, Spinner, Center } from '@chakra-ui/react';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <Center h="100vh" w="100vw">
      <Flex direction="column" align="center" justify="center">
        <Box mb={4}>
          <img src="/logo.png" alt="HVAC CRM Logo" width={120} height={120} />
        </Box>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    </Center>
  );
}