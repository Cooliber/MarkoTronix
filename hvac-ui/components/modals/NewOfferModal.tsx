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
  Checkbox,
  HStack,
  Text,
  Box,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { api } from '../../api/axios';

interface NewOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Client {
  id: string;
  fullName: string;
  email: string;
}

interface OfferFormData {
  clientId: string;
  title: string;
  description: string;
  sourceType: 'transcription' | 'form' | 'manual';
  sourceId?: string;
  generateVariants: boolean;
  validUntil: string;
  notes: string;
}

export default function NewOfferModal({ isOpen, onClose }: NewOfferModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingTranscriptions, setIsLoadingTranscriptions] = useState(false);
  const toast = useToast();
  
  const {
    handleSubmit,
    register,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<OfferFormData>({
    defaultValues: {
      sourceType: 'manual',
      generateVariants: true,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    },
  });

  const sourceType = watch('sourceType');
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

    if (isOpen) {
      fetchClients();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    const fetchTranscriptions = async () => {
      if (!clientId) return;
      
      setIsLoadingTranscriptions(true);
      try {
        const response = await api.get(`/transcriptions?clientId=${clientId}`);
        setTranscriptions(response.data);
      } catch (error) {
        console.error('Error fetching transcriptions:', error);
      } finally {
        setIsLoadingTranscriptions(false);
      }
    };

    if (sourceType === 'transcription' && clientId) {
      fetchTranscriptions();
    }
  }, [sourceType, clientId]);

  const onSubmit = async (data: OfferFormData) => {
    setIsSubmitting(true);
    
    try {
      await api.post('/offers', data);
      
      toast({
        title: 'Offer created',
        description: 'The offer has been successfully created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating offer:', error);
      
      toast({
        title: 'Error',
        description: 'There was an error creating the offer',
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
          <ModalHeader>Create New Offer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Heading size="sm" alignSelf="flex-start">
                Client Information
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
              
              <Divider />
              
              <Heading size="sm" alignSelf="flex-start">
                Offer Details
              </Heading>
              
              <FormControl isInvalid={!!errors.title} isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  {...register('title', {
                    required: 'Title is required',
                  })}
                  placeholder="HVAC Installation Proposal"
                />
                <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.description} isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  {...register('description', {
                    required: 'Description is required',
                  })}
                  placeholder="Brief description of the offer"
                  rows={3}
                />
                <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.sourceType} isRequired>
                <FormLabel>Source Type</FormLabel>
                <Select
                  {...register('sourceType', {
                    required: 'Source type is required',
                  })}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="transcription">From Transcription</option>
                  <option value="form">From Client Form</option>
                </Select>
                <FormErrorMessage>{errors.sourceType?.message}</FormErrorMessage>
              </FormControl>
              
              {sourceType === 'transcription' && (
                <FormControl isInvalid={!!errors.sourceId}>
                  <FormLabel>Select Transcription</FormLabel>
                  {isLoadingTranscriptions ? (
                    <Flex justify="center" py={2}>
                      <Spinner size="sm" />
                    </Flex>
                  ) : transcriptions.length > 0 ? (
                    <Select
                      {...register('sourceId')}
                      placeholder="Select transcription"
                    >
                      {transcriptions.map((transcription) => (
                        <option key={transcription.id} value={transcription.id}>
                          {new Date(transcription.createdAt).toLocaleDateString()} - {transcription.title || 'Untitled'}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Text color="gray.500">No transcriptions available for this client</Text>
                  )}
                </FormControl>
              )}
              
              <FormControl isInvalid={!!errors.validUntil} isRequired>
                <FormLabel>Valid Until</FormLabel>
                <Input
                  {...register('validUntil', {
                    required: 'Expiration date is required',
                  })}
                  type="date"
                />
                <FormErrorMessage>{errors.validUntil?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl>
                <Controller
                  name="generateVariants"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      isChecked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    >
                      Generate AI variants (3-4 packages)
                    </Checkbox>
                  )}
                />
              </FormControl>
              
              <FormControl isInvalid={!!errors.notes}>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  {...register('notes')}
                  placeholder="Additional notes for the offer"
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
              colorScheme="green"
              type="submit"
              isLoading={isSubmitting}
            >
              Create Offer
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}