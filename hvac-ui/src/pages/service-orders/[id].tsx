import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
  IconButton,
  VStack,
  HStack,
  Divider,
  Avatar,
  Progress,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  List,
  ListItem,
  ListIcon,
  OrderedList,
  UnorderedList,
  Tag,
  TagLabel,
  TagLeftIcon,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  FormControl,
  FormLabel,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
} from '@chakra-ui/react';
import {
  FiPhone,
  FiMessageSquare,
  FiMapPin,
  FiTool,
  FiCalendar,
  FiClock,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiEdit,
  FiCamera,
  FiPackage,
  FiClipboard,
  FiSend,
  FiChevronRight,
  FiChevronLeft,
  FiPlus,
  FiInfo,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import MobileLayout from '@/components/MobileLayout';
import { useAnimationRef, useStaggerAnimation } from '@/hooks/useAnimation';
import { cardEnterAnimation, listItemAnimation, pageEnterAnimation } from '@/utils/animations';

// Mock data for a service order
const mockServiceOrder = {
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
  history: [
    {
      timestamp: '2025-05-03T09:15:00Z',
      action: 'Status update',
      details: 'Replacing filter and checking refrigerant levels',
      user: 'Marek Nowak',
    },
    {
      timestamp: '2025-05-03T08:30:00Z',
      action: 'Arrived at location',
      details: 'Started diagnostic',
      user: 'Marek Nowak',
    },
    {
      timestamp: '2025-05-02T16:45:00Z',
      action: 'Order assigned',
      details: 'Assigned to Marek Nowak',
      user: 'System',
    },
    {
      timestamp: '2025-05-02T14:20:00Z',
      action: 'Order created',
      details: 'Service order created',
      user: 'Anna Wiśniewska',
    },
  ],
  photos: [
    { id: 'p1', url: 'https://images.unsplash.com/photo-1581275233124-e1e5b7c6d3a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', caption: 'AC unit exterior' },
    { id: 'p2', url: 'https://images.unsplash.com/photo-1581275233124-e1e5b7c6d3a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', caption: 'Filter condition' },
  ],
  checklist: [
    { id: 'c1', task: 'Check refrigerant levels', completed: true },
    { id: 'c2', task: 'Clean/replace air filter', completed: true },
    { id: 'c3', task: 'Inspect condenser coils', completed: false },
    { id: 'c4', task: 'Test cooling performance', completed: false },
    { id: 'c5', task: 'Check electrical connections', completed: false },
  ],
};

// Status color mapping
const statusColors = {
  'pending': 'yellow',
  'scheduled': 'blue',
  'in-progress': 'orange',
  'completed': 'green',
  'cancelled': 'red',
};

// Priority color mapping
const priorityColors = {
  'low': 'green',
  'medium': 'blue',
  'high': 'red',
};

export default function ServiceOrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Animation hooks
  const { elementRef: mainContentRef, animate: animateMainContent } = useAnimationRef();
  const { elementRef: detailsRef, animate: animateDetails } = useAnimationRef();
  const { elementRef: progressRef, animate: animateProgress } = useAnimationRef();
  const { elementRef: historyRef, animate: animateHistory } = useAnimationRef();
  const { containerRef, animateChildren } = useStaggerAnimation();

  // Apply animations on component mount
  useEffect(() => {
    // Main content animation
    animateMainContent(() => pageEnterAnimation(mainContentRef.current as HTMLElement));
    
    // Section animations with slight delays for staggered effect
    animateDetails(() => cardEnterAnimation(detailsRef.current as HTMLElement, 0.1));
    animateProgress(() => cardEnterAnimation(progressRef.current as HTMLElement, 0.2));
    animateHistory(() => cardEnterAnimation(historyRef.current as HTMLElement, 0.3));
    
    // Animate list items
    if (historyRef.current) {
      const items = Array.from(
        historyRef.current.querySelectorAll('.history-item')
      ) as HTMLElement[];
      listItemAnimation(items);
    }
  }, [
    animateMainContent,
    animateDetails,
    animateProgress,
    animateHistory,
  ]);

  const handleCallClient = () => {
    toast({
      title: 'Calling client',
      description: `Initiating call to ${mockServiceOrder.clientPhone}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleMessageClient = () => {
    toast({
      title: 'Message client',
      description: `Opening messaging interface for ${mockServiceOrder.clientName}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleUpdateStatus = () => {
    onOpen();
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    toast({
      title: 'Status updated',
      description: 'Service order status has been updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  const handleGenerateReport = () => {
    toast({
      title: 'Generating report',
      description: `Service report for order ${mockServiceOrder.id} is being generated.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <MobileLayout 
      title={`Order ${mockServiceOrder.id}`} 
      showBackButton={true}
      onBack={() => router.push('/service-orders')}
    >
      <Box ref={mainContentRef} pb={6}>
        {/* Status and Priority */}
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <HStack>
            <Badge colorScheme={statusColors[mockServiceOrder.status]} fontSize="md" px={2} py={1}>
              {mockServiceOrder.status === 'in-progress' ? 'In Progress' : mockServiceOrder.status}
            </Badge>
            <Badge colorScheme={priorityColors[mockServiceOrder.priority]} fontSize="md" px={2} py={1}>
              {mockServiceOrder.priority} priority
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            Last updated: {new Date(mockServiceOrder.lastUpdated).toLocaleTimeString()}
          </Text>
        </Flex>

        {/* Client Information */}
        <Card ref={detailsRef} mb={4} boxShadow="sm" borderRadius="lg">
          <CardHeader pb={2}>
            <Flex justifyContent="space-between" alignItems="center">
              <Heading size="md">{mockServiceOrder.clientName}</Heading>
              <HStack>
                <IconButton
                  aria-label="Call client"
                  icon={<FiPhone />}
                  size="sm"
                  colorScheme="green"
                  variant="ghost"
                  onClick={handleCallClient}
                />
                <IconButton
                  aria-label="Message client"
                  icon={<FiMessageSquare />}
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                  onClick={handleMessageClient}
                />
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm">
                <Icon as={FiPhone} mr={2} />
                {mockServiceOrder.clientPhone}
              </Text>
              <Text fontSize="sm">
                <Icon as={FiMapPin} mr={2} />
                {mockServiceOrder.address}
              </Text>
              <Text fontSize="sm">
                <Icon as={FiCalendar} mr={2} />
                {mockServiceOrder.scheduledDate} {mockServiceOrder.scheduledTime}
              </Text>
              <Divider my={2} />
              <Text fontSize="sm">
                <Icon as={FiTool} mr={2} />
                {mockServiceOrder.equipmentType} - {mockServiceOrder.model}
              </Text>
              <Text fontSize="sm" color="gray.600">
                S/N: {mockServiceOrder.serialNumber}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Progress and Current Status */}
        <Card ref={progressRef} mb={4} boxShadow="sm" borderRadius="lg">
          <CardHeader pb={2}>
            <Heading size="md">Progress</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={3}>
              <Flex justifyContent="space-between" alignItems="center">
                <Text fontWeight="medium">{mockServiceOrder.progress}% Complete</Text>
                <HStack>
                  <Avatar size="sm" src={mockServiceOrder.technicianPhoto} />
                  <Text fontSize="sm">{mockServiceOrder.technician}</Text>
                </HStack>
              </Flex>
              
              <Progress 
                value={mockServiceOrder.progress} 
                size="md" 
                colorScheme="blue" 
                borderRadius="full" 
              />
              
              {mockServiceOrder.currentActivity && (
                <Box p={3} bg="blue.50" borderRadius="md">
                  <Text fontWeight="medium" mb={1}>Current Activity:</Text>
                  <Text>{mockServiceOrder.currentActivity}</Text>
                </Box>
              )}
              
              {mockServiceOrder.partsNeeded && mockServiceOrder.partsNeeded.length > 0 && (
                <Box>
                  <Text fontWeight="medium" mb={1}>Parts Needed:</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {mockServiceOrder.partsNeeded.map((part, index) => (
                      <Tag key={index} colorScheme={mockServiceOrder.partsAvailable ? "green" : "red"} size="md">
                        <TagLeftIcon as={mockServiceOrder.partsAvailable ? FiCheckCircle : FiAlertCircle} />
                        <TagLabel>{part}</TagLabel>
                      </Tag>
                    ))}
                  </HStack>
                </Box>
              )}
              
              <Box>
                <Text fontWeight="medium" mb={1}>Service Checklist:</Text>
                <VStack align="stretch" spacing={1}>
                  {mockServiceOrder.checklist.map((item) => (
                    <Flex 
                      key={item.id} 
                      p={2} 
                      bg={item.completed ? "green.50" : "gray.50"} 
                      borderRadius="md"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text>{item.task}</Text>
                      <Icon 
                        as={item.completed ? FiCheck : FiClock} 
                        color={item.completed ? "green.500" : "gray.400"} 
                      />
                    </Flex>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </CardBody>
          <CardFooter pt={0}>
            <Button
              leftIcon={<FiEdit />}
              width="full"
              colorScheme="blue"
              onClick={handleUpdateStatus}
            >
              Update Status
            </Button>
          </CardFooter>
        </Card>

        {/* Service History */}
        <Card ref={historyRef} mb={4} boxShadow="sm" borderRadius="lg">
          <CardHeader pb={2}>
            <Heading size="md">Service History</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={0} divider={<Divider />}>
              {mockServiceOrder.history.map((event, index) => (
                <Box key={index} py={3} className="history-item">
                  <Flex justifyContent="space-between" mb={1}>
                    <Text fontWeight="medium">{event.action}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(event.timestamp).toLocaleString()}
                    </Text>
                  </Flex>
                  <Text fontSize="sm">{event.details}</Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    By: {event.user}
                  </Text>
                </Box>
              ))}
            </VStack>
          </CardBody>
          <CardFooter pt={0}>
            <Button
              leftIcon={<FiFileText />}
              width="full"
              colorScheme="green"
              variant="outline"
              onClick={handleGenerateReport}
            >
              Generate Service Report
            </Button>
          </CardFooter>
        </Card>

        {/* Problem Description and Notes */}
        <Card mb={4} boxShadow="sm" borderRadius="lg">
          <CardHeader pb={2}>
            <Heading size="md">Problem & Notes</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontWeight="medium" mb={1}>Problem Description:</Text>
                <Text>{mockServiceOrder.problem}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="medium" mb={1}>Notes:</Text>
                <Text>{mockServiceOrder.notes}</Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Status Update Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Update Service Status</ModalHeader>
            <ModalCloseButton />
            <form onSubmit={handleStatusSubmit}>
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Current Status</FormLabel>
                    <Select defaultValue={mockServiceOrder.status}>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Progress (%)</FormLabel>
                    <Input type="number" defaultValue={mockServiceOrder.progress} />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Current Activity</FormLabel>
                    <Textarea 
                      defaultValue={mockServiceOrder.currentActivity}
                      placeholder="Describe what you're currently working on"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Update Notes</FormLabel>
                    <Textarea 
                      placeholder="Add any additional notes about the service"
                    />
                  </FormControl>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" colorScheme="blue">
                  Update Status
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </Box>
    </MobileLayout>
  );
}