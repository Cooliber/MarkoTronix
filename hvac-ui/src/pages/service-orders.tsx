import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  useToast,
  IconButton,
  Text,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Avatar,
  AvatarGroup,
  Tag,
  TagLabel,
  TagLeftIcon,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiEdit, 
  FiEye, 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiMapPin, 
  FiTool, 
  FiCheckCircle, 
  FiAlertCircle,
  FiRefreshCw,
  FiFilter,
  FiPhone,
  FiMessageSquare,
  FiClipboard,
  FiFileText
} from 'react-icons/fi';
import Layout from '@/components/Layout';

// Mock data for service orders
const mockServiceOrders = [
  {
    id: 'SO001',
    clientName: 'Jan Kowalski',
    clientPhone: '+48 123 456 789',
    address: 'ul. Warszawska 10, Kraków',
    equipmentType: 'Split AC Unit',
    model: 'CoolBreeze X5',
    serialNumber: 'CB-X5-12345',
    problem: 'Unit not cooling properly',
    status: 'in-progress',
    priority: 'high',
    scheduledDate: '2025-05-04',
    scheduledTime: '10:00-12:00',
    technician: 'Marek Nowak',
    technicianId: 'T001',
    technicianPhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
    notes: 'Customer reported the issue started 2 days ago',
    lastUpdated: '2025-05-03T09:15:00Z',
    estimatedCompletionTime: '2025-05-03T11:30:00Z',
    progress: 65,
    currentActivity: 'Replacing filter and checking refrigerant levels',
    partsNeeded: ['Air filter', 'Refrigerant'],
    partsAvailable: true,
  },
  {
    id: 'SO002',
    clientName: 'Anna Nowak',
    clientPhone: '+48 987 654 321',
    address: 'ul. Długa 5, Warszawa',
    equipmentType: 'Heat Pump',
    model: 'EcoHeat Pro',
    serialNumber: 'EH-P-67890',
    problem: 'Strange noise during operation',
    status: 'scheduled',
    priority: 'medium',
    scheduledDate: '2025-05-04',
    scheduledTime: '14:00-16:00',
    technician: 'Tomasz Kowalczyk',
    technicianId: 'T002',
    technicianPhoto: 'https://randomuser.me/api/portraits/men/2.jpg',
    notes: 'First maintenance after installation',
    lastUpdated: '2025-05-02T16:30:00Z',
    estimatedCompletionTime: null,
    progress: 0,
    currentActivity: null,
    partsNeeded: [],
    partsAvailable: true,
  },
  {
    id: 'SO003',
    clientName: 'Piotr Wiśniewski',
    clientPhone: '+48 555 123 456',
    address: 'ul. Krakowska 22, Wrocław',
    equipmentType: 'Central AC',
    model: 'AirMaster 3000',
    serialNumber: 'AM-3K-54321',
    problem: 'Annual maintenance',
    status: 'completed',
    priority: 'low',
    scheduledDate: '2025-05-03',
    scheduledTime: '09:00-11:00',
    technician: 'Adam Kowalski',
    technicianId: 'T003',
    technicianPhoto: 'https://randomuser.me/api/portraits/men/3.jpg',
    notes: 'Everything working properly, replaced air filter',
    lastUpdated: '2025-05-03T10:45:00Z',
    estimatedCompletionTime: '2025-05-03T11:00:00Z',
    progress: 100,
    currentActivity: 'Service completed',
    partsNeeded: ['Air filter'],
    partsAvailable: true,
    completionNotes: 'Performed full system check, replaced air filter, cleaned condenser coils. System is operating at optimal efficiency.',
    completionTime: '2025-05-03T10:45:00Z',
  },
  {
    id: 'SO004',
    clientName: 'Magdalena Dąbrowska',
    clientPhone: '+48 777 888 999',
    address: 'ul. Mickiewicza 15, Gdańsk',
    equipmentType: 'Ductless Mini-Split',
    model: 'SilentCool 2',
    serialNumber: 'SC-2-98765',
    problem: 'Remote control not working',
    status: 'pending',
    priority: 'medium',
    scheduledDate: '2025-05-05',
    scheduledTime: '12:00-14:00',
    technician: null,
    technicianId: null,
    technicianPhoto: null,
    notes: 'Customer tried replacing batteries, still not working',
    lastUpdated: '2025-05-02T14:20:00Z',
    estimatedCompletionTime: null,
    progress: 0,
    currentActivity: null,
    partsNeeded: ['Remote control (possibly)'],
    partsAvailable: false,
  },
];

