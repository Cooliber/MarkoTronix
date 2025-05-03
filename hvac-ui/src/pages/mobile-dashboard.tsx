import { useEffect, useRef } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
  Text,
  Heading,
  Icon,
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stack,
  StackDivider,
  Progress,
  HStack,
  VStack,
  Avatar,
  AvatarGroup,
  useColorModeValue,
  IconButton,
  Divider,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiTool,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiPhone,
  FiMessageSquare,
  FiMapPin,
  FiBarChart2,
  FiPlusCircle,
  FiFilter,
  FiRefreshCw,
} from 'react-icons/fi';
import MobileLayout from '@/components/MobileLayout';
import { useStaggerAnimation, useAnimationRef } from '@/hooks/useAnimation';
import { widgetEnterAnimation, cardEnterAnimation, listItemAnimation } from '@/utils/animations';

// Mock data
const stats = [
  { label: 'Clients', value: 128, icon: FiUsers, change: 12, isIncrease: true },
  { label: 'Revenue', value: '$24,500', icon: FiDollarSign, change: 8.2, isIncrease: true },
  { label: 'Appointments', value: 42, icon: FiCalendar, change: 5, isIncrease: false },
  { label: 'Service Orders', value: 18, icon: FiTool, change: 22, isIncrease: true },
];

const upcomingAppointments = [
  {
    id: 'apt1',
    clientName: 'Jan Kowalski',
    time: '10:00 AM',
    date: '2025-05-04',
    address: 'ul. Warszawska 10, Kraków',
    type: 'Installation',
    status: 'confirmed',
  },
  {
    id: 'apt2',
    clientName: 'Anna Nowak',
    time: '2:30 PM',
    date: '2025-05-04',
    address: 'ul. Długa 5, Warszawa',
    type: 'Maintenance',
    status: 'confirmed',
  },
  {
    id: 'apt3',
    clientName: 'Piotr Wiśniewski',
    time: '9:00 AM',
    date: '2025-05-05',
    address: 'ul. Krakowska 22, Wrocław',
    type: 'Repair',
    status: 'pending',
  },
];

