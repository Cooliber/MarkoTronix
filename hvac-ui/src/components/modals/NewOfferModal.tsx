import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Select,
  Divider,
  Text,
  Textarea,
  Checkbox,
  HStack,
  Box,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { api } from '@/api/axios';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface NewOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewOfferModal({ isOpen, onClose }: NewOfferModalProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    validUntil: '',
    source: 'manual', // manual, transcription, form
    transcriptionId: '',
    includeInstallation: true,
    includeWarranty: true,
    notes: '',
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingTranscriptions, setIsLoadingTranscriptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchTranscriptions();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true);
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchTranscriptions = async () => {
    try {
      setIsLoadingTranscriptions(true);
      const response = await api.get('/transcriptions');
      setTranscriptions(response.data);
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
    } finally {
      setIsLoadingTranscriptions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      source: value,
      transcriptionId: value === 'transcription' ? prev.transcriptionId : '',
    }));
  };

  const generateVariants = async () => {
    try {
      setIsGeneratingVariants(true);
      // This would call the LLM API to generate offer variants
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulating API call
      
      toast({
        title: 'Variants Generated',
        description: 'AI has generated offer variants based on client needs',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating variants:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate offer variants',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/offers', formData);
      
      toast({
        title: 'Offer created',
        description: 'New offer has been successfully created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form and close modal
      setFormData({
        clientId: '',
        title: '',
        description: '',
        validUntil: '',
        source: 'manual',
        transcriptionId: '',
        includeInstallation: true,
        includeWarranty: true,
        notes: '',
      });
      onClose();
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create offer. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate default valid until date (30 days from now)
  const getDefaultValidUntil = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Offer</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs variant="enclosed">
            <TabList>
              <Tab>Basic Info</Tab>
              <Tab>Offer Details</Tab>
              <Tab>Preview</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Client</FormLabel>
                    {isLoadingClients ? (
                      <HStack>
                        <Spinner size="sm" />
                        <Text>Loading clients...</Text>
                      </HStack>
                    ) : (
                      <Select
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleChange}
                        placeholder="Select client"
                      >
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name} ({client.email})
                          </option>
                        ))}
                      </Select>
                    )}
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Offer Title</FormLabel>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Premium HVAC Installation Package"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the offer"
                      rows={3}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Valid Until</FormLabel>
                    <Input
                      name="validUntil"
                      type="date"
                      value={formData.validUntil || getDefaultValidUntil()}
                      onChange={handleChange}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Source</FormLabel>
                    <Select
                      name="source"
                      value={formData.source}
                      onChange={handleSourceChange}
                    >
                      <option value="manual">Manual Entry</option>
                      <option value="transcription">From Transcription</option>
                      <option value="form">From Client Form</option>
                    </Select>
                  </FormControl>
                  
                  {formData.source === 'transcription' && (
                    <FormControl>
                      <FormLabel>Select Transcription</FormLabel>
                      {isLoadingTranscriptions ? (
                        <HStack>
                          <Spinner size="sm" />
                          <Text>Loading transcriptions...</Text>
                        </HStack>
                      ) : (
                        <Select
                          name="transcriptionId"
                          value={formData.transcriptionId}
                          onChange={handleChange}
                          placeholder="Select transcription"
                        >
                          {transcriptions.map((transcription) => (
                            <option key={transcription.id} value={transcription.id}>
                              {transcription.title} ({new Date(transcription.createdAt).toLocaleDateString()})
                            </option>
                          ))}
                        </Select>
                      )}
                    </FormControl>
                  )}
                </VStack>
              </TabPanel>
              
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Button
                      colorScheme="teal"
                      onClick={generateVariants}
                      isLoading={isGeneratingVariants}
                      mb={4}
                    >
                      Generate Offer Variants with AI
                    </Button>
                    <Text fontSize="sm" color="gray.500">
                      This will use AI to generate 3-4 package options based on client needs
                    </Text>
                  </Box>
                  
                  <Divider />
                  
                  <FormControl>
                    <FormLabel>Options</FormLabel>
                    <VStack align="start">
                      <Checkbox
                        name="includeInstallation"
                        isChecked={formData.includeInstallation}
                        onChange={handleCheckboxChange}
                      >
                        Include Installation
                      </Checkbox>
                      <Checkbox
                        name="includeWarranty"
                        isChecked={formData.includeWarranty}
                        onChange={handleCheckboxChange}
                      >
                        Include Extended Warranty
                      </Checkbox>
                    </VStack>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Additional Notes</FormLabel>
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional information or special conditions"
                      rows={4}
                    />
                  </FormControl>
                </VStack>
              </TabPanel>
              
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Text>Preview of the offer will be shown here.</Text>
                  <Text fontSize="sm" color="gray.500">
                    This will display a preview of how the offer will look to the client.
                  </Text>
                  
                  <Box
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    bg="gray.50"
                    height="200px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.400">Offer Preview</Text>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Create Offer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}