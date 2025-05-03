import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { useAuth } from '@/hooks/useAuth';

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
    <Center h="100vh">
      <Box>
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Box>
    </Center>
  );
}