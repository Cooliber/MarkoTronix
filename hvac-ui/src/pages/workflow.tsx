import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
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
  Divider,
  Tag,
  TagLabel,
  Switch,
  FormHelperText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Link,
  Image,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiEdit, 
  FiEye, 
  FiPlay, 
  FiPause, 
  FiCopy, 
  FiTrash2, 
  FiRefreshCw,
  FiExternalLink,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiSettings,
  FiCode,
  FiSave,
  FiDownload,
  FiUpload,
  FiFilter,
  FiList
} from 'react-icons/fi';
import Layout from '@/components/Layout';

// Mock data for workflow templates
const workflowTemplates = [
  {
    id: 'template-001',
    name: 'Client Onboarding',
    description: 'Automates the client onboarding process including welcome email, document collection, and initial setup.',
    category: 'Client Management',
    triggers: ['New Client Created'],
    actions: ['Send Welcome Email', 'Create Document Request', 'Schedule Initial Call'],
    complexity: 'Medium',
    estimatedSetupTime: '15 min',
    popularity: 'High',
    image: 'https://n8n.io/images/workflows/client-onboarding.png'
  },
  {
    id: 'template-002',
    name: 'Service Reminder',
    description: 'Sends automated service reminders to clients based on equipment installation date and service intervals.',
    category: 'Service Management',
    triggers: ['Schedule', 'Service Due Date'],
    actions: ['Send Email Reminder', 'Create Service Task', 'Update Client Record'],
    complexity: 'Low',
    estimatedSetupTime: '10 min',
    popularity: 'High',
    image: 'https://n8n.io/images/workflows/service-reminder.png'
  },
  {
    id: 'template-003',
    name: 'Warranty Expiration Alert',
    description: 'Notifies clients and staff about upcoming warranty expirations with renewal options.',
    category: 'Warranty Management',
    triggers: ['Warranty Expiration Date'],
    actions: ['Send Client Notification', 'Create Follow-up Task', 'Generate Renewal Offer'],
    complexity: 'Low',
    estimatedSetupTime: '10 min',
    popularity: 'Medium',
    image: 'https://n8n.io/images/workflows/warranty-alert.png'
  },
  {
    id: 'template-004',
    name: 'Service Report Generator',
    description: 'Automatically generates and sends service reports after a service order is completed.',
    category: 'Reporting',
    triggers: ['Service Order Completed'],
    actions: ['Generate PDF Report', 'Send to Client', 'Archive in CRM'],
    complexity: 'Medium',
    estimatedSetupTime: '20 min',
    popularity: 'High',
    image: 'https://n8n.io/images/workflows/report-generator.png'
  },
  {
    id: 'template-005',
    name: 'Lead Qualification',
    description: 'Qualifies and scores incoming leads based on predefined criteria and assigns to appropriate staff.',
    category: 'Sales',
    triggers: ['New Lead Form Submission', 'Website Inquiry'],
    actions: ['Score Lead', 'Assign to Sales Rep', 'Schedule Follow-up'],
    complexity: 'High',
    estimatedSetupTime: '30 min',
    popularity: 'Medium',
    image: 'https://n8n.io/images/workflows/lead-qualification.png'
  },
  {
    id: 'template-006',
    name: 'Inventory Alert',
    description: 'Monitors inventory levels and sends alerts when items fall below reorder thresholds.',
    category: 'Inventory Management',
    triggers: ['Inventory Level Change'],
    actions: ['Send Alert to Manager', 'Create Purchase Order', 'Update Inventory Status'],
    complexity: 'Medium',
    estimatedSetupTime: '15 min',
    popularity: 'Medium',
    image: 'https://n8n.io/images/workflows/inventory-alert.png'
  }
];

