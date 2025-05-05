import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import mailIngestApi, { ProcessedAttachment, Attachment } from '../../api/mail-ingest';

interface LeadCreatorProps {
  attachment: Attachment;
  onCreateLead?: (leadData: any) => void;
}

interface LeadData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  notes: string;
  status: string;
  [key: string]: any;
}

const LeadCreator: React.FC<LeadCreatorProps> = ({ attachment, onCreateLead }) => {
  const [leadData, setLeadData] = useState<LeadData>({
    source: 'email_attachment',
    notes: '',
    status: 'new',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (attachment && attachment.processed_data) {
      extractLeadData(attachment.processed_data);
    }
  }, [attachment]);

  // Extract lead data from processed attachment
  const extractLeadData = (processedData: ProcessedAttachment) => {
    const data: Partial<LeadData> = {
      source: 'email_attachment',
      notes: `Created from attachment: ${attachment.filename}`,
      status: 'new',
    };

    // Extract emails
    if (processedData.entities && processedData.entities.emails) {
      const emails = processedData.entities.emails;
      if (emails && emails.length > 0) {
        data.email = emails[0];
      }
    }

    // Extract phone numbers
    if (processedData.entities && processedData.entities.phones) {
      const phones = processedData.entities.phones;
      if (phones && phones.length > 0) {
        data.phone = phones[0];
      }
    }

    // Extract company name
    if (processedData.entities && processedData.entities.client_names) {
      const clientNames = processedData.entities.client_names;
      if (clientNames && clientNames.length > 0) {
        data.company = clientNames[0];
        data.name = clientNames[0]; // Use company name as lead name if no name is available
      }
    }

    // Extract contract data
    if (processedData.entities && processedData.entities.party1) {
      data.company = processedData.entities.party1;
      if (!data.name) data.name = processedData.entities.party1;
    }

    // Add extracted text as notes
    if (processedData.text_content) {
      const maxLength = 500;
      const truncatedText = processedData.text_content.length > maxLength
        ? processedData.text_content.substring(0, maxLength) + '...'
        : processedData.text_content;
      
      data.notes = `Created from attachment: ${attachment.filename}\n\nExtracted text:\n${truncatedText}`;
    }

    // Add tags as interests
    if (processedData.tags && processedData.tags.length > 0) {
      data.interests = processedData.tags.join(', ');
    }

    setLeadData(prevData => ({ ...prevData, ...data }));
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLeadData(prevData => ({ ...prevData, [name]: value }));
  };

  // Create lead
  const createLead = async () => {
    setLoading(true);
    try {
      // Call onCreateLead callback with lead data
      if (onCreateLead) {
        onCreateLead(leadData);
      }

      toast({
        title: 'Success',
        description: 'Lead created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lead',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if required fields are filled
  const isFormValid = !!leadData.name;

  return (
    <Box p={4} borderWidth={1} borderRadius="md" bg="white">
      <Heading size="md" mb={4}>Create Lead from Attachment</Heading>

      <Text mb={4}>
        The following lead information was extracted from the attachment.
        Review and edit the information before creating the lead.
      </Text>

      <Stack spacing={4} mb={6}>
        <FormControl isRequired>
          <FormLabel>Name / Company</FormLabel>
          <Input
            name="name"
            value={leadData.name || ''}
            onChange={handleInputChange}
            placeholder="Enter lead name or company"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input
            name="email"
            value={leadData.email || ''}
            onChange={handleInputChange}
            placeholder="Enter email address"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Phone</FormLabel>
          <Input
            name="phone"
            value={leadData.phone || ''}
            onChange={handleInputChange}
            placeholder="Enter phone number"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Company</FormLabel>
          <Input
            name="company"
            value={leadData.company || ''}
            onChange={handleInputChange}
            placeholder="Enter company name"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Interests</FormLabel>
          <Input
            name="interests"
            value={leadData.interests || ''}
            onChange={handleInputChange}
            placeholder="Enter interests"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Source</FormLabel>
          <Select
            name="source"
            value={leadData.source}
            onChange={handleInputChange}
          >
            <option value="email_attachment">Email Attachment</option>
            <option value="email">Email</option>
            <option value="website">Website</option>
            <option value="phone">Phone</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Status</FormLabel>
          <Select
            name="status"
            value={leadData.status}
            onChange={handleInputChange}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Textarea
            name="notes"
            value={leadData.notes}
            onChange={handleInputChange}
            placeholder="Enter notes"
            minHeight="150px"
          />
        </FormControl>
      </Stack>

      <Divider mb={4} />

      <Flex justifyContent="flex-end">
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          isLoading={loading}
          isDisabled={!isFormValid}
          onClick={createLead}
        >
          Create Lead
        </Button>
      </Flex>
    </Box>
  );
};

export default LeadCreator;