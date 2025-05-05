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
  Checkbox,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import mailIngestApi, { ProcessedAttachment, Attachment } from '../../api/mail-ingest';

interface ClientProfileUpdaterProps {
  attachment: Attachment;
  onUpdate?: (clientData: any) => void;
}

interface ExtractedClientData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  taxId?: string;
  [key: string]: any;
}

const ClientProfileUpdater: React.FC<ClientProfileUpdaterProps> = ({ attachment, onUpdate }) => {
  const [extractedData, setExtractedData] = useState<ExtractedClientData>({});
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (attachment && attachment.processed_data) {
      extractClientData(attachment.processed_data);
    }
  }, [attachment]);

  // Extract client data from processed attachment
  const extractClientData = (processedData: ProcessedAttachment) => {
    const data: ExtractedClientData = {};

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
      }
    }

    // Extract invoice data
    if (processedData.entities && processedData.entities.invoice_number) {
      data.invoiceNumber = processedData.entities.invoice_number;
    }

    if (processedData.entities && processedData.entities.amount) {
      data.amount = processedData.entities.amount;
    }

    if (processedData.entities && processedData.entities.date) {
      data.date = processedData.entities.date;
    }

    // Extract contract data
    if (processedData.entities && processedData.entities.contract_number) {
      data.contractNumber = processedData.entities.contract_number;
    }

    if (processedData.entities && processedData.entities.party1) {
      data.party1 = processedData.entities.party1;
      if (!data.company) data.company = processedData.entities.party1;
    }

    if (processedData.entities && processedData.entities.party2) {
      data.party2 = processedData.entities.party2;
    }

    // Set extracted data and select all fields by default
    setExtractedData(data);
    setSelectedFields(Object.keys(data));
  };

  // Toggle field selection
  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  // Update client profile with selected fields
  const updateClientProfile = async () => {
    setLoading(true);
    try {
      // Create client data object with only selected fields
      const clientData: ExtractedClientData = {};
      selectedFields.forEach(field => {
        clientData[field] = extractedData[field];
      });

      // Call onUpdate callback with client data
      if (onUpdate) {
        onUpdate(clientData);
      }

      toast({
        title: 'Success',
        description: 'Client profile updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating client profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if any data was extracted
  const hasExtractedData = Object.keys(extractedData).length > 0;

  return (
    <Box p={4} borderWidth={1} borderRadius="md" bg="white">
      <Heading size="md" mb={4}>Update Client Profile</Heading>

      {!hasExtractedData ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertTitle>No client data found</AlertTitle>
          <AlertDescription>
            No client data could be extracted from this attachment.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Text mb={4}>
            The following client information was extracted from the attachment.
            Select the fields you want to update in the client profile.
          </Text>

          <Stack spacing={4} mb={6}>
            {Object.entries(extractedData).map(([field, value]) => (
              <Flex key={field} alignItems="center">
                <Checkbox
                  isChecked={selectedFields.includes(field)}
                  onChange={() => toggleField(field)}
                  mr={4}
                />
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0} minWidth="120px" fontWeight="bold">
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </FormLabel>
                  <Input value={value} isReadOnly />
                </FormControl>
              </Flex>
            ))}
          </Stack>

          <Divider mb={4} />

          <Flex justifyContent="space-between">
            <Button
              leftIcon={<CloseIcon />}
              variant="outline"
              onClick={() => setSelectedFields([])}
            >
              Clear Selection
            </Button>
            <Button
              leftIcon={<CheckIcon />}
              colorScheme="blue"
              isLoading={loading}
              isDisabled={selectedFields.length === 0}
              onClick={updateClientProfile}
            >
              Update Client Profile
            </Button>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default ClientProfileUpdater;