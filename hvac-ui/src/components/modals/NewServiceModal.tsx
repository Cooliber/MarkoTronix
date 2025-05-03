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
  HStack,
  Spinner,
  Text,
  Textarea,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';
import { api } from '@/api/axios';

interface Client {
  id: string;
  name: string;
  address: string;
}

interface Technician {
  id: string;
  name: string;
}

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewServiceModal({ isOpen, onClose }: NewServiceModalProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    technicianId: '',
    serviceType: 'inspection', // inspection, installation, maintenance
    scheduledDate: '',
    scheduledTimeSlot: 'morning', // morning, afternoon, evening
    estimatedDuration: 60, // in minutes
    notes: '',
    priority: 'normal', // low, normal, high
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchTechnicians();
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

  const fetchTechnicians = async () => {
    try {
      setIsLoadingTechnicians(true);
      const response = await api.get('/technicians');
      setTechnicians(response.data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      toast({
        title: 'Error',
        description: 'Failed to load technicians',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingTechnicians(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/services', formData);
      
      toast({
        title: 'Service scheduled',
        description: 'New service appointment has been scheduled',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form and close modal
      setFormData({
        clientId: '',
        technicianId: '',
        serviceType: 'inspection',
        scheduledDate: '',
        scheduledTimeSlot: 'morning',
        estimatedDuration: 60,
        notes: '',
        priority: 'normal',
      });
      onClose();
    } catch (error) {
      console.error('Error scheduling service:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule service. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get tomorrow's date as default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Schedule Service</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
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
                      {client.name} - {client.address}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Service Type</FormLabel>
              <Select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
              >
                <option value="inspection">Inspection</option>
                <option value="installation">Installation</option>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="emergency">Emergency Service</option>
              </Select>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Scheduled Date</FormLabel>
              <Input
                name="scheduledDate"
                type="date"
                value={formData.scheduledDate || getTomorrowDate()}
                onChange={handleChange}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Time Slot</FormLabel>
              <RadioGroup 
                value={formData.scheduledTimeSlot} 
                onChange={(value) => handleRadioChange('scheduledTimeSlot', value)}
              >
                <Stack direction="row">
                  <Radio value="morning">Morning (8-12)</Radio>
                  <Radio value="afternoon">Afternoon (12-4)</Radio>
                  <Radio value="evening">Evening (4-8)</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Estimated Duration (minutes)</FormLabel>
              <Select
                name="estimatedDuration"
                value={formData.estimatedDuration.toString()}
                onChange={handleChange}
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Technician</FormLabel>
              {isLoadingTechnicians ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text>Loading technicians...</Text>
                </HStack>
              ) : (
                <Select
                  name="technicianId"
                  value={formData.technicianId}
                  onChange={handleChange}
                  placeholder="Auto-assign technician"
                >
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </Select>
              )}
              <Text fontSize="sm" color="gray.500" mt={1}>
                Leave empty for automatic assignment based on location and availability
              </Text>
            </FormControl>
            
            <FormControl>
              <FormLabel>Priority</FormLabel>
              <RadioGroup 
                value={formData.priority} 
                onChange={(value) => handleRadioChange('priority', value)}
              >
                <Stack direction="row">
                  <Radio value="low">Low</Radio>
                  <Radio value="normal">Normal</Radio>
                  <Radio value="high">High</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional information about the service"
                rows={3}
              />
            </FormControl>
          </VStack>
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
            Schedule Service
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}