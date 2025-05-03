import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  useToast,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { FiPlus, FiDownload, FiEdit, FiEye } from 'react-icons/fi';
import Layout from '@/components/Layout';

// Mock data for warranty cards
const mockWarranties = [
  {
    id: 'W001',
    clientName: 'Jan Kowalski',
    equipmentType: 'Split AC Unit',
    model: 'CoolBreeze X5',
    serialNumber: 'CB-X5-12345',
    installationDate: '2024-04-15',
    expiryDate: '2026-04-15',
    status: 'active',
  },
  {
    id: 'W002',
    clientName: 'Anna Nowak',
    equipmentType: 'Heat Pump',
    model: 'EcoHeat Pro',
    serialNumber: 'EH-P-67890',
    installationDate: '2024-03-10',
    expiryDate: '2029-03-10',
    status: 'active',
  },
  {
    id: 'W003',
    clientName: 'Piotr Wiśniewski',
    equipmentType: 'Central AC',
    model: 'AirMaster 3000',
    serialNumber: 'AM-3K-54321',
    installationDate: '2023-08-22',
    expiryDate: '2025-08-22',
    status: 'active',
  },
];

// Mock data for clients
const mockClients = [
  { id: 'C001', name: 'Jan Kowalski' },
  { id: 'C002', name: 'Anna Nowak' },
  { id: 'C003', name: 'Piotr Wiśniewski' },
  { id: 'C004', name: 'Magdalena Dąbrowska' },
];

// Mock data for equipment types
const equipmentTypes = [
  'Split AC Unit',
  'Heat Pump',
  'Central AC',
  'Ductless Mini-Split',
  'Furnace',
  'Air Handler',
  'Thermostat',
];

