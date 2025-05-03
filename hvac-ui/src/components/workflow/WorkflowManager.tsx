import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Badge,
  Input,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  IconButton,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiPlay, FiDownload, FiUpload, FiCopy, FiEdit, FiTrash2, FiInfo } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { triggerWorkflow, workflowTemplates } from '../../utils/n8nIntegration';
import { gsap } from 'gsap';
import { useRef } from 'react';

interface WorkflowData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  lastRun?: string;
  status?: 'active' | 'inactive' | 'error';
}

const WorkflowManager: React.FC = () => {
  const { t } = useTranslation('common');
  const toast = useToast();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowParams, setWorkflowParams] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Animation effect when component mounts
  useEffect(() => {
    const cards = document.querySelectorAll('.workflow-card');
    
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.out'
      }
    );
  }, [workflows]);
  
  // Load workflow templates
  useEffect(() => {
    // In a real app, you would fetch this from your API
    const loadedWorkflows = Object.values(workflowTemplates).map(template => ({
      id: template.id,
      name: template.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: template.description,
      tags: template.requiredParams,
      status: 'active' as const,
      lastRun: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    }));
    
    setWorkflows(loadedWorkflows);
  }, []);
  
  const handleSelectWorkflow = (id: string) => {
    setSelectedWorkflow(id);
    setWorkflowParams({});
    
    // Animation for selected workflow
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.02,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };
  
  const handleParamChange = (key: string, value: any) => {
    setWorkflowParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleRunWorkflow = async () => {
    if (!selectedWorkflow) return;
    
    setIsLoading(true);
    
    try {
      const result = await triggerWorkflow({
        workflowId: selectedWorkflow,
        data: workflowParams
      });
      
      if (result.success) {
        toast({
          title: t('workflow.runSuccess'),
          description: t('workflow.executionStarted', { id: result.executionId }),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update the last run time
        setWorkflows(prev => 
          prev.map(wf => 
            wf.id === selectedWorkflow 
              ? { ...wf, lastRun: new Date().toISOString() } 
              : wf
          )
        );
      } else {
        toast({
          title: t('workflow.runFailed'),
          description: result.error || t('workflow.unknownError'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error running workflow:', error);
      toast({
        title: t('workflow.runFailed'),
        description: t('workflow.connectionError'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getWorkflowTemplate = (id: string) => {
    return Object.values(workflowTemplates).find(t => t.id === id);
  };
  
  const renderParamFields = () => {
    if (!selectedWorkflow) return null;
    
    const template = getWorkflowTemplate(selectedWorkflow);
    if (!template) return null;
    
    return (
      <VStack spacing={4} align="stretch" w="100%">
        {template.requiredParams.map(param => (
          <FormControl key={param} isRequired>
            <FormLabel>{t(`workflow.params.${param}`, param)}</FormLabel>
            <Input 
              value={workflowParams[param] || ''} 
              onChange={(e) => handleParamChange(param, e.target.value)}
              placeholder={t(`workflow.params.${param}Placeholder`, `Enter ${param}`)}
            />
          </FormControl>
        ))}
        
        <Button
          colorScheme="blue"
          leftIcon={<FiPlay />}
          onClick={handleRunWorkflow}
          isLoading={isLoading}
          mt={4}
        >
          {t('workflow.run')}
        </Button>
      </VStack>
    );
  };
  
  const renderWorkflowExample = () => {
    if (!selectedWorkflow) return null;
    
    const template = getWorkflowTemplate(selectedWorkflow);
    if (!template || !template.example) return null;
    
    return (
      <Box>
        <Heading size="sm" mb={2}>{t('workflow.exampleData')}</Heading>
        <Code p={4} borderRadius="md" w="100%" display="block" whiteSpace="pre" overflowX="auto">
          {JSON.stringify(template.example, null, 2)}
        </Code>
        <Button
          size="sm"
          leftIcon={<FiCopy />}
          onClick={() => {
            setWorkflowParams(template.example);
            toast({
              title: t('workflow.exampleCopied'),
              status: 'info',
              duration: 2000,
            });
          }}
          mt={2}
        >
          {t('workflow.useExample')}
        </Button>
      </Box>
    );
  };
  
  return (
    <Box p={4}>
      <Heading mb={6}>{t('workflow.title')}</Heading>
      
      <HStack spacing={8} align="flex-start">
        <VStack spacing={4} align="stretch" w="350px">
          <Heading size="md" mb={2}>{t('workflow.availableWorkflows')}</Heading>
          
          {workflows.map((workflow) => (
            <Card 
              key={workflow.id}
              borderWidth="1px"
              borderColor={selectedWorkflow === workflow.id ? 'blue.500' : borderColor}
              borderRadius="lg"
              bg={bgColor}
              className="workflow-card"
              cursor="pointer"
              onClick={() => handleSelectWorkflow(workflow.id)}
              ref={selectedWorkflow === workflow.id ? cardRef : null}
              _hover={{ 
                transform: 'translateY(-2px)', 
                boxShadow: 'md',
                borderColor: 'blue.300'
              }}
              transition="all 0.2s"
            >
              <CardHeader pb={2}>
                <HStack justify="space-between">
                  <Heading size="sm">{workflow.name}</Heading>
                  <Badge 
                    colorScheme={
                      workflow.status === 'active' ? 'green' : 
                      workflow.status === 'error' ? 'red' : 'gray'
                    }
                  >
                    {workflow.status}
                  </Badge>
                </HStack>
              </CardHeader>
              
              <CardBody py={2}>
                <Text fontSize="sm" noOfLines={2}>{workflow.description}</Text>
                <HStack mt={2} flexWrap="wrap">
                  {workflow.tags.map(tag => (
                    <Badge key={tag} colorScheme="blue" variant="outline" fontSize="xs">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
              </CardBody>
              
              <CardFooter pt={0}>
                <Text fontSize="xs" color="gray.500">
                  {t('workflow.lastRun')}: {workflow.lastRun ? new Date(workflow.lastRun).toLocaleString() : t('workflow.never')}
                </Text>
              </CardFooter>
            </Card>
          ))}
        </VStack>
        
        <Divider orientation="vertical" height="auto" />
        
        <Box flex={1}>
          {selectedWorkflow ? (
            <>
              <Heading size="md" mb={4}>
                {workflows.find(w => w.id === selectedWorkflow)?.name || selectedWorkflow}
              </Heading>
              
              <Text mb={6}>
                {workflows.find(w => w.id === selectedWorkflow)?.description}
              </Text>
              
              <Tabs isFitted variant="enclosed" onChange={setActiveTab} index={activeTab}>
                <TabList mb="1em">
                  <Tab>{t('workflow.parameters')}</Tab>
                  <Tab>{t('workflow.example')}</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    {renderParamFields()}
                  </TabPanel>
                  <TabPanel>
                    {renderWorkflowExample()}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </>
          ) : (
            <Box 
              p={8} 
              textAlign="center" 
              borderWidth="1px" 
              borderRadius="lg"
              borderStyle="dashed"
              borderColor={borderColor}
            >
              <Text color="gray.500">{t('workflow.selectWorkflow')}</Text>
            </Box>
          )}
        </Box>
      </HStack>
    </Box>
  );
};

export default WorkflowManager;