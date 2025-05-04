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
  Link,
} from '@chakra-ui/react';
import { getOffers, getOfferPdfUrl, getOfferLink } from '../../api/offers';

const OfferList = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const data = await getOffers();
      setOffers(data);
    } catch (error) {
      toast({
        title: 'Error fetching offers',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLink = async (offerId: number) => {
    try {
      const response = await getOfferLink(offerId);

      // Copy link to clipboard
      navigator.clipboard.writeText(response.link);

      toast({
        title: 'Link copied to clipboard',
        description: 'The shareable link has been copied to your clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error getting offer link',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'sent':
        return 'blue';
      case 'viewed':
        return 'purple';
      case 'accepted':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>Offers</Heading>

      {isLoading ? (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      ) : offers.length === 0 ? (
        <Text>No offers found.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Price</Th>
                <Th>Valid Until</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {offers.map((offer) => (
                <Tr key={offer.id}>
                  <Td>{offer.id}</Td>
                  <Td>{offer.client_name}</Td>
                  <Td>{offer.service_type}</Td>
                  <Td>{offer.price} {offer.currency}</Td>
                  <Td>{new Date(offer.valid_until).toLocaleDateString()}</Td>
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(offer.status)}
                      borderRadius="full"
                      px={2}
                      py={1}
                    >
                      {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      mr={2}
                      as="a"
                      href={getOfferPdfUrl(offer.id)}
                      target="_blank"
                    >
                      View PDF
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => handleGetLink(offer.id)}
                    >
                      Get Link
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

export default OfferList;