import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Button,
  useDisclosure,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
} from '@chakra-ui/react';
import { FaEnvelope, FaCalendarCheck, FaFileContract, FaMoneyBillWave } from 'react-icons/fa';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { fetchDashboardStats } from '@/api/dashboard';
import NewClientModal from '@/components/modals/NewClientModal';
import NewOfferModal from '@/components/modals/NewOfferModal';
import NewServiceModal from '@/components/modals/NewServiceModal';

interface DashboardStats {
  newEmails: number;
  tasksToday: number;
  activeOffers: number;
  monthlyRevenue: number;
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    newEmails: 0,
    tasksToday: 0,
    activeOffers: 0,
    monthlyRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    isOpen: isNewClientOpen,
    onOpen: onNewClientOpen,
    onClose: onNewClientClose,
  } = useDisclosure();
  
  const {
    isOpen: isNewOfferOpen,
    onOpen: onNewOfferOpen,
    onClose: onNewOfferClose,
  } = useDisclosure();
  
  const {
    isOpen: isNewServiceOpen,
    onOpen: onNewServiceOpen,
    onClose: onNewServiceClose,
  } = useDisclosure();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  return (
    <Layout>
      <Box p={5}>
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">Dashboard</Heading>
          <Text>Welcome back, {user?.name || 'User'}</Text>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
          <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FaEnvelope} mr={2} />
              New Emails
            </StatLabel>
            <StatNumber>{stats.newEmails}</StatNumber>
            <StatHelpText>Unread messages</StatHelpText>
          </Stat>
          
          <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FaCalendarCheck} mr={2} />
              Today's Tasks
            </StatLabel>
            <StatNumber>{stats.tasksToday}</StatNumber>
            <StatHelpText>Scheduled appointments</StatHelpText>
          </Stat>
          
          <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FaFileContract} mr={2} />
              Active Offers
            </StatLabel>
            <StatNumber>{stats.activeOffers}</StatNumber>
            <StatHelpText>Pending client approval</StatHelpText>
          </Stat>
          
          <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
            <StatLabel display="flex" alignItems="center">
              <Icon as={FaMoneyBillWave} mr={2} />
              Monthly Revenue
            </StatLabel>
            <StatNumber>${stats.monthlyRevenue.toLocaleString()}</StatNumber>
            <StatHelpText>This month</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Quick Actions */}
        <Box mb={8}>
          <Heading size="md" mb={4}>Quick Actions</Heading>
          <Flex gap={4} flexWrap="wrap">
            <Button colorScheme="blue" onClick={onNewClientOpen}>
              New Client
            </Button>
            <Button colorScheme="green" onClick={onNewOfferOpen}>
              New Offer
            </Button>
            <Button colorScheme="purple" onClick={onNewServiceOpen}>
              Schedule Service
            </Button>
          </Flex>
        </Box>

        {/* Recent Activity and Upcoming Tasks */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          <GridItem p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
            <Heading size="md" mb={4}>Recent Activity</Heading>
            {/* Activity content would go here */}
            <Text color="gray.500">No recent activity to display</Text>
          </GridItem>
          
          <GridItem p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
            <Heading size="md" mb={4}>Upcoming Tasks</Heading>
            {/* Tasks content would go here */}
            <Text color="gray.500">No upcoming tasks scheduled</Text>
          </GridItem>
        </Grid>
      </Box>

      {/* Modals */}
      <NewClientModal isOpen={isNewClientOpen} onClose={onNewClientClose} />
      <NewOfferModal isOpen={isNewOfferOpen} onClose={onNewOfferClose} />
      <NewServiceModal isOpen={isNewServiceOpen} onClose={onNewServiceClose} />
    </Layout>
  );
}