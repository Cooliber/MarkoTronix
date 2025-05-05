import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Input, 
  Button, 
  Flex, 
  Stack, 
  Badge, 
  Select, 
  Spinner, 
  useToast, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Grid,
  GridItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Image,
  Link,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  SimpleGrid,
  IconButton
} from '@chakra-ui/react';
import { SearchIcon, DownloadIcon, RepeatIcon, ViewIcon, AddIcon, EditIcon, StarIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ClientProfileUpdater, LeadCreator, InvoiceCreator, FeedbackForm } from '../components/attachments';

// API client for mail-ingest-service
const API_URL = process.env.NEXT_PUBLIC_MAIL_INGEST_API_URL || 'http://localhost:8000';

// Types
interface Attachment {
  id: number;
  email_id: number;
  filename: string;
  content_type: string;
  file_path: string;
  created_at: string;
  processed_data?: ProcessedAttachment;
}

interface ProcessedAttachment {
  id: number;
  attachment_id: number;
  success: boolean;
  text_content?: string;
  metadata?: Record<string, any>;
  entities?: Record<string, any>;
  tags?: string[];
  confidence: number;
  error_message?: string;
  supabase_path?: string;
  public_url?: string;
  processed_at: string;
}

interface AttachmentStats {
  total_attachments: number;
  processed_attachments: number;
  successful_processing: number;
  processing_success_rate: number;
  content_type_counts: Record<string, number>;
  tag_counts: Record<string, number>;
  entity_type_counts: Record<string, number>;
  average_confidence: number;
}