// Mock data for active workflows
const mockActiveWorkflows = [
  {
    id: 'wf-001',
    name: 'Client Welcome Sequence',
    description: 'Sends welcome emails and schedules follow-up tasks for new clients',
    status: 'active',
    lastRun: '2025-05-02T14:30:00Z',
    nextRun: '2025-05-04T09:00:00Z',
    executions: 128,
    successRate: 98,
    template: 'template-001',
    createdAt: '2025-01-15T10:00:00Z',
    modifiedAt: '2025-04-10T11:20:00Z',
    triggers: ['New Client Created'],
    actions: ['Send Welcome Email', 'Create Task', 'Update Client Status']
  },
  {
    id: 'wf-002',
    name: 'Monthly Service Reminders',
    description: 'Sends service reminders to clients with maintenance contracts',
    status: 'active',
    lastRun: '2025-05-01T08:15:00Z',
    nextRun: '2025-06-01T08:00:00Z',
    executions: 45,
    successRate: 100,
    template: 'template-002',
    createdAt: '2025-02-05T14:30:00Z',
    modifiedAt: '2025-04-15T09:45:00Z',
    triggers: ['Schedule (Monthly)'],
    actions: ['Query Eligible Clients', 'Send Email Reminder', 'Log Activity']
  },
  {
    id: 'wf-003',
    name: 'Warranty Expiration Notifications',
    description: 'Alerts clients about upcoming warranty expirations',
    status: 'paused',
    lastRun: '2025-04-28T10:00:00Z',
    nextRun: null,
    executions: 67,
    successRate: 94,
    template: 'template-003',
    createdAt: '2025-03-10T11:15:00Z',
    modifiedAt: '2025-05-01T16:20:00Z',
    triggers: ['Warranty Expiration (30 days before)'],
    actions: ['Send Client Email', 'Create Follow-up Task', 'Generate Renewal Quote']
  },
  {
    id: 'wf-004',
    name: 'Service Report Generator',
    description: 'Creates and sends service reports after job completion',
    status: 'active',
    lastRun: '2025-05-03T09:45:00Z',
    nextRun: null, // Event-based trigger
    executions: 203,
    successRate: 99,
    template: 'template-004',
    createdAt: '2025-01-20T13:00:00Z',
    modifiedAt: '2025-04-05T10:30:00Z',
    triggers: ['Service Order Status Change to Completed'],
    actions: ['Generate PDF Report', 'Send Email to Client', 'Archive in CRM']
  }
];

// Status color mapping
const statusColors = {
  'active': 'green',
  'paused': 'yellow',
  'error': 'red',
  'draft': 'gray'
};