const activeServiceOrders = [
  {
    id: 'SO001',
    clientName: 'Jan Kowalski',
    problem: 'AC not cooling properly',
    status: 'in-progress',
    progress: 65,
    technician: 'Marek Nowak',
    technicianPhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 'SO002',
    clientName: 'Anna Nowak',
    problem: 'Strange noise during operation',
    status: 'scheduled',
    progress: 0,
    technician: 'Tomasz Kowalczyk',
    technicianPhoto: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
];

const recentActivities = [
  {
    id: 'act1',
    type: 'service_completed',
    message: 'Service order #SO003 completed',
    time: '1 hour ago',
  },
  {
    id: 'act2',
    type: 'client_added',
    message: 'New client Magdalena Dąbrowska added',
    time: '3 hours ago',
  },
  {
    id: 'act3',
    type: 'offer_sent',
    message: 'Offer #OF045 sent to Jan Kowalski',
    time: '5 hours ago',
  },
  {
    id: 'act4',
    type: 'warranty_issued',
    message: 'Warranty card issued for Anna Nowak',
    time: 'Yesterday',
  },
];

export default function MobileDashboard() {
  // Animation hooks
  const { containerRef, animateChildren } = useStaggerAnimation<HTMLDivElement>();
  const { elementRef: statsRef, animate: animateStats } = useAnimationRef<HTMLDivElement>();
  const { elementRef: appointmentsRef, animate: animateAppointments } = useAnimationRef<HTMLDivElement>();
  const { elementRef: serviceOrdersRef, animate: animateServiceOrders } = useAnimationRef<HTMLDivElement>();
  const { elementRef: activitiesRef, animate: animateActivities } = useAnimationRef<HTMLDivElement>();

  // Apply animations on component mount
  useEffect(() => {
    // Animate stats widgets with stagger effect
    animateStats(() => widgetEnterAnimation(
      Array.from(statsRef.current?.querySelectorAll('.stat-card') || []) as HTMLElement[]
    ));

    // Animate other sections
    animateAppointments(() => cardEnterAnimation(appointmentsRef.current as HTMLElement, 0.2));
    animateServiceOrders(() => cardEnterAnimation(serviceOrdersRef.current as HTMLElement, 0.3));
    animateActivities(() => cardEnterAnimation(activitiesRef.current as HTMLElement, 0.4));

    // Animate list items
    if (appointmentsRef.current) {
      const items = Array.from(
        appointmentsRef.current.querySelectorAll('.appointment-item')
      ) as HTMLElement[];
      listItemAnimation(items);
    }

    if (serviceOrdersRef.current) {
      const items = Array.from(
        serviceOrdersRef.current.querySelectorAll('.service-order-item')
      ) as HTMLElement[];
      listItemAnimation(items);
    }

    if (activitiesRef.current) {
      const items = Array.from(
        activitiesRef.current.querySelectorAll('.activity-item')
      ) as HTMLElement[];
      listItemAnimation(items);
    }
  }, [
    animateStats,
    animateAppointments,
    animateServiceOrders,
    animateActivities,
  ]);

  return (
    <MobileLayout title="Dashboard">
        <Box ref={containerRef} pb={6}>
        {/* Stats Section */}
        <Box ref={statsRef} mb={6}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="stat-card"
                boxShadow="sm"
                borderRadius="lg"
                overflow="hidden"
              >
                <CardBody p={4}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Box>
                      <StatLabel fontSize="sm" color="gray.500">
                        {stat.label}
                      </StatLabel>
                      <StatNumber fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
                        {stat.value}
                      </StatNumber>
                      <StatHelpText mb={0}>
                        <StatArrow type={stat.isIncrease ? 'increase' : 'decrease'} />
                        {stat.change}%
                      </StatHelpText>
                    </Box>
                    <Box
                      p={2}
                      borderRadius="full"
                      bg={useColorModeValue('blue.50', 'blue.900')}
                      color={useColorModeValue('blue.600', 'blue.200')}
                    >
                      <Icon as={stat.icon} boxSize={6} />
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Today's Appointments */}
        <Box ref={appointmentsRef} mb={6}>
          <Flex justifyContent="space-between" alignItems="center" mb={3}>
            <Heading size="md">Today's Appointments</Heading>
            <Button
              rightIcon={<FiChevronRight />}
              variant="ghost"
              size="sm"
              colorScheme="blue"
              onClick={() => {}}
            >
              View All
            </Button>
          </Flex>
          <Card boxShadow="sm" borderRadius="lg">
            <CardBody p={0}>
              <List spacing={0}>
                {upcomingAppointments.map((appointment) => (
                  <ListItem
                    key={appointment.id}
                    className="appointment-item"
                    p={4}
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                  >
                    <Flex justifyContent="space-between" alignItems="center">
                      <Box>
                        <Text fontWeight="medium">{appointment.clientName}</Text>
                        <HStack fontSize="sm" color="gray.500" mt={1}>
                          <Icon as={FiClock} />
                          <Text>{appointment.time}</Text>
                          <Icon as={FiMapPin} />
                          <Text noOfLines={1}>{appointment.address}</Text>
                        </HStack>
                      </Box>
                      <HStack>
                        <Badge
                          colorScheme={appointment.status === 'confirmed' ? 'green' : 'yellow'}
                        >
                          {appointment.status}
                        </Badge>
                        <IconButton
                          aria-label="Call client"
                          icon={<FiPhone />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                        />
                      </HStack>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </CardBody>
            <CardFooter
              p={3}
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderBottomRadius="lg"
            >
              <Button
                leftIcon={<FiPlusCircle />}
                size="sm"
                width="full"
                colorScheme="blue"
                variant="outline"
              >
                Add Appointment
              </Button>
            </CardFooter>
          </Card>
        </Box>

        {/* Active Service Orders */}
        <Box ref={serviceOrdersRef} mb={6}>
          <Flex justifyContent="space-between" alignItems="center" mb={3}>
            <Heading size="md">Active Service Orders</Heading>
            <Button
              rightIcon={<FiChevronRight />}
              variant="ghost"
              size="sm"
              colorScheme="blue"
              onClick={() => {}}
            >
              View All
            </Button>
          </Flex>
          <Card boxShadow="sm" borderRadius="lg">
            <CardBody p={0}>
              <List spacing={0}>
                {activeServiceOrders.map((order) => (
                  <ListItem
                    key={order.id}
                    className="service-order-item"
                    p={4}
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                  >
                    <VStack align="stretch" spacing={2}>
                      <Flex justifyContent="space-between" alignItems="center">
                        <HStack>
                          <Text fontWeight="medium">{order.id}</Text>
                          <Badge
                            colorScheme={order.status === 'in-progress' ? 'orange' : 'blue'}
                          >
                            {order.status}
                          </Badge>
                        </HStack>
                        <Avatar size="sm" src={order.technicianPhoto} />
                      </Flex>
                      <Text>{order.clientName} - {order.problem}</Text>
                      {order.status === 'in-progress' && (
                        <Box>
                          <Flex justifyContent="space-between" fontSize="xs" mb={1}>
                            <Text>Progress</Text>
                            <Text>{order.progress}%</Text>
                          </Flex>
                          <Progress
                            value={order.progress}
                            size="sm"
                            colorScheme="blue"
                            borderRadius="full"
                          />
                        </Box>
                      )}
                    </VStack>
                  </ListItem>
                ))}
              </List>
            </CardBody>
            <CardFooter
              p={3}
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderBottomRadius="lg"
            >
              <Button
                leftIcon={<FiRefreshCw />}
                size="sm"
                width="full"
                colorScheme="blue"
                variant="outline"
              >
                Refresh Status
              </Button>
            </CardFooter>
          </Card>
        </Box>

        {/* Recent Activity */}
        <Box ref={activitiesRef}>
          <Flex justifyContent="space-between" alignItems="center" mb={3}>
            <Heading size="md">Recent Activity</Heading>
            <Button
              rightIcon={<FiFilter />}
              variant="ghost"
              size="sm"
              colorScheme="blue"
              onClick={() => {}}
            >
              Filter
            </Button>
          </Flex>
          <Card boxShadow="sm" borderRadius="lg">
            <CardBody p={0}>
              <List spacing={0}>
                {recentActivities.map((activity) => (
                  <ListItem
                    key={activity.id}
                    className="activity-item"
                    p={4}
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                  >
                    <Flex justifyContent="space-between" alignItems="center">
                      <HStack>
                        <ListIcon
                          as={
                            activity.type === 'service_completed'
                              ? FiCheckCircle
                              : activity.type === 'client_added'
                              ? FiUsers
                              : activity.type === 'offer_sent'
                              ? FiDollarSign
                              : FiTool
                          }
                          color={
                            activity.type === 'service_completed'
                              ? 'green.500'
                              : activity.type === 'client_added'
                              ? 'blue.500'
                              : activity.type === 'offer_sent'
                              ? 'purple.500'
                              : 'orange.500'
                          }
                          fontSize="xl"
                        />
                        <Text>{activity.message}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        {activity.time}
                      </Text>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </Box>
      </Box>
    </MobileLayout>
  );
}
