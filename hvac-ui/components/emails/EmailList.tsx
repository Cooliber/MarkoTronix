import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Heading,
  Text,
  Flex,
  Spinner,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { getEmails, triggerEmailFetch, reprocessEmail } from '../../api/emails';
import { generateOffer } from '../../api/offers';

const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const data = await getEmails();
      setEmails(data);
    } catch (error) {
      toast({
        title: 'Error fetching emails',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await triggerEmailFetch();
      toast({
        title: 'Email fetch triggered',
        description: 'Checking for new emails...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Refetch emails after a short delay
      setTimeout(() => fetchEmails(), 5000);
    } catch (error) {
      toast({
        title: 'Error triggering email fetch',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReprocess = async (emailId) => {
    try {
      await reprocessEmail(emailId);
      toast({
        title: 'Email reprocessing triggered',
        description: 'The email will be reprocessed...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error reprocessing email',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGenerateOffer = async (emailId) => {
    try {
      const response = await generateOffer(emailId);
      toast({
        title: 'Offer generated',
        description: `Offer #${response.id} created successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error generating offer',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Emails</Heading>
        <Button
          colorScheme="blue"
          onClick={handleRefresh}
          isLoading={isRefreshing}
          loadingText="Checking..."
        >
          Check for New Emails
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      ) : emails.length === 0 ? (
        <Text>No emails found.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>From</Th>
                <Th>Subject</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {emails.map((email) => (
                <Tr key={email.id}>
                  <Td>{email.id}</Td>
                  <Td>{email.from_email}</Td>
                  <Td>{email.subject}</Td>
                  <Td>{new Date(email.received_date).toLocaleString()}</Td>
                  <Td>
                    <Badge
                      colorScheme={email.processed ? 'green' : 'yellow'}
                      borderRadius="full"
                      px={2}
                      py={1}
                    >
                      {email.processed ? 'Processed' : 'Pending'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      mr={2}
                      onClick={() => handleGenerateOffer(email.id)}
                    >
                      Generate Offer
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      onClick={() => handleReprocess(email.id)}
                    >
                      Reprocess
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default EmailList;