const AttachmentsPage: React.FC = () => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [stats, setStats] = useState<AttachmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [entityType, setEntityType] = useState('');
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const toast = useToast();
  const router = useRouter();

  // Fetch attachments and stats on component mount
  useEffect(() => {
    fetchAttachments();
    fetchStats();
  }, []);

  // Extract available tags and entity types from stats
  useEffect(() => {
    if (stats) {
      setAvailableTags(Object.keys(stats.tag_counts));
      setAvailableEntityTypes(Object.keys(stats.entity_type_counts));
    }
  }, [stats]);

  // Fetch attachments from API
  const fetchAttachments = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => params.append('tags', tag));
      }
      if (entityType) params.append('entity_type', entityType);
      params.append('min_confidence', minConfidence.toString());
      
      const response = await fetch(`${API_URL}/attachments/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch attachments');
      
      const data = await response.json();
      setAttachments(data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attachments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch attachment stats from API
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/attachments/stats`);
      if (!response.ok) throw new Error('Failed to fetch attachment stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching attachment stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch attachment statistics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Reprocess an attachment
  const reprocessAttachment = async (attachmentId: number) => {
    try {
      const response = await fetch(`${API_URL}/attachments/${attachmentId}/reprocess`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to reprocess attachment');
      
      toast({
        title: 'Success',
        description: 'Attachment reprocessed successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh attachments and stats
      fetchAttachments();
      fetchStats();
    } catch (error) {
      console.error('Error reprocessing attachment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reprocess attachment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAttachments();
  };

  // Add a tag to the filter
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Remove a tag from the filter
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // Format file size for display
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get color for confidence score
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.5) return 'yellow';
    return 'red';
  };

  // Render attachment details
  const renderAttachmentDetails = () => {
    if (!selectedAttachment) return null;
    
    const { processed_data } = selectedAttachment;
    if (!processed_data) {
      return (
        <Box p={4} borderWidth={1} borderRadius="md">
          <Text>This attachment has not been processed yet.</Text>
          <Button 
            mt={4} 
            leftIcon={<RepeatIcon />} 
            colorScheme="blue"
            onClick={() => reprocessAttachment(selectedAttachment.id)}
          >
            Process Attachment
          </Button>
        </Box>
      );
    }

    // Define tabs for the attachment details
    const [activeTab, setActiveTab] = useState(0);
    const tabs = [
      { label: 'Details', icon: ViewIcon },
      { label: 'Update Client', icon: EditIcon },
      { label: 'Create Lead', icon: AddIcon },
      { label: 'Create Invoice', icon: AddIcon },
      { label: 'Feedback', icon: StarIcon },
    ];

    return (
      <Box p={4} borderWidth={1} borderRadius="md">
        <Heading size="md" mb={4}>
          {selectedAttachment.filename}
          <Badge 
            ml={2} 
            colorScheme={processed_data.success ? 'green' : 'red'}
          >
            {processed_data.success ? 'Processed' : 'Failed'}
          </Badge>
        </Heading>

        <SimpleGrid columns={2} spacing={4} mb={4}>
          <Stat>
            <StatLabel>Confidence</StatLabel>
            <StatNumber>{(processed_data.confidence * 100).toFixed(1)}%</StatNumber>
            <StatHelpText>
              <StatArrow type={processed_data.confidence >= 0.7 ? 'increase' : 'decrease'} />
              {processed_data.confidence >= 0.7 ? 'High' : 'Low'} confidence
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Processed At</StatLabel>
            <StatNumber>{format(new Date(processed_data.processed_at), 'PPp')}</StatNumber>
          </Stat>
        </SimpleGrid>

        {processed_data.public_url && (
          <Box mb={4}>
            <Heading size="sm" mb={2}>Preview</Heading>
            {selectedAttachment.content_type.startsWith('image/') ? (
              <Image 
                src={processed_data.public_url} 
                alt={selectedAttachment.filename}
                maxH="300px"
                objectFit="contain"
              />
            ) : (
              <Link href={processed_data.public_url} isExternal color="blue.500">
                View/Download File <DownloadIcon mx="2px" />
              </Link>
            )}
          </Box>
        )}

        {/* Tab navigation */}
        <Flex mb={4} borderBottom="1px" borderColor="gray.200">
          {tabs.map((tab, index) => (
            <Box 
              key={index}
              px={4}
              py={2}
              cursor="pointer"
              fontWeight={activeTab === index ? "bold" : "normal"}
              borderBottom={activeTab === index ? "2px solid" : "none"}
              borderColor="blue.500"
              onClick={() => setActiveTab(index)}
              display="flex"
              alignItems="center"
            >
              <Box as={tab.icon} mr={2} />
              {tab.label}
            </Box>
          ))}
        </Flex>

        {/* Tab content */}
        <Box mt={4}>
          {activeTab === 0 && (
            <Tabs variant="enclosed">
              <TabList>
                <Tab>Extracted Text</Tab>
                <Tab>Entities</Tab>
                <Tab>Metadata</Tab>
                <Tab>Tags</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Box 
                    p={2} 
                    borderWidth={1} 
                    borderRadius="md" 
                    bg="gray.50" 
                    maxH="300px" 
                    overflowY="auto"
                  >
                    {processed_data.text_content ? (
                      <Text whiteSpace="pre-wrap">{processed_data.text_content}</Text>
                    ) : (
                      <Text color="gray.500">No text content extracted</Text>
                    )}
                  </Box>
                </TabPanel>
                <TabPanel>
                  {processed_data.entities && Object.keys(processed_data.entities).length > 0 ? (
                    <Accordion allowMultiple>
                      {Object.entries(processed_data.entities).map(([key, value]) => (
                        <AccordionItem key={key}>
                          <h2>
                            <AccordionButton>
                              <Box flex="1" textAlign="left" fontWeight="bold">
                                {key}
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            {Array.isArray(value) ? (
                              <ul>
                                {value.map((item, index) => (
                                  <li key={index}>{JSON.stringify(item)}</li>
                                ))}
                              </ul>
                            ) : (
                              <Text>{JSON.stringify(value)}</Text>
                            )}
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <Text color="gray.500">No entities extracted</Text>
                  )}
                </TabPanel>
                <TabPanel>
                  {processed_data.metadata && Object.keys(processed_data.metadata).length > 0 ? (
                    <Accordion allowMultiple>
                      {Object.entries(processed_data.metadata).map(([key, value]) => (
                        <AccordionItem key={key}>
                          <h2>
                            <AccordionButton>
                              <Box flex="1" textAlign="left" fontWeight="bold">
                                {key}
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            <Text>{JSON.stringify(value)}</Text>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <Text color="gray.500">No metadata extracted</Text>
                  )}
                </TabPanel>
                <TabPanel>
                  {processed_data.tags && processed_data.tags.length > 0 ? (
                    <Flex wrap="wrap" gap={2}>
                      {processed_data.tags.map(tag => (
                        <Tag key={tag} colorScheme="blue" size="md">
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      ))}
                    </Flex>
                  ) : (
                    <Text color="gray.500">No tags assigned</Text>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}

          {activeTab === 1 && (
            <ClientProfileUpdater 
              attachment={selectedAttachment} 
              onUpdate={(clientData) => {
                console.log('Client data to update:', clientData);
                // Here you would call your API to update the client profile
                toast({
                  title: 'Client Profile Updated',
                  description: 'The client profile has been updated with the extracted data.',
                  status: 'success',
                  duration: 5000,
                  isClosable: true,
                });
              }}
            />
          )}

          {activeTab === 2 && (
            <LeadCreator 
              attachment={selectedAttachment}
              onCreateLead={(leadData) => {
                console.log('Lead data to create:', leadData);
                // Here you would call your API to create a new lead
                toast({
                  title: 'Lead Created',
                  description: 'A new lead has been created from the attachment data.',
                  status: 'success',
                  duration: 5000,
                  isClosable: true,
                });
              }}
            />
          )}

          {activeTab === 3 && (
            <InvoiceCreator 
              attachment={selectedAttachment}
              onCreateInvoice={(invoiceData) => {
                console.log('Invoice data to create:', invoiceData);
                // Here you would call your API to create a new invoice
                toast({
                  title: 'Invoice Created',
                  description: 'A new invoice has been created from the attachment data.',
                  status: 'success',
                  duration: 5000,
                  isClosable: true,
                });
              }}
            />
          )}

          {activeTab === 4 && (
            <FeedbackForm 
              attachment={selectedAttachment}
              onSubmitFeedback={(feedbackData) => {
                console.log('Feedback data to submit:', feedbackData);
                // Refresh attachments and stats after feedback submission
                fetchAttachments();
                fetchStats();
              }}
            />
          )}
        </Box>

        <Divider my={4} />

        <Flex justifyContent="flex-end">
          <Button 
            leftIcon={<RepeatIcon />} 
            colorScheme="blue"
            onClick={() => reprocessAttachment(selectedAttachment.id)}
          >
            Reprocess
          </Button>
        </Flex>
      </Box>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>Email Attachments</Heading>
      
      <Tabs variant="enclosed" mb={8}>
        <TabList>
          <Tab>Search Attachments</Tab>
          <Tab>Statistics</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              {/* Search and filters */}
              <GridItem colSpan={{ base: 12, md: 4 }}>
                <Box p={4} borderWidth={1} borderRadius="md" bg="white">
                  <Heading size="md" mb={4}>Search & Filters</Heading>
                  
                  <form onSubmit={handleSearch}>
                    <Stack spacing={4}>
                      <Box>
                        <Text mb={1} fontWeight="bold">Search Text</Text>
                        <Input 
                          placeholder="Search in document content..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </Box>
                      
                      <Box>
                        <Text mb={1} fontWeight="bold">Tags</Text>
                        <Select 
                          placeholder="Select tag to filter" 
                          onChange={(e) => addTag(e.target.value)}
                          value=""
                        >
                          {availableTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                        </Select>
                        
                        <Flex wrap="wrap" gap={2} mt={2}>
                          {selectedTags.map(tag => (
                            <Tag key={tag} colorScheme="blue" size="md">
                              <TagLabel>{tag}</TagLabel>
                              <TagCloseButton onClick={() => removeTag(tag)} />
                            </Tag>
                          ))}
                        </Flex>
                      </Box>
                      
                      <Box>
                        <Text mb={1} fontWeight="bold">Entity Type</Text>
                        <Select 
                          placeholder="Filter by entity type" 
                          value={entityType}
                          onChange={(e) => setEntityType(e.target.value)}
                        >
                          <option value="">All entity types</option>
                          {availableEntityTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </Select>
                      </Box>
                      
                      <Box>
                        <Text mb={1} fontWeight="bold">Minimum Confidence</Text>
                        <Flex alignItems="center">
                          <Input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={minConfidence}
                            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                          />
                          <Text ml={2} width="40px">{(minConfidence * 100).toFixed(0)}%</Text>
                        </Flex>
                      </Box>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue" 
                        leftIcon={<SearchIcon />}
                        isLoading={loading}
                      >
                        Search
                      </Button>
                    </Stack>
                  </form>
                </Box>
              </GridItem>
              
              {/* Results */}
              <GridItem colSpan={{ base: 12, md: 8 }}>
                <Box>
                  <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    <Heading size="md">Results</Heading>
                    <Text>{attachments.length} attachments found</Text>
                  </Flex>
                  
                  {loading ? (
                    <Flex justifyContent="center" alignItems="center" height="200px">
                      <Spinner size="xl" />
                    </Flex>
                  ) : attachments.length === 0 ? (
                    <Box p={4} borderWidth={1} borderRadius="md" bg="white">
                      <Text>No attachments found matching your criteria.</Text>
                    </Box>
                  ) : (
                    <Stack spacing={4}>
                      {attachments.map(attachment => (
                        <Box 
                          key={attachment.id} 
                          p={4} 
                          borderWidth={1} 
                          borderRadius="md" 
                          bg="white"
                          _hover={{ borderColor: 'blue.500', cursor: 'pointer' }}
                          onClick={() => setSelectedAttachment(attachment)}
                        >
                          <Flex justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Heading size="sm">{attachment.filename}</Heading>
                              <Text fontSize="sm" color="gray.600">
                                {attachment.content_type}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                Added: {format(new Date(attachment.created_at), 'PPp')}
                              </Text>
                            </Box>
                            <Box>
                              {attachment.processed_data ? (
                                <Badge 
                                  colorScheme={attachment.processed_data.success ? 'green' : 'red'}
                                >
                                  {attachment.processed_data.success ? 'Processed' : 'Failed'}
                                </Badge>
                              ) : (
                                <Badge colorScheme="gray">Not Processed</Badge>
                              )}
                            </Box>
                          </Flex>
                          
                          {attachment.processed_data && attachment.processed_data.success && (
                            <Box mt={2}>
                              <Flex alignItems="center" mb={1}>
                                <Text fontSize="sm" fontWeight="bold" mr={2}>Confidence:</Text>
                                <Badge 
                                  colorScheme={getConfidenceColor(attachment.processed_data.confidence)}
                                >
                                  {(attachment.processed_data.confidence * 100).toFixed(0)}%
                                </Badge>
                              </Flex>
                              
                              {attachment.processed_data.tags && attachment.processed_data.tags.length > 0 && (
                                <Flex wrap="wrap" gap={1} mt={1}>
                                  {attachment.processed_data.tags.map(tag => (
                                    <Tag key={tag} size="sm" colorScheme="blue">
                                      {tag}
                                    </Tag>
                                  ))}
                                </Flex>
                              )}
                              
                              {attachment.processed_data.entities && Object.keys(attachment.processed_data.entities).length > 0 && (
                                <Flex wrap="wrap" gap={1} mt={1}>
                                  {Object.keys(attachment.processed_data.entities).map(entity => (
                                    <Tag key={entity} size="sm" colorScheme="purple">
                                      {entity}
                                    </Tag>
                                  ))}
                                </Flex>
                              )}
                            </Box>
                          )}
                          
                          <Flex justifyContent="flex-end" mt={2}>
                            <Button 
                              size="sm" 
                              leftIcon={<ViewIcon />} 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAttachment(attachment);
                              }}
                            >
                              View Details
                            </Button>
                          </Flex>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </GridItem>
            </Grid>
            
            {/* Attachment Details Modal */}
            {selectedAttachment && (
              <Box 
                position="fixed" 
                top="0" 
                left="0" 
                right="0" 
                bottom="0" 
                bg="rgba(0,0,0,0.7)" 
                zIndex="1000"
                onClick={() => setSelectedAttachment(null)}
              >
                <Box 
                  maxW="800px" 
                  maxH="90vh" 
                  overflowY="auto" 
                  mx="auto" 
                  mt="5vh" 
                  bg="white" 
                  borderRadius="md"
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderAttachmentDetails()}
                </Box>
              </Box>
            )}
          </TabPanel>
          
          <TabPanel>
            {stats ? (
              <Box p={6} borderWidth={1} borderRadius="md" bg="white">
                <Heading size="md" mb={6}>Attachment Processing Statistics</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
                  <Stat>
                    <StatLabel>Total Attachments</StatLabel>
                    <StatNumber>{stats.total_attachments}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Processed</StatLabel>
                    <StatNumber>{stats.processed_attachments}</StatNumber>
                    <StatHelpText>
                      {((stats.processed_attachments / stats.total_attachments) * 100).toFixed(1)}% of total
                    </StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Success Rate</StatLabel>
                    <StatNumber>{(stats.processing_success_rate * 100).toFixed(1)}%</StatNumber>
                    <StatHelpText>
                      <StatArrow type={stats.processing_success_rate >= 0.8 ? 'increase' : 'decrease'} />
                      {stats.successful_processing} successful
                    </StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Avg. Confidence</StatLabel>
                    <StatNumber>{(stats.average_confidence * 100).toFixed(1)}%</StatNumber>
                  </Stat>
                </SimpleGrid>
                
                <Grid templateColumns="repeat(12, 1fr)" gap={6}>
                  <GridItem colSpan={{ base: 12, md: 4 }}>
                    <Heading size="sm" mb={3}>Content Types</Heading>
                    {Object.entries(stats.content_type_counts).map(([type, count]) => (
                      <Flex key={type} justifyContent="space-between" mb={2}>
                        <Text>{type}</Text>
                        <Badge>{count}</Badge>
                      </Flex>
                    ))}
                  </GridItem>
                  
                  <GridItem colSpan={{ base: 12, md: 4 }}>
                    <Heading size="sm" mb={3}>Tags</Heading>
                    {Object.entries(stats.tag_counts).map(([tag, count]) => (
                      <Flex key={tag} justifyContent="space-between" mb={2}>
                        <Text>{tag}</Text>
                        <Badge colorScheme="blue">{count}</Badge>
                      </Flex>
                    ))}
                  </GridItem>
                  
                  <GridItem colSpan={{ base: 12, md: 4 }}>
                    <Heading size="sm" mb={3}>Entity Types</Heading>
                    {Object.entries(stats.entity_type_counts).map(([type, count]) => (
                      <Flex key={type} justifyContent="space-between" mb={2}>
                        <Text>{type}</Text>
                        <Badge colorScheme="purple">{count}</Badge>
                      </Flex>
                    ))}
                  </GridItem>
                </Grid>
              </Box>
            ) : (
              <Flex justifyContent="center" alignItems="center" height="200px">
                <Spinner size="xl" />
              </Flex>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default AttachmentsPage;