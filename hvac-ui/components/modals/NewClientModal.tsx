import { useState } from 'react';
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
  Textarea,
  VStack,
  useToast,
  Select,
  FormErrorMessage,
  Divider,
  Heading,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { api } from '../../api/axios';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClientFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  district: string;
  notes: string;
  source: string;
}

export default function NewClientModal({ isOpen, onClose }: NewClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>();

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    
    try {
      await api.post('/clients', data);
      
      toast({
        title: 'Client created',
        description: 'The client has been successfully created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating client:', error);
      
      toast({
        title: 'Error',
        description: 'There was an error creating the client',
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
          <ModalHeader>Add New Client</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Heading size="sm" alignSelf="flex-start">
                Personal Information
              </Heading>
              
              <FormControl isInvalid={!!errors.fullName} isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  {...register('fullName', {
                    required: 'Full name is required',
                  })}
                  placeholder="John Doe"
                />
                <FormErrorMessage>{errors.fullName?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  placeholder="john.doe@example.com"
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.phone} isRequired>
                <FormLabel>Phone</FormLabel>
                <Input
                  {...register('phone', {
                    required: 'Phone number is required',
                  })}
                  placeholder="+1 (555) 123-4567"
                />
                <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
              </FormControl>
              
              <Divider />
              
              <Heading size="sm" alignSelf="flex-start">
                Address
              </Heading>
              
              <FormControl isInvalid={!!errors.address} isRequired>
                <FormLabel>Street Address</FormLabel>
                <Input
                  {...register('address', {
                    required: 'Address is required',
                  })}
                  placeholder="123 Main St"
                />
                <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.city} isRequired>
                <FormLabel>City</FormLabel>
                <Input
                  {...register('city', {
                    required: 'City is required',
                  })}
                  placeholder="New York"
                />
                <FormErrorMessage>{errors.city?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.postalCode} isRequired>
                <FormLabel>Postal Code</FormLabel>
                <Input
                  {...register('postalCode', {
                    required: 'Postal code is required',
                  })}
                  placeholder="10001"
                />
                <FormErrorMessage>{errors.postalCode?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.district}>
                <FormLabel>District</FormLabel>
                <Input
                  {...register('district')}
                  placeholder="Manhattan"
                />
                <FormErrorMessage>{errors.district?.message}</FormErrorMessage>
              </FormControl>
              
              <Divider />
              
              <FormControl isInvalid={!!errors.source}>
                <FormLabel>Source</FormLabel>
                <Select
                  {...register('source')}
                  placeholder="How did they find us?"
                >
                  <option value="referral">Referral</option>
                  <option value="website">Website</option>
                  <option value="social_media">Social Media</option>
                  <option value="advertisement">Advertisement</option>
                  <option value="other">Other</option>
                </Select>
                <FormErrorMessage>{errors.source?.message}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.notes}>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  {...register('notes')}
                  placeholder="Additional information about the client"
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
              colorScheme="blue"
              type="submit"
              isLoading={isSubmitting}
            >
              Create Client
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}