export default function WarrantyPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [warranties, setWarranties] = useState(mockWarranties);
  const [currentWarranty, setCurrentWarranty] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const toast = useToast();

  const handleAddNew = () => {
    setCurrentWarranty(null);
    setIsViewMode(false);
    onOpen();
  };

  const handleEdit = (warranty) => {
    setCurrentWarranty(warranty);
    setIsViewMode(false);
    onOpen();
  };

  const handleView = (warranty) => {
    setCurrentWarranty(warranty);
    setIsViewMode(true);
    onOpen();
  };

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const warrantyData = {
      id: currentWarranty ? currentWarranty.id : `W${(warranties.length + 1).toString().padStart(3, '0')}`,
      clientName: formData.get('clientName'),
      equipmentType: formData.get('equipmentType'),
      model: formData.get('model'),
      serialNumber: formData.get('serialNumber'),
      installationDate: formData.get('installationDate'),
      expiryDate: formData.get('expiryDate'),
      notes: formData.get('notes'),
      status: 'active',
    };

    if (currentWarranty) {
      // Update existing warranty
      setWarranties(warranties.map(w => w.id === currentWarranty.id ? warrantyData : w));
      toast({
        title: 'Warranty updated',
        description: 'The warranty card has been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Add new warranty
      setWarranties([...warranties, warrantyData]);
      toast({
        title: 'Warranty created',
        description: 'The warranty card has been successfully created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    onClose();
  };

  const handleDownload = (warranty) => {
    toast({
      title: 'Warranty downloaded',
      description: `Warranty card for ${warranty.clientName} has been downloaded.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={5}>
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">Warranty Cards</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddNew}>
            Issue New Warranty
          </Button>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Client</Th>
                <Th>Equipment</Th>
                <Th>Model</Th>
                <Th>Installation Date</Th>
                <Th>Expiry Date</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {warranties.map((warranty) => (
                <Tr key={warranty.id}>
                  <Td>{warranty.id}</Td>
                  <Td>{warranty.clientName}</Td>
                  <Td>{warranty.equipmentType}</Td>
                  <Td>{warranty.model}</Td>
                  <Td>{warranty.installationDate}</Td>
                  <Td>{warranty.expiryDate}</Td>
                  <Td>
                    <Badge colorScheme={warranty.status === 'active' ? 'green' : 'red'}>
                      {warranty.status === 'active' ? 'Active' : 'Expired'}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="View warranty"
                        icon={<FiEye />}
                        size="sm"
                        onClick={() => handleView(warranty)}
                      />
                      <IconButton
                        aria-label="Edit warranty"
                        icon={<FiEdit />}
                        size="sm"
                        onClick={() => handleEdit(warranty)}
                      />
                      <IconButton
                        aria-label="Download warranty"
                        icon={<FiDownload />}
                        size="sm"
                        onClick={() => handleDownload(warranty)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isViewMode
                ? 'Warranty Details'
                : currentWarranty
                ? 'Edit Warranty Card'
                : 'Issue New Warranty Card'}
            </ModalHeader>
            <ModalCloseButton />
            <form onSubmit={handleSave}>
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired isReadOnly={isViewMode}>
                    <FormLabel>Client</FormLabel>
                    <Select
                      name="clientName"
                      defaultValue={currentWarranty?.clientName || ''}
                      placeholder="Select client"
                    >
                      {mockClients.map((client) => (
                        <option key={client.id} value={client.name}>
                          {client.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired isReadOnly={isViewMode}>
                    <FormLabel>Equipment Type</FormLabel>
                    <Select
                      name="equipmentType"
                      defaultValue={currentWarranty?.equipmentType || ''}
                      placeholder="Select equipment type"
                    >
                      {equipmentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired isReadOnly={isViewMode}>
                    <FormLabel>Model</FormLabel>
                    <Input
                      name="model"
                      defaultValue={currentWarranty?.model || ''}
                      placeholder="Enter model number"
                    />
                  </FormControl>

                  <FormControl isRequired isReadOnly={isViewMode}>
                    <FormLabel>Serial Number</FormLabel>
                    <Input
                      name="serialNumber"
                      defaultValue={currentWarranty?.serialNumber || ''}
                      placeholder="Enter serial number"
                    />
                  </FormControl>

                  <Flex gap={4}>
                    <FormControl isRequired isReadOnly={isViewMode}>
                      <FormLabel>Installation Date</FormLabel>
                      <Input
                        name="installationDate"
                        type="date"
                        defaultValue={currentWarranty?.installationDate || ''}
                      />
                    </FormControl>

                    <FormControl isRequired isReadOnly={isViewMode}>
                      <FormLabel>Warranty Expiry Date</FormLabel>
                      <Input
                        name="expiryDate"
                        type="date"
                        defaultValue={currentWarranty?.expiryDate || ''}
                      />
                    </FormControl>
                  </Flex>

                  <FormControl isReadOnly={isViewMode}>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      name="notes"
                      defaultValue={currentWarranty?.notes || ''}
                      placeholder="Enter any additional notes"
                      rows={3}
                    />
                  </FormControl>

                  {isViewMode && currentWarranty && (
                    <Box
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                      borderStyle="dashed"
                      borderColor="gray.300"
                      bg="gray.50"
                    >
                      <Text fontWeight="bold" mb={2}>
                        Warranty Terms & Conditions
                      </Text>
                      <Text fontSize="sm">
                        This warranty covers defects in materials and workmanship for the specified period from the date
                        of installation. The warranty does not cover damage resulting from improper installation,
                        maintenance, or operation. Regular maintenance must be performed as specified in the owner's
                        manual to maintain warranty coverage. For service under this warranty, contact our service
                        department.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  {isViewMode ? 'Close' : 'Cancel'}
                </Button>
                {!isViewMode && (
                  <Button type="submit" colorScheme="blue">
                    {currentWarranty ? 'Update' : 'Create'} Warranty
                  </Button>
                )}
                {isViewMode && (
                  <Button
                    leftIcon={<FiDownload />}
                    colorScheme="blue"
                    onClick={() => {
                      handleDownload(currentWarranty);
                      onClose();
                    }}
                  >
                    Download Warranty
                  </Button>
                )}
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
}