// Status color mapping
const statusColors = {
  'pending': 'yellow',
  'scheduled': 'blue',
  'in-progress': 'orange',
  'completed': 'green',
  'cancelled': 'red',
};

// Status display names
const statusNames = {
  'pending': 'Pending',
  'scheduled': 'Scheduled',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

// Priority color mapping
const priorityColors = {
  'low': 'green',
  'medium': 'blue',
  'high': 'red',
};

export default function ServiceOrdersPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [serviceOrders, setServiceOrders] = useState(mockServiceOrders);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const toast = useToast();

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update in-progress orders
      setServiceOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status === 'in-progress') {
            // Randomly increase progress
            const newProgress = Math.min(order.progress + Math.floor(Math.random() * 5), 100);
            
            // If progress reaches 100, mark as completed
            if (newProgress === 100) {
              return {
                ...order,
                status: 'completed',
                progress: 100,
                currentActivity: 'Service completed',
                lastUpdated: new Date().toISOString(),
                completionTime: new Date().toISOString(),
                completionNotes: 'Service completed successfully. All systems operational.'
              };
            }
            
            return {
              ...order,
              progress: newProgress,
              lastUpdated: new Date().toISOString()
            };
          }
          return order;
        })
      );
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleAddNew = () => {
    setCurrentOrder(null);
    setIsViewMode(false);
    onOpen();
  };

  const handleEdit = (order) => {
    setCurrentOrder(order);
    setIsViewMode(false);
    onOpen();
  };

  const handleView = (order) => {
    setCurrentOrder(order);
    setIsViewMode(true);
    onOpen();
  };

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const orderData = {
      id: currentOrder ? currentOrder.id : `SO${(serviceOrders.length + 1).toString().padStart(3, '0')}`,
      clientName: formData.get('clientName'),
      clientPhone: formData.get('clientPhone'),
      address: formData.get('address'),
      equipmentType: formData.get('equipmentType'),
      model: formData.get('model'),
      serialNumber: formData.get('serialNumber'),
      problem: formData.get('problem'),
      status: formData.get('status'),
      priority: formData.get('priority'),
      scheduledDate: formData.get('scheduledDate'),
      scheduledTime: formData.get('scheduledTime'),
      technician: formData.get('technician') || null,
      technicianId: formData.get('technicianId') || null,
      notes: formData.get('notes'),
      lastUpdated: new Date().toISOString(),
      progress: currentOrder?.progress || 0,
      currentActivity: currentOrder?.currentActivity || null,
      partsNeeded: currentOrder?.partsNeeded || [],
      partsAvailable: currentOrder?.partsAvailable || true,
    };

    if (currentOrder) {
      // Update existing order
      setServiceOrders(serviceOrders.map(o => o.id === currentOrder.id ? orderData : o));
      toast({
        title: 'Service order updated',
        description: 'The service order has been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Add new order
      setServiceOrders([...serviceOrders, orderData]);
      toast({
        title: 'Service order created',
        description: 'The service order has been successfully created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    onClose();
  };

  const handleRefreshRateChange = (e) => {
    setRefreshInterval(Number(e.target.value));
    toast({
      title: 'Refresh rate updated',
      description: `Real-time updates will now refresh every ${e.target.value} seconds.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCallClient = (phone) => {
    toast({
      title: 'Calling client',
      description: `Initiating call to ${phone}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleMessageClient = (client) => {
    toast({
      title: 'Message client',
      description: `Opening messaging interface for ${client}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleGenerateReport = (order) => {
    toast({
      title: 'Generating report',
      description: `Service report for order ${order.id} is being generated.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Filter orders based on status for different tabs
  const pendingOrders = serviceOrders.filter(order => order.status === 'pending');
  const scheduledOrders = serviceOrders.filter(order => order.status === 'scheduled');
  const inProgressOrders = serviceOrders.filter(order => order.status === 'in-progress');
  const completedOrders = serviceOrders.filter(order => order.status === 'completed');

  return (
    <Layout>
      <Container maxW="container.xl" py={5}>
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">Service Orders</Heading>
          <HStack>
            <Select 
              size="sm" 
              width="200px" 
              value={refreshInterval} 
              onChange={handleRefreshRateChange}
            >
              <option value={10}>Refresh: 10s</option>
              <option value={30}>Refresh: 30s</option>
              <option value={60}>Refresh: 1m</option>
              <option value={300}>Refresh: 5m</option>
            </Select>
            <Button leftIcon={<FiFilter />} variant="outline">
              Filter
            </Button>
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddNew}>
              New Service Order
            </Button>
          </HStack>
        </Flex>

        <Tabs isFitted variant="enclosed" colorScheme="blue" index={activeTab} onChange={setActiveTab}>
          <TabList mb="1em">
            <Tab>All Orders ({serviceOrders.length})</Tab>
            <Tab>Pending ({pendingOrders.length})</Tab>
            <Tab>Scheduled ({scheduledOrders.length})</Tab>
            <Tab>In Progress ({inProgressOrders.length})</Tab>
            <Tab>Completed ({completedOrders.length})</Tab>
          </TabList>
          <TabPanels>
            {/* All Orders Tab */}
            <TabPanel p={0}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Client</Th>
                      <Th>Problem</Th>
                      <Th>Scheduled</Th>
                      <Th>Technician</Th>
                      <Th>Status</Th>
                      <Th>Priority</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {serviceOrders.map((order) => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.clientName}</Td>
                        <Td>{order.problem}</Td>
                        <Td>{order.scheduledDate} {order.scheduledTime}</Td>
                        <Td>{order.technician || 'Not assigned'}</Td>
                        <Td>
                          <Badge colorScheme={statusColors[order.status]}>
                            {statusNames[order.status]}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={priorityColors[order.priority]}>
                            {order.priority}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="View order"
                              icon={<FiEye />}
                              size="sm"
                              onClick={() => handleView(order)}
                            />
                            <IconButton
                              aria-label="Edit order"
                              icon={<FiEdit />}
                              size="sm"
                              onClick={() => handleEdit(order)}
                              isDisabled={order.status === 'completed'}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>

            {/* Pending Orders Tab */}
            <TabPanel p={0}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Client</Th>
                      <Th>Problem</Th>
                      <Th>Scheduled</Th>
                      <Th>Priority</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pendingOrders.map((order) => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.clientName}</Td>
                        <Td>{order.problem}</Td>
                        <Td>{order.scheduledDate} {order.scheduledTime}</Td>
                        <Td>
                          <Badge colorScheme={priorityColors[order.priority]}>
                            {order.priority}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="View order"
                              icon={<FiEye />}
                              size="sm"
                              onClick={() => handleView(order)}
                            />
                            <IconButton
                              aria-label="Edit order"
                              icon={<FiEdit />}
                              size="sm"
                              onClick={() => handleEdit(order)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>

            {/* Scheduled Orders Tab */}
            <TabPanel p={0}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Client</Th>
                      <Th>Problem</Th>
                      <Th>Scheduled</Th>
                      <Th>Technician</Th>
                      <Th>Priority</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {scheduledOrders.map((order) => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.clientName}</Td>
                        <Td>{order.problem}</Td>
                        <Td>{order.scheduledDate} {order.scheduledTime}</Td>
                        <Td>{order.technician || 'Not assigned'}</Td>
                        <Td>
                          <Badge colorScheme={priorityColors[order.priority]}>
                            {order.priority}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="View order"
                              icon={<FiEye />}
                              size="sm"
                              onClick={() => handleView(order)}
                            />
                            <IconButton
                              aria-label="Edit order"
                              icon={<FiEdit />}
                              size="sm"
                              onClick={() => handleEdit(order)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>

            {/* In Progress Orders Tab */}
            <TabPanel p={0}>
              <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                {inProgressOrders.map((order) => (
                  <Card key={order.id} variant="outline" boxShadow="md">
                    <CardHeader bg="blue.50" pb={2}>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Heading size="md">{order.id}</Heading>
                        <HStack>
                          <Badge colorScheme={priorityColors[order.priority]}>
                            {order.priority}
                          </Badge>
                          <Badge colorScheme={statusColors[order.status]}>
                            {statusNames[order.status]}
                          </Badge>
                        </HStack>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={3}>
                      <VStack align="stretch" spacing={3}>
                        <Flex justifyContent="space-between">
                          <Text fontWeight="bold">{order.clientName}</Text>
                          <HStack>
                            <IconButton
                              aria-label="Call client"
                              icon={<FiPhone />}
                              size="xs"
                              colorScheme="green"
                              variant="ghost"
                              onClick={() => handleCallClient(order.clientPhone)}
                            />
                            <IconButton
                              aria-label="Message client"
                              icon={<FiMessageSquare />}
                              size="xs"
                              colorScheme="blue"
                              variant="ghost"
                              onClick={() => handleMessageClient(order.clientName)}
                            />
                          </HStack>
                        </Flex>
                        
                        <Text fontSize="sm" color="gray.600">
                          <Icon as={FiMapPin} mr={1} />
                          {order.address}
                        </Text>
                        
                        <Text fontSize="sm">
                          <Icon as={FiTool} mr={1} />
                          {order.equipmentType} - {order.model}
                        </Text>
                        
                        <Box>
                          <Text fontSize="sm" fontWeight="medium">Problem:</Text>
                          <Text fontSize="sm">{order.problem}</Text>
                        </Box>
                        
                        <Box>
                          <Flex justifyContent="space-between" alignItems="center">
                            <Text fontSize="sm" fontWeight="medium">Progress:</Text>
                            <Text fontSize="xs" color="gray.600">
                              Last updated: {new Date(order.lastUpdated).toLocaleTimeString()}
                            </Text>
                          </Flex>
                          <Progress value={order.progress} size="sm" colorScheme="blue" borderRadius="full" />
                        </Box>
                        
                        {order.currentActivity && (
                          <Box bg="gray.50" p={2} borderRadius="md">
                            <Text fontSize="sm" fontWeight="medium">Current Activity:</Text>
                            <Text fontSize="sm">{order.currentActivity}</Text>
                          </Box>
                        )}
                        
                        <Flex alignItems="center">
                          <Avatar size="sm" src={order.technicianPhoto} mr={2} />
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">{order.technician}</Text>
                            <Text fontSize="xs" color="gray.600">Technician</Text>
                          </Box>
                        </Flex>
                      </VStack>
                    </CardBody>
                    <CardFooter pt={0}>
                      <Flex width="100%" justifyContent="space-between">
                        <Button
                          leftIcon={<FiEye />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(order)}
                        >
                          Details
                        </Button>
                        <Button
                          leftIcon={<FiRefreshCw />}
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: 'Refreshed',
                              description: `Latest status for order ${order.id} retrieved.`,
                              status: 'info',
                              duration: 2000,
                              isClosable: true,
                            });
                          }}
                        >
                          Refresh
                        </Button>
                      </Flex>
                    </CardFooter>
                  </Card>
                ))}
              </Grid>
              {inProgressOrders.length === 0 && (
                <Box textAlign="center" py={10}>
                  <Text color="gray.500">No orders currently in progress</Text>
                </Box>
              )}
            </TabPanel>

            {/* Completed Orders Tab */}
            <TabPanel p={0}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Client</Th>
                      <Th>Problem</Th>
                      <Th>Completed</Th>
                      <Th>Technician</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {completedOrders.map((order) => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.clientName}</Td>
                        <Td>{order.problem}</Td>
                        <Td>{order.completionTime ? new Date(order.completionTime).toLocaleString() : 'N/A'}</Td>
                        <Td>{order.technician || 'Not assigned'}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="View order"
                              icon={<FiEye />}
                              size="sm"
                              onClick={() => handleView(order)}
                            />
                            <IconButton
                              aria-label="Generate report"
                              icon={<FiFileText />}
                              size="sm"
                              colorScheme="green"
                              onClick={() => handleGenerateReport(order)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isViewMode
                ? `Service Order: ${currentOrder?.id}`
                : currentOrder
                ? 'Edit Service Order'
                : 'Create New Service Order'}
            </ModalHeader>
            <ModalCloseButton />
            <form onSubmit={handleSave}>
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <GridItem colSpan={2}>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Client</FormLabel>
                        <Select
                          name="clientName"
                          defaultValue={currentOrder?.clientName || ''}
                          placeholder="Select client"
                        >
                          <option value="Jan Kowalski">Jan Kowalski</option>
                          <option value="Anna Nowak">Anna Nowak</option>
                          <option value="Piotr Wiśniewski">Piotr Wiśniewski</option>
                          <option value="Magdalena Dąbrowska">Magdalena Dąbrowska</option>
                        </Select>
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          name="clientPhone"
                          defaultValue={currentOrder?.clientPhone || ''}
                          placeholder="Client phone number"
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Address</FormLabel>
                        <Input
                          name="address"
                          defaultValue={currentOrder?.address || ''}
                          placeholder="Service address"
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Equipment Type</FormLabel>
                        <Select
                          name="equipmentType"
                          defaultValue={currentOrder?.equipmentType || ''}
                          placeholder="Select equipment type"
                        >
                          <option value="Split AC Unit">Split AC Unit</option>
                          <option value="Heat Pump">Heat Pump</option>
                          <option value="Central AC">Central AC</option>
                          <option value="Ductless Mini-Split">Ductless Mini-Split</option>
                          <option value="Furnace">Furnace</option>
                        </Select>
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isReadOnly={isViewMode}>
                        <FormLabel>Model</FormLabel>
                        <Input
                          name="model"
                          defaultValue={currentOrder?.model || ''}
                          placeholder="Model number"
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isReadOnly={isViewMode}>
                        <FormLabel>Serial Number</FormLabel>
                        <Input
                          name="serialNumber"
                          defaultValue={currentOrder?.serialNumber || ''}
                          placeholder="Serial number"
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Status</FormLabel>
                        <Select
                          name="status"
                          defaultValue={currentOrder?.status || 'pending'}
                        >
                          <option value="pending">Pending</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </Select>
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          name="priority"
                          defaultValue={currentOrder?.priority || 'medium'}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </Select>
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Scheduled Date</FormLabel>
                        <Input
                          name="scheduledDate"
                          type="date"
                          defaultValue={currentOrder?.scheduledDate || ''}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Scheduled Time</FormLabel>
                        <Select
                          name="scheduledTime"
                          defaultValue={currentOrder?.scheduledTime || ''}
                        >
                          <option value="08:00-10:00">08:00-10:00</option>
                          <option value="10:00-12:00">10:00-12:00</option>
                          <option value="12:00-14:00">12:00-14:00</option>
                          <option value="14:00-16:00">14:00-16:00</option>
                          <option value="16:00-18:00">16:00-18:00</option>
                        </Select>
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isReadOnly={isViewMode}>
                        <FormLabel>Technician</FormLabel>
                        <Select
                          name="technician"
                          defaultValue={currentOrder?.technician || ''}
                          placeholder="Assign technician"
                        >
                          <option value="Marek Nowak">Marek Nowak</option>
                          <option value="Tomasz Kowalczyk">Tomasz Kowalczyk</option>
                          <option value="Adam Kowalski">Adam Kowalski</option>
                        </Select>
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isRequired isReadOnly={isViewMode}>
                        <FormLabel>Problem Description</FormLabel>
                        <Textarea
                          name="problem"
                          defaultValue={currentOrder?.problem || ''}
                          placeholder="Describe the issue"
                          rows={2}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isReadOnly={isViewMode}>
                        <FormLabel>Notes</FormLabel>
                        <Textarea
                          name="notes"
                          defaultValue={currentOrder?.notes || ''}
                          placeholder="Additional notes"
                          rows={3}
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>

                  {isViewMode && currentOrder && currentOrder.status === 'in-progress' && (
                    <Box mt={4}>
                      <Text fontWeight="bold" mb={2}>
                        Progress Tracking
                      </Text>
                      <Progress 
                        value={currentOrder.progress} 
                        size="md" 
                        colorScheme="blue" 
                        borderRadius="md"
                        mb={2}
                      />
                      <Flex justifyContent="space-between">
                        <Text fontSize="sm">Current progress: {currentOrder.progress}%</Text>
                        <Text fontSize="sm">
                          Last updated: {new Date(currentOrder.lastUpdated).toLocaleString()}
                        </Text>
                      </Flex>
                      {currentOrder.currentActivity && (
                        <Box mt={2} p={3} bg="blue.50" borderRadius="md">
                          <Text fontWeight="bold" fontSize="sm">Current Activity:</Text>
                          <Text>{currentOrder.currentActivity}</Text>
                        </Box>
                      )}
                      {currentOrder.partsNeeded && currentOrder.partsNeeded.length > 0 && (
                        <Box mt={3}>
                          <Text fontWeight="bold" fontSize="sm">Parts Needed:</Text>
                          <HStack mt={1} spacing={2} flexWrap="wrap">
                            {currentOrder.partsNeeded.map((part, index) => (
                              <Tag key={index} colorScheme={currentOrder.partsAvailable ? "green" : "red"} size="md">
                                <TagLeftIcon as={currentOrder.partsAvailable ? FiCheckCircle : FiAlertCircle} />
                                <TagLabel>{part}</TagLabel>
                              </Tag>
                            ))}
                          </HStack>
                        </Box>
                      )}
                    </Box>
                  )}

                  {isViewMode && currentOrder && currentOrder.status === 'completed' && (
                    <Box mt={4} p={4} borderWidth={1} borderRadius="md" borderColor="green.200" bg="green.50">
                      <Heading size="sm" mb={2}>Completion Details</Heading>
                      <Text fontSize="sm">
                        <strong>Completed on:</strong> {new Date(currentOrder.completionTime).toLocaleString()}
                      </Text>
                      <Text fontSize="sm" mt={2}>
                        <strong>Technician:</strong> {currentOrder.technician}
                      </Text>
                      {currentOrder.completionNotes && (
                        <Box mt={2}>
                          <Text fontSize="sm" fontWeight="bold">Notes:</Text>
                          <Text fontSize="sm">{currentOrder.completionNotes}</Text>
                        </Box>
                      )}
                      <Button 
                        leftIcon={<FiFileText />} 
                        size="sm" 
                        colorScheme="green" 
                        variant="outline"
                        mt={3}
                        onClick={() => handleGenerateReport(currentOrder)}
                      >
                        Generate Service Report
                      </Button>
                    </Box>
                  )}
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  {isViewMode ? 'Close' : 'Cancel'}
                </Button>
                {!isViewMode && (
                  <Button type="submit" colorScheme="blue">
                    {currentOrder ? 'Update' : 'Create'} Service Order
                  </Button>
                )}
                {isViewMode && !currentOrder?.completionTime && (
                  <HStack>
                    <Button
                      leftIcon={<FiPhone />}
                      colorScheme="green"
                      variant="outline"
                      onClick={() => handleCallClient(currentOrder.clientPhone)}
                    >
                      Call Client
                    </Button>
                    <Button
                      leftIcon={<FiEdit />}
                      colorScheme="blue"
                      onClick={() => {
                        setIsViewMode(false);
                      }}
                    >
                      Edit
                    </Button>
                  </HStack>
                )}
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
}