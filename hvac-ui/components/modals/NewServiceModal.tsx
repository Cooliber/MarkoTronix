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
  FormErrorMessage,
  Divider,
  Heading,
  Textarea,
  Radio,
  RadioGroup,
  Stack,
  Flex,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { api } from '../../api/axios';

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Client {
  id: string;
  fullName: string;
}

interface Installation {
  id: string;
  address: string;
  equipmentType: string;
}

interface ServiceFormData {
  clientId: string;
  installationId: string;
  serviceType: 'inspection' | 'installation' | 'maintenance' | 'repair';
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  technicians: string[];
  notes: string;
}

export default function NewServiceModal({ isOpen, onClose }: NewServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingInstallations, setIsLoadingInstallations] = useState(false);
  const toast = useToast();
  
  const {
    handleSubmit,
    register,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    defaultValues: {
      serviceType: 'maintenance',
      priority: 'medium',
      estimatedDuration: 2,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      technicians: [],
    },
  });

  const clientId = watch('clientId');

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const response = await api.get('/clients');
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clients',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingClients(false);
      }
    };

    const fetchTechnicians = async () => {
      try {
        const response = await api.get('/users?role=technician');
        setTechnicians(response.data);
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };

    if (isOpen) {
      fetchClients();
      fetchTechnicians();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    const fetchInstallations = async () => {
      if (!clientId) return;
      
      setIsLoadingInstallations(true);
      try {
        const response = await api.get(`/installations?clientId=${clientId}`);
        setInstallations(response.data);
        
        // Reset installation selection when client changes
        setValue('installationId', '');
      } catch (error) {
        console.error('Error fetching installations:', error);
      } finally {
        setIsLoadingInstallations(false);
      }
    };

    if (clientId) {
      fetchInstallations();
    }
  }, [clientId, setValue]);

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    
    try {
      await api.post('/services', data);
      
      toast({
        title: 'Service scheduled',
        description: 'The service has been successfully scheduled',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error scheduling service:', error);
      
      toast({
        title: 'Error',
        description: 'There was an error scheduling the service',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Schedule Service</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Heading size="sm" alignSelf="flex-start">
                Client & Equipment
              </Heading>
              
              <FormControl isInvalid={!!errors.clientId} isRequired>
                <FormLabel>Client</FormLabel>
                {isLoadingClients ? (
                  <Flex justify="center" py={2}>
                    <Spinner size="sm" />
                  </Flex>
                ) : (
                  <Select
                    {...register('clientId', {
                      required: 'Client is required',
                    })}
                    placeholder="Select client"
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.fullName}
                      </option>
                    ))}
                  </Select>
                )}
                <FormErrorMessage>{errors.clientId?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.installationId} isRequired>
                <FormLabel>Installation</FormLabel>
                {isLoadingInstallations ? (
                  <Flex justify="center" py={2}>
                    <Spinner size="sm" />
                  </Flex>
                ) : installations.length > 0 ? (
                  <Select
                    {...register('installationId', {
                      required: 'Installation is required',
                    })}
                    placeholder="Select installation"
                    isDisabled={!clientId}
                  >
                    {installations.map((installation) => (
                      <option key={installation.id} value={installation.id}>
                        {installation.address} - {installation.equipmentType}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Text color="gray.500">
                    {clientId
                      ? 'No installations found for this client'
                      : 'Select a client first'}
                  </Text>
                )}
                <FormErrorMessage>{errors.installationId?.message}</FormErrorMessage>
              </FormControl>
              
              <Divider />
              
              <Heading size="sm" alignSelf="flex-start">
                Service Details
              </Heading>
              
              <FormControl isInvalid={!!errors.serviceType} isRequired>
                <FormLabel>Service Type</FormLabel>
                <Controller
                  name="serviceType"
                  control={control}
                  rules={{ required: 'Service type is required' }}
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      <Stack direction="row" spacing={4}>
                        <Radio value="inspection">Inspection</Radio>
                        <Radio value="installation">Installation</Radio>
                        <Radio value="maintenance">Maintenance</Radio>
                        <Radio value="repair">Repair</Radio>
                      </Stack>
                    </RadioGroup>
                  )}
                />
                <FormErrorMessage>{errors.serviceType?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.priority} isRequired>
                <FormLabel>Priority</FormLabel>
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: 'Priority is required' }}
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      <Stack direction="row" spacing={4}>
                        <Radio value="low">Low</Radio>
                        <Radio value="medium">Medium</Radio>
                        <Radio value="high">High</Radio>
                        <Radio value="urgent">Urgent</Radio>
                      </Stack>
                    </RadioGroup>
                  )}
                />
                <FormErrorMessage>{errors.priority?.message}</FormErrorMessage>
              </FormControl>
              
              <Divider />
              
              <Heading size="sm" alignSelf="flex-start">
                Schedule
              </Heading>
              
              <FormControl isInvalid={!!errors.scheduledDate} isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  {...register('scheduledDate', {
                    required: 'Date is required',
                  })}
                  type="date"
                />
                <FormErrorMessage>{errors.scheduledDate?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.scheduledTime} isRequired>
                <FormLabel>Time</FormLabel>
                <Input
                  {...register('scheduledTime', {
                    required: 'Time is required',
                  })}
                  type="time"
                />
                <FormErrorMessage>{errors.scheduledTime?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.estimatedDuration} isRequired>
                <FormLabel>Estimated Duration (hours)</FormLabel>
                <Input
                  {...register('estimatedDuration', {
                    required: 'Duration is required',
                    valueAsNumber: true,
                    min: {
                      value: 0.5,
                      message: 'Duration must be at least 0.5 hours',
                    },
                  })}
                  type="number"
                  step="0.5"
                  min="0.5"
                />
                <FormErrorMessage>{errors.estimatedDuration?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.technicians}>
                <FormLabel>Assign Technicians</FormLabel>
                <Select
                  {...register('technicians')}
                  placeholder="Select technicians"
                  multiple
                >
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.technicians?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.notes}>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  {...register('notes')}
                  placeholder="Additional notes for the service"
                  rows={3}
                />
                <FormErrorMessage>{errors.notes?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              type="submit"
              isLoading={isSubmitting}
            >
              Schedule Service
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}