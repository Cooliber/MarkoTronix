import { ReactNode, useEffect } from 'react';
import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return null;
  }

  return (
    <Flex h="100vh" flexDirection="column">
      <Navbar onSidebarOpen={onOpen} />
      <Flex flex="1" overflow="hidden">
        <Sidebar isOpen={isOpen} onClose={onClose} />
        <Box
          flex="1"
          p={0}
          bg="gray.50"
          overflowY="auto"
          transition="margin-left 0.3s"
          ml={{ base: 0, md: '240px' }}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}