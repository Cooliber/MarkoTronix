import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Button,
  useDisclosure,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { FiMail, FiUsers, FiFileText, FiCalendar, FiDollarSign } from 'react-icons/fi';
import Layout from '../components/Layout';
import { getDashboardStats } from '../api/dashboard';
import NewClientModal from '../components/modals/NewClientModal';
import NewOfferModal from '../components/modals/NewOfferModal';
import NewServiceModal from '../components/modals/NewServiceModal';
import { useAuth } from '../hooks/useAuth';

interface DashboardStats {
  newEmails: number;
  tasksToday: number;
  activeOffers: number;
  revenue: number;
  clientsTotal: number;
  recentClients: any[];
  upcomingServices: any[];
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    newEmails: 0,
    tasksToday: 0,
    activeOffers: 0,
    revenue: 0,
    clientsTotal: 0,
    recentClients: [],
    upcomingServices: [],
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
    const fetchDashboardData = async () => {
      if (isAuthenticated) {
        try {
          setIsLoading(true);
          const data = await getDashboardStats();
          setStats(data);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  return (
    <Layout>
      <Box p={5}>
        <Heading mb={6}>Dashboard</Heading>
        
        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <Flex align="center">
              <Box mr={4}>
                <Icon as={FiMail} boxSize={8} color="blue.500" />
              </Box>
              <Box>
                <StatLabel>New Emails</StatLabel>
                <StatNumber>{stats.newEmails}</StatNumber>
                <StatHelpText>Unread messages</StatHelpText>
              </Box>
            </Flex>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <Flex align="center">
              <Box mr={4}>
                <Icon as={FiCalendar} boxSize={8} color="green.500" />
              </Box>
              <Box>
                <StatLabel>Today's Tasks</StatLabel>
                <StatNumber>{stats.tasksToday}</StatNumber>
                <StatHelpText>Scheduled services</StatHelpText>
              </Box>
            </Flex>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <Flex align="center">
              <Box mr={4}>
                <Icon as={FiFileText} boxSize={8} color="orange.500" />
              </Box>
              <Box>
                <StatLabel>Active Offers</StatLabel>
                <StatNumber>{stats.activeOffers}</StatNumber>
                <StatHelpText>Pending approval</StatHelpText>
              </Box>
            </Flex>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <Flex align="center">
              <Box mr={4}>
                <Icon as={FiDollarSign} boxSize={8} color="purple.500" />
              </Box>
              <Box>
                <StatLabel>Monthly Revenue</StatLabel>
                <StatNumber>${stats.revenue.toLocaleString()}</StatNumber>
                <StatHelpText>From completed services</StatHelpText>
              </Box>
            </Flex>
          </Stat>
        </SimpleGrid>
        
        {/* Quick Actions */}
        <Box bg="white" p={5} borderRadius="lg" boxShadow="sm" mb={8}>
          <Heading size="md" mb={4}>Quick Actions</Heading>
          <Flex gap={4} flexWrap="wrap">
            <Button leftIcon={<FiUsers />} colorScheme="blue" onClick={onNewClientOpen}>
              New Client
            </Button>
            <Button leftIcon={<FiFileText />} colorScheme="green" onClick={onNewOfferOpen}>
              New Offer
            </Button>
            <Button leftIcon={<FiCalendar />} colorScheme="orange" onClick={onNewServiceOpen}>
              Schedule Service
            </Button>
          </Flex>
        </Box>
        
        {/* Recent Activity and Upcoming Services */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          <GridItem bg="white" p={5} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>Recent Clients</Heading>
            {stats.recentClients.length > 0 ? (
              stats.recentClients.map((client, index) => (
                <Box key={index} p={3} borderBottom="1px solid" borderColor="gray.100">
                  <Text fontWeight="bold">{client.name}</Text>
                  <Text fontSize="sm" color="gray.600">{client.email}</Text>
                </Box>
              ))
            ) : (
              <Text color="gray.500">No recent clients</Text>
            )}
          </GridItem>
          
          <GridItem bg="white" p={5} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>Upcoming Services</Heading>
            {stats.upcomingServices.length > 0 ? (
              stats.upcomingServices.map((service, index) => (
                <Box key={index} p={3} borderBottom="1px solid" borderColor="gray.100">
                  <Text fontWeight="bold">{service.type}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {service.clientName} • {new Date(service.scheduledDate).toLocaleDateString()}
                  </Text>
                </Box>
              ))
            ) : (
              <Text color="gray.500">No upcoming services</Text>
            )}
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