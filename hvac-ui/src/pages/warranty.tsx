import { useState, useEffect } from 'react';
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
  InputGroup,
  InputLeftElement,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FiPlus, FiDownload, FiEdit, FiEye, FiSearch, FiFilter, FiChevronDown } from 'react-icons/fi';
import Layout from '@/components/Layout';
import {
  Warranty,
  calculateWarrantyStatus,
  generateWarrantyId,
  filterWarrantiesByStatus,
  filterWarrantiesByClient,
  filterWarrantiesByEquipmentType,
  sortWarranties,
  calculateDaysRemaining,
  isExpiringSoon
} from '@/utils/warrantyUtils';

// Mock data for warranty cards
const mockWarranties: Warranty[] = [
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
  const [warranties, setWarranties] = useState<Warranty[]>(mockWarranties);
  const [currentWarranty, setCurrentWarranty] = useState<Warranty | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const toast = useToast();

  const handleAddNew = () => {
    setCurrentWarranty(null);
    setIsViewMode(false);
    onOpen();
  };

  const handleEdit = (warranty: Warranty) => {
    setCurrentWarranty(warranty);
    setIsViewMode(false);
    onOpen();
  };

  const handleView = (warranty: Warranty) => {
    setCurrentWarranty(warranty);
    setIsViewMode(true);
    onOpen();
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);

      // Helper function to ensure string values
      const getStringValue = (key: string): string => {
        const value = formData.get(key);
        return value ? value.toString() : '';
      };

      // Validate required fields
      const clientName = getStringValue('clientName');
      const equipmentType = getStringValue('equipmentType');
      const model = getStringValue('model');
      const serialNumber = getStringValue('serialNumber');
      const installationDate = getStringValue('installationDate');
      const expiryDate = getStringValue('expiryDate');

      if (!clientName || !equipmentType || !model || !serialNumber || !installationDate || !expiryDate) {
        throw new Error('Wszystkie wymagane pola muszą być wypełnione');
      }

      // Validate dates
      const installDate = new Date(installationDate);
      const expiryDateObj = new Date(expiryDate);

      if (isNaN(installDate.getTime())) {
        throw new Error('Data instalacji jest nieprawidłowa');
      }

      if (isNaN(expiryDateObj.getTime())) {
        throw new Error('Data wygaśnięcia gwarancji jest nieprawidłowa');
      }

      if (installDate > expiryDateObj) {
        throw new Error('Data wygaśnięcia gwarancji nie może być wcześniejsza niż data instalacji');
      }

      const status = calculateWarrantyStatus(expiryDate);

      const warrantyData: Warranty = {
        id: currentWarranty ? currentWarranty.id : generateWarrantyId(warranties),
        clientName: clientName,
        equipmentType: equipmentType,
        model: model,
        serialNumber: serialNumber,
        installationDate: installationDate,
        expiryDate: expiryDate,
        notes: getStringValue('notes'),
        status: status,
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
    } catch (err) {
      console.error('Error saving warranty:', err);
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd podczas zapisywania gwarancji';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (warranty: Warranty) => {
    toast({
      title: 'Warranty downloaded',
      description: `Warranty card for ${warranty.clientName} has been downloaded.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Warranty>('id');
  const [sortAscending, setSortAscending] = useState(true);
  const [filteredWarranties, setFilteredWarranties] = useState<Warranty[]>(warranties);

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update filtered warranties when filters or sort options change
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      let result = [...warranties];

      // Apply status filter
      if (statusFilter !== 'all') {
        result = filterWarrantiesByStatus(result, statusFilter);
      }

      // Apply equipment filter
      if (equipmentFilter !== 'all') {
        result = filterWarrantiesByEquipmentType(result, equipmentFilter);
      }

      // Apply search term
      if (searchTerm) {
        result = filterWarrantiesByClient(result, searchTerm);
      }

      // Apply sorting
      result = sortWarranties(result, sortField, sortAscending);

      setFilteredWarranties(result);
    } catch (err) {
      console.error('Error filtering warranties:', err);
      setError('Wystąpił błąd podczas filtrowania danych. Spróbuj ponownie.');
      // Fallback to unfiltered data
      setFilteredWarranties(warranties);
    } finally {
      setIsLoading(false);
    }
  }, [warranties, searchTerm, statusFilter, equipmentFilter, sortField, sortAscending]);

  // Handle sort change
  const handleSortChange = (field: keyof Warranty) => {
    if (field === sortField) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
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

        {/* Search and Filter Controls */}
        {/* Error display */}
        {error && (
          <Box mb={6} p={4} bg="red.50" borderRadius="md" borderLeft="4px" borderColor="red.500">
            <Text color="red.500" fontWeight="medium">{error}</Text>
          </Box>
        )}

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={6}>
          <InputGroup maxW={{ base: '100%', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search by client name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              isDisabled={isLoading}
            />
          </InputGroup>

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiFilter />}
              variant="outline"
              isDisabled={isLoading}
            >
              Status: {statusFilter === 'all' ? 'All' : statusFilter === 'active' ? 'Active' : 'Expired'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setStatusFilter('all')}>All</MenuItem>
              <MenuItem onClick={() => setStatusFilter('active')}>Active</MenuItem>
              <MenuItem onClick={() => setStatusFilter('expired')}>Expired</MenuItem>
            </MenuList>
          </Menu>

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              leftIcon={<FiFilter />}
              variant="outline"
              isDisabled={isLoading}
            >
              Equipment: {equipmentFilter === 'all' ? 'All' : equipmentFilter}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setEquipmentFilter('all')}>All</MenuItem>
              {equipmentTypes.map((type) => (
                <MenuItem key={type} onClick={() => setEquipmentFilter(type)}>{type}</MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Stack>

        {/* Loading indicator */}
        {isLoading && (
          <Box textAlign="center" py={4}>
            <Text>Ładowanie danych...</Text>
          </Box>
        )}

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th
                  cursor="pointer"
                  onClick={() => handleSortChange('id')}
                >
                  ID {sortField === 'id' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSortChange('clientName')}
                >
                  Client {sortField === 'clientName' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSortChange('equipmentType')}
                >
                  Equipment {sortField === 'equipmentType' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th>Model</Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSortChange('installationDate')}
                >
                  Installation Date {sortField === 'installationDate' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSortChange('expiryDate')}
                >
                  Expiry Date {sortField === 'expiryDate' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th
                  cursor="pointer"
                  onClick={() => handleSortChange('status')}
                >
                  Status {sortField === 'status' && (sortAscending ? '↑' : '↓')}
                </Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredWarranties.map((warranty) => (
                <Tr key={warranty.id}>
                  <Td>{warranty.id}</Td>
                  <Td>{warranty.clientName}</Td>
                  <Td>{warranty.equipmentType}</Td>
                  <Td>{warranty.model}</Td>
                  <Td>{warranty.installationDate}</Td>
                  <Td>{warranty.expiryDate}</Td>
                  <Td>
                    {isExpiringSoon(warranty.expiryDate, 30) && warranty.status === 'active' ? (
                      <Badge colorScheme="yellow">
                        Expiring Soon ({calculateDaysRemaining(warranty.expiryDate)} days)
                      </Badge>
                    ) : (
                      <Badge colorScheme={warranty.status === 'active' ? 'green' : 'red'}>
                        {warranty.status === 'active' ? 'Active' : 'Expired'}
                      </Badge>
                    )}
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
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isLoading}
                    loadingText={currentWarranty ? 'Updating...' : 'Creating...'}
                  >
                    {currentWarranty ? 'Update' : 'Create'} Warranty
                  </Button>
                )}
                {isViewMode && currentWarranty && (
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