export default function WorkflowPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeWorkflows, setActiveWorkflows] = useState(mockActiveWorkflows);
  const [templates, setTemplates] = useState(workflowTemplates);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  const handleAddNew = () => {
    setCurrentWorkflow(null);
    setCurrentTemplate(null);
    setIsViewMode(false);
    setIsTemplateMode(false);
    onOpen();
  };

  const handleEdit = (workflow) => {
    setCurrentWorkflow(workflow);
    setCurrentTemplate(null);
    setIsViewMode(false);
    setIsTemplateMode(false);
    onOpen();
  };

  const handleView = (workflow) => {
    setCurrentWorkflow(workflow);
    setCurrentTemplate(null);
    setIsViewMode(true);
    setIsTemplateMode(false);
    onOpen();
  };

  const handleViewTemplate = (template) => {
    setCurrentTemplate(template);
    setCurrentWorkflow(null);
    setIsViewMode(true);
    setIsTemplateMode(true);
    onOpen();
  };

  const handleUseTemplate = (template) => {
    setCurrentTemplate(template);
    setCurrentWorkflow(null);
    setIsViewMode(false);
    setIsTemplateMode(true);
    onOpen();
  };

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    if (isTemplateMode) {
      // Creating a new workflow from a template
      const newWorkflow = {
        id: `wf-${(activeWorkflows.length + 1).toString().padStart(3, '0')}`,
        name: formData.get('name'),
        description: formData.get('description'),
        status: 'draft',
        lastRun: null,
        nextRun: null,
        executions: 0,
        successRate: 0,
        template: currentTemplate.id,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        triggers: currentTemplate.triggers,
        actions: currentTemplate.actions
      };
      
      setActiveWorkflows([...activeWorkflows, newWorkflow]);
      toast({
        title: 'Workflow created',
        description: `New workflow "${newWorkflow.name}" has been created from template.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else if (currentWorkflow) {
      // Update existing workflow
      const updatedWorkflow = {
        ...currentWorkflow,
        name: formData.get('name'),
        description: formData.get('description'),
        status: formData.get('status'),
        modifiedAt: new Date().toISOString()
      };
      
      setActiveWorkflows(activeWorkflows.map(wf => 
        wf.id === currentWorkflow.id ? updatedWorkflow : wf
      ));
      
      toast({
        title: 'Workflow updated',
        description: `Workflow "${updatedWorkflow.name}" has been updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Create new workflow from scratch
      const newWorkflow = {
        id: `wf-${(activeWorkflows.length + 1).toString().padStart(3, '0')}`,
        name: formData.get('name'),
        description: formData.get('description'),
        status: 'draft',
        lastRun: null,
        nextRun: null,
        executions: 0,
        successRate: 0,
        template: null,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        triggers: [],
        actions: []
      };
      
      setActiveWorkflows([...activeWorkflows, newWorkflow]);
      toast({
        title: 'Workflow created',
        description: `New workflow "${newWorkflow.name}" has been created.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    
    onClose();
  };

  const handleToggleStatus = (workflow) => {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    const updatedWorkflows = activeWorkflows.map(wf => {
      if (wf.id === workflow.id) {
        return {
          ...wf,
          status: newStatus,
          modifiedAt: new Date().toISOString()
        };
      }
      return wf;
    });
    
    setActiveWorkflows(updatedWorkflows);
    
    toast({
      title: `Workflow ${newStatus}`,
      description: `Workflow "${workflow.name}" is now ${newStatus}.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteWorkflow = (workflow) => {
    setActiveWorkflows(activeWorkflows.filter(wf => wf.id !== workflow.id));
    
    toast({
      title: 'Workflow deleted',
      description: `Workflow "${workflow.name}" has been deleted.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDuplicateWorkflow = (workflow) => {
    const newWorkflow = {
      ...workflow,
      id: `wf-${(activeWorkflows.length + 1).toString().padStart(3, '0')}`,
      name: `${workflow.name} (Copy)`,
      status: 'draft',
      lastRun: null,
      nextRun: null,
      executions: 0,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    
    setActiveWorkflows([...activeWorkflows, newWorkflow]);
    
    toast({
      title: 'Workflow duplicated',
      description: `Workflow has been duplicated as "${newWorkflow.name}".`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRunNow = (workflow) => {
    toast({
      title: 'Workflow triggered',
      description: `Workflow "${workflow.name}" has been manually triggered.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleOpenEditor = (workflow) => {
    toast({
      title: 'Opening n8n editor',
      description: `Opening workflow "${workflow.name}" in the n8n editor.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    
    // In a real implementation, this would redirect to the n8n editor with the workflow loaded
    window.open('http://localhost:5678/workflow/' + workflow.id, '_blank');
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={5}>
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">Workflow Automation</Heading>
          <HStack>
            <Button leftIcon={<FiExternalLink />} variant="outline" colorScheme="blue">
              Open n8n Dashboard
            </Button>
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddNew}>
              Create Workflow
            </Button>
          </HStack>
        </Flex>

        <Tabs isFitted variant="enclosed" colorScheme="blue" index={activeTab} onChange={setActiveTab}>
          <TabList mb="1em">
            <Tab>Active Workflows</Tab>
            <Tab>Workflow Templates</Tab>
          </TabList>
          <TabPanels>
            {/* Active Workflows Tab */}
            <TabPanel p={0}>
              <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                {activeWorkflows.map((workflow) => (
                  <Card key={workflow.id} variant="outline" boxShadow="md">
                    <CardHeader pb={2}>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Heading size="md">{workflow.name}</Heading>
                        <Badge colorScheme={statusColors[workflow.status]}>
                          {workflow.status}
                        </Badge>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={2}>
                      <Text fontSize="sm" color="gray.600" noOfLines={2} mb={3}>
                        {workflow.description}
                      </Text>
                      
                      <VStack align="stretch" spacing={2}>
                        {workflow.lastRun && (
                          <Flex justifyContent="space-between" fontSize="sm">
                            <Text color="gray.600">Last run:</Text>
                            <Text>{new Date(workflow.lastRun).toLocaleString()}</Text>
                          </Flex>
                        )}
                        
                        {workflow.nextRun && (
                          <Flex justifyContent="space-between" fontSize="sm">
                            <Text color="gray.600">Next run:</Text>
                            <Text>{new Date(workflow.nextRun).toLocaleString()}</Text>
                          </Flex>
                        )}
                        
                        <Flex justifyContent="space-between" fontSize="sm">
                          <Text color="gray.600">Executions:</Text>
                          <Text>{workflow.executions}</Text>
                        </Flex>
                        
                        <Flex justifyContent="space-between" fontSize="sm">
                          <Text color="gray.600">Success rate:</Text>
                          <Text color={workflow.successRate >= 95 ? "green.500" : workflow.successRate >= 80 ? "yellow.500" : "red.500"}>
                            {workflow.successRate}%
                          </Text>
                        </Flex>
                      </VStack>
                      
                      <Divider my={3} />
                      
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>Triggers:</Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {workflow.triggers.map((trigger, index) => (
                            <Tag key={index} size="sm" colorScheme="purple" mb={1}>
                              {trigger}
                            </Tag>
                          ))}
                        </HStack>
                      </Box>
                    </CardBody>
                    <CardFooter pt={0}>
                      <Flex width="100%" justifyContent="space-between">
                        <HStack>
                          <IconButton
                            aria-label="View workflow"
                            icon={<FiEye />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(workflow)}
                          />
                          <IconButton
                            aria-label="Edit workflow"
                            icon={<FiEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(workflow)}
                          />
                          <IconButton
                            aria-label="Open in editor"
                            icon={<FiCode />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditor(workflow)}
                          />
                        </HStack>
                        <HStack>
                          <IconButton
                            aria-label={workflow.status === 'active' ? 'Pause workflow' : 'Activate workflow'}
                            icon={workflow.status === 'active' ? <FiPause /> : <FiPlay />}
                            size="sm"
                            colorScheme={workflow.status === 'active' ? 'yellow' : 'green'}
                            variant="ghost"
                            onClick={() => handleToggleStatus(workflow)}
                          />
                          <IconButton
                            aria-label="Run now"
                            icon={<FiPlay />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleRunNow(workflow)}
                            isDisabled={workflow.status !== 'active'}
                          />
                        </HStack>
                      </Flex>
                    </CardFooter>
                  </Card>
                ))}
              </Grid>
              {activeWorkflows.length === 0 && (
                <Box textAlign="center" py={10}>
                  <Text color="gray.500">No active workflows. Create one from a template or from scratch.</Text>
                  <Button mt={4} colorScheme="blue" onClick={() => setActiveTab(1)}>
                    Browse Templates
                  </Button>
                </Box>
              )}
            </TabPanel>

            {/* Workflow Templates Tab */}
            <TabPanel p={0}>
              <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                {templates.map((template) => (
                  <Card key={template.id} variant="outline" boxShadow="md">
                    <CardHeader pb={2}>
                      <Heading size="md">{template.name}</Heading>
                      <Badge colorScheme="blue" mt={1}>
                        {template.category}
                      </Badge>
                    </CardHeader>
                    <CardBody pt={2}>
                      {template.image && (
                        <Box mb={3} borderRadius="md" overflow="hidden">
                          <Image src={template.image} alt={template.name} />
                        </Box>
                      )}
                      
                      <Text fontSize="sm" color="gray.600" noOfLines={2} mb={3}>
                        {template.description}
                      </Text>
                      
                      <HStack spacing={4} mb={3}>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">Complexity</Text>
                          <Text fontSize="sm" fontWeight="medium">{template.complexity}</Text>
                        </VStack>
                        
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">Setup Time</Text>
                          <Text fontSize="sm" fontWeight="medium">{template.estimatedSetupTime}</Text>
                        </VStack>
                        
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">Popularity</Text>
                          <Text fontSize="sm" fontWeight="medium">{template.popularity}</Text>
                        </VStack>
                      </HStack>
                      
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>Triggers:</Text>
                        <HStack spacing={2} flexWrap="wrap" mb={2}>
                          {template.triggers.map((trigger, index) => (
                            <Tag key={index} size="sm" colorScheme="purple" mb={1}>
                              {trigger}
                            </Tag>
                          ))}
                        </HStack>
                        
                        <Text fontSize="sm" fontWeight="medium" mb={1}>Actions:</Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {template.actions.map((action, index) => (
                            <Tag key={index} size="sm" colorScheme="blue" mb={1}>
                              {action}
                            </Tag>
                          ))}
                        </HStack>
                      </Box>
                    </CardBody>
                    <CardFooter pt={0}>
                      <Flex width="100%" justifyContent="space-between">
                        <Button
                          leftIcon={<FiEye />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewTemplate(template)}
                        >
                          Preview
                        </Button>
                        <Button
                          leftIcon={<FiPlus />}
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleUseTemplate(template)}
                        >
                          Use Template
                        </Button>
                      </Flex>
                    </CardFooter>
                  </Card>
                ))}
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isViewMode
                ? isTemplateMode
                  ? `Template: ${currentTemplate?.name}`
                  : `Workflow: ${currentWorkflow?.name}`
                : isTemplateMode
                ? 'Create Workflow from Template'
                : currentWorkflow
                ? 'Edit Workflow'
                : 'Create New Workflow'}
            </ModalHeader>
            <ModalCloseButton />
            <form onSubmit={handleSave}>
              <ModalBody>
                {isViewMode && isTemplateMode && currentTemplate && (
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="sm" mb={2}>Description</Heading>
                      <Text>{currentTemplate.description}</Text>
                    </Box>
                    
                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Category</Text>
                        <Text fontWeight="medium">{currentTemplate.category}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Complexity</Text>
                        <Text fontWeight="medium">{currentTemplate.complexity}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Setup Time</Text>
                        <Text fontWeight="medium">{currentTemplate.estimatedSetupTime}</Text>
                      </Box>
                    </Grid>
                    
                    {currentTemplate.image && (
                      <Box borderRadius="md" overflow="hidden" my={2}>
                        <Image src={currentTemplate.image} alt={currentTemplate.name} />
                      </Box>
                    )}
                    
                    <Box>
                      <Heading size="sm" mb={2}>Workflow Details</Heading>
                      
                      <Accordion allowToggle defaultIndex={[0]}>
                        <AccordionItem>
                          <AccordionButton>
                            <Box flex="1" textAlign="left" fontWeight="medium">
                              Triggers
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={2}>
                              {currentTemplate.triggers.map((trigger, index) => (
                                <Box key={index} p={2} bg="purple.50" borderRadius="md">
                                  <Text>{trigger}</Text>
                                </Box>
                              ))}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>

                        <AccordionItem>
                          <AccordionButton>
                            <Box flex="1" textAlign="left" fontWeight="medium">
                              Actions
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={2}>
                              {currentTemplate.actions.map((action, index) => (
                                <Box key={index} p={2} bg="blue.50" borderRadius="md">
                                  <Text>{action}</Text>
                                </Box>
                              ))}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </Box>
                  </VStack>
                )}
                
                {isViewMode && !isTemplateMode && currentWorkflow && (
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="sm" mb={2}>Description</Heading>
                      <Text>{currentWorkflow.description}</Text>
                    </Box>
                    
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Status</Text>
                        <Badge colorScheme={statusColors[currentWorkflow.status]}>
                          {currentWorkflow.status}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Created</Text>
                        <Text>{new Date(currentWorkflow.createdAt).toLocaleString()}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Last Modified</Text>
                        <Text>{new Date(currentWorkflow.modifiedAt).toLocaleString()}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Template</Text>
                        <Text>{currentWorkflow.template ? `Based on template` : 'Custom workflow'}</Text>
                      </Box>
                    </Grid>
                    
                    <Divider />
                    
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Executions</Text>
                        <Text fontWeight="medium">{currentWorkflow.executions}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Success Rate</Text>
                        <Text 
                          fontWeight="medium"
                          color={currentWorkflow.successRate >= 95 ? "green.500" : currentWorkflow.successRate >= 80 ? "yellow.500" : "red.500"}
                        >
                          {currentWorkflow.successRate}%
                        </Text>
                      </Box>
                      {currentWorkflow.lastRun && (
                        <Box>
                          <Text fontSize="sm" color="gray.500">Last Run</Text>
                          <Text>{new Date(currentWorkflow.lastRun).toLocaleString()}</Text>
                        </Box>
                      )}
                      {currentWorkflow.nextRun && (
                        <Box>
                          <Text fontSize="sm" color="gray.500">Next Run</Text>
                          <Text>{new Date(currentWorkflow.nextRun).toLocaleString()}</Text>
                        </Box>
                      )}
                    </Grid>
                    
                    <Box>
                      <Heading size="sm" mb={2}>Workflow Details</Heading>
                      
                      <Accordion allowToggle defaultIndex={[0]}>
                        <AccordionItem>
                          <AccordionButton>
                            <Box flex="1" textAlign="left" fontWeight="medium">
                              Triggers
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={2}>
                              {currentWorkflow.triggers.map((trigger, index) => (
                                <Box key={index} p={2} bg="purple.50" borderRadius="md">
                                  <Text>{trigger}</Text>
                                </Box>
                              ))}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>

                        <AccordionItem>
                          <AccordionButton>
                            <Box flex="1" textAlign="left" fontWeight="medium">
                              Actions
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={2}>
                              {currentWorkflow.actions.map((action, index) => (
                                <Box key={index} p={2} bg="blue.50" borderRadius="md">
                                  <Text>{action}</Text>
                                </Box>
                              ))}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </Box>
                  </VStack>
                )}
                
                {!isViewMode && (
                  <VStack spacing={4} align="stretch">
                    {isTemplateMode && currentTemplate && (
                      <Box p={3} bg="blue.50" borderRadius="md">
                        <Flex alignItems="center">
                          <Box mr={3}>
                            <FiInfo size={24} color="#3182CE" />
                          </Box>
                          <Box>
                            <Text fontWeight="medium">Creating from template: {currentTemplate.name}</Text>
                            <Text fontSize="sm">{currentTemplate.description}</Text>
                          </Box>
                        </Flex>
                      </Box>
                    )}
                    
                    <FormControl isRequired>
                      <FormLabel>Workflow Name</FormLabel>
                      <Input
                        name="name"
                        defaultValue={
                          currentWorkflow?.name || 
                          (isTemplateMode ? currentTemplate?.name : '')
                        }
                        placeholder="Enter workflow name"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        defaultValue={
                          currentWorkflow?.description || 
                          (isTemplateMode ? currentTemplate?.description : '')
                        }
                        placeholder="Enter workflow description"
                        rows={3}
                      />
                    </FormControl>

                    {currentWorkflow && (
                      <FormControl>
                        <FormLabel>Status</FormLabel>
                        <Select
                          name="status"
                          defaultValue={currentWorkflow.status}
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                        </Select>
                      </FormControl>
                    )}
                    
                    {isTemplateMode && currentTemplate && (
                      <Box>
                        <Heading size="xs" mb={2}>Template Details</Heading>
                        <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={3}>
                          <Box>
                            <Text fontSize="xs" color="gray.500">Category</Text>
                            <Text fontSize="sm">{currentTemplate.category}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" color="gray.500">Complexity</Text>
                            <Text fontSize="sm">{currentTemplate.complexity}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" color="gray.500">Setup Time</Text>
                            <Text fontSize="sm">{currentTemplate.estimatedSetupTime}</Text>
                          </Box>
                        </Grid>
                        
                        <Box mb={2}>
                          <Text fontSize="xs" color="gray.500">Triggers:</Text>
                          <HStack spacing={2} flexWrap="wrap">
                            {currentTemplate.triggers.map((trigger, index) => (
                              <Tag key={index} size="sm" colorScheme="purple" mb={1}>
                                {trigger}
                              </Tag>
                            ))}
                          </HStack>
                        </Box>
                        
                        <Box>
                          <Text fontSize="xs" color="gray.500">Actions:</Text>
                          <HStack spacing={2} flexWrap="wrap">
                            {currentTemplate.actions.map((action, index) => (
                              <Tag key={index} size="sm" colorScheme="blue" mb={1}>
                                {action}
                              </Tag>
                            ))}
                          </HStack>
                        </Box>
                      </Box>
                    )}
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  {isViewMode ? 'Close' : 'Cancel'}
                </Button>
                
                {isViewMode && !isTemplateMode && currentWorkflow && (
                  <HStack spacing={2}>
                    <Button
                      leftIcon={<FiEdit />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => {
                        setIsViewMode(false);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      leftIcon={<FiCode />}
                      colorScheme="purple"
                      onClick={() => {
                        handleOpenEditor(currentWorkflow);
                        onClose();
                      }}
                    >
                      Open in Editor
                    </Button>
                    <Button
                      leftIcon={currentWorkflow.status === 'active' ? <FiPause /> : <FiPlay />}
                      colorScheme={currentWorkflow.status === 'active' ? 'yellow' : 'green'}
                      onClick={() => {
                        handleToggleStatus(currentWorkflow);
                        onClose();
                      }}
                    >
                      {currentWorkflow.status === 'active' ? 'Pause' : 'Activate'}
                    </Button>
                  </HStack>
                )}
                
                {isViewMode && isTemplateMode && currentTemplate && (
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    onClick={() => {
                      setIsViewMode(false);
                    }}
                  >
                    Use Template
                  </Button>
                )}
                
                {!isViewMode && (
                  <Button type="submit" colorScheme="blue">
                    {currentWorkflow ? 'Update' : 'Create'} Workflow
                  </Button>
                )}
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
}