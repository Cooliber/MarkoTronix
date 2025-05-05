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
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import mailIngestApi, { ProcessedAttachment, Attachment } from '../../api/mail-ingest';

interface InvoiceCreatorProps {
  attachment: Attachment;
  onCreateInvoice?: (invoiceData: any) => void;
}

interface InvoiceData {
  invoiceNumber?: string;
  clientName?: string;
  clientEmail?: string;
  amount?: number;
  date?: string;
  dueDate?: string;
  status: string;
  notes?: string;
  [key: string]: any;
}

const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({ attachment, onCreateInvoice }) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (attachment && attachment.processed_data) {
      extractInvoiceData(attachment.processed_data);
    }
  }, [attachment]);

  // Extract invoice data from processed attachment
  const extractInvoiceData = (processedData: ProcessedAttachment) => {
    const data: Partial<InvoiceData> = {
      status: 'draft',
      notes: `Created from attachment: ${attachment.filename}`,
    };

    // Extract invoice number
    if (processedData.entities && processedData.entities.invoice_number) {
      data.invoiceNumber = processedData.entities.invoice_number;
    }

    // Extract amount
    if (processedData.entities && processedData.entities.amount) {
      const amountStr = processedData.entities.amount;
      try {
        // Convert string to number, handling different formats
        const cleanAmount = amountStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        data.amount = parseFloat(cleanAmount);
      } catch (error) {
        console.error('Error parsing amount:', error);
      }
    }

    // Extract date
    if (processedData.entities && processedData.entities.date) {
      data.date = processedData.entities.date;
      
      // Calculate due date (30 days after invoice date)
      try {
        const invoiceDate = new Date(data.date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);
        data.dueDate = dueDate.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error calculating due date:', error);
      }
    }

    // Extract client information
    if (processedData.entities && processedData.entities.client_names) {
      const clientNames = processedData.entities.client_names;
      if (clientNames && clientNames.length > 0) {
        data.clientName = clientNames[0];
      }
    }

    if (processedData.entities && processedData.entities.emails) {
      const emails = processedData.entities.emails;
      if (emails && emails.length > 0) {
        data.clientEmail = emails[0];
      }
    }

    setInvoiceData(prevData => ({ ...prevData, ...data }));
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceData(prevData => ({ ...prevData, [name]: value }));
  };

  // Handle number input changes
  const handleNumberChange = (name: string, value: string) => {
    setInvoiceData(prevData => ({ ...prevData, [name]: parseFloat(value) }));
  };

  // Create invoice
  const createInvoice = async () => {
    setLoading(true);
    try {
      // Call onCreateInvoice callback with invoice data
      if (onCreateInvoice) {
        onCreateInvoice(invoiceData);
      }

      toast({
        title: 'Success',
        description: 'Invoice created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if required fields are filled
  const isFormValid = !!invoiceData.clientName && !!invoiceData.amount;

  // Check if the attachment is likely an invoice
  const isInvoice = attachment.processed_data?.tags?.includes('invoice') || false;

  return (
    <Box p={4} borderWidth={1} borderRadius="md" bg="white">
      <Heading size="md" mb={4}>Create Invoice from Attachment</Heading>

      {!isInvoice ? (
        <Alert status="warning" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertTitle>Not an Invoice</AlertTitle>
          <AlertDescription>
            This attachment was not identified as an invoice. The extracted data may not be accurate.
          </AlertDescription>
        </Alert>
      ) : null}

      <Text mb={4}>
        The following invoice information was extracted from the attachment.
        Review and edit the information before creating the invoice.
      </Text>

      <Stack spacing={4} mb={6}>
        <FormControl>
          <FormLabel>Invoice Number</FormLabel>
          <Input
            name="invoiceNumber"
            value={invoiceData.invoiceNumber || ''}
            onChange={handleInputChange}
            placeholder="Enter invoice number"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Client Name</FormLabel>
          <Input
            name="clientName"
            value={invoiceData.clientName || ''}
            onChange={handleInputChange}
            placeholder="Enter client name"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Client Email</FormLabel>
          <Input
            name="clientEmail"
            value={invoiceData.clientEmail || ''}
            onChange={handleInputChange}
            placeholder="Enter client email"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Amount</FormLabel>
          <NumberInput
            value={invoiceData.amount || ''}
            onChange={(value) => handleNumberChange('amount', value)}
            min={0}
            precision={2}
          >
            <NumberInputField placeholder="Enter amount" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>Invoice Date</FormLabel>
          <Input
            name="date"
            type="date"
            value={invoiceData.date || ''}
            onChange={handleInputChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Due Date</FormLabel>
          <Input
            name="dueDate"
            type="date"
            value={invoiceData.dueDate || ''}
            onChange={handleInputChange}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Status</FormLabel>
          <Select
            name="status"
            value={invoiceData.status}
            onChange={handleInputChange}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Input
            name="notes"
            value={invoiceData.notes || ''}
            onChange={handleInputChange}
            placeholder="Enter notes"
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
          onClick={createInvoice}
        >
          Create Invoice
        </Button>
      </Flex>
    </Box>
  );
};

export default InvoiceCreator;