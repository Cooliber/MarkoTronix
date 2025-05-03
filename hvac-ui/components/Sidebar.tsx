import { ReactNode } from 'react';
import {
  Box,
  Flex,
  Icon,
  Text,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useColorModeValue,
  VStack,
  Image,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {
  FiHome,
  FiUsers,
  FiMail,
  FiFileText,
  FiCalendar,
  FiMap,
  FiPackage,
  FiClipboard,
  FiBarChart2,
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  icon: ReactNode;
  children: ReactNode;
  path: string;
  isActive?: boolean;
}

const NavItem = ({ icon, children, path, isActive }: NavItemProps) => {
  const router = useRouter();
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');

  const handleClick = () => {
    router.push(path);
  };

  return (
    <Flex
      align="center"
      px="4"
      py="3"
      cursor="pointer"
      role="group"
      fontWeight={isActive ? 'semibold' : 'normal'}
      color={isActive ? activeColor : inactiveColor}
      bg={isActive ? activeBg : 'transparent'}
      borderRadius="md"
      _hover={{
        bg: activeBg,
        color: activeColor,
      }}
      onClick={handleClick}
    >
      {icon && (
        <Icon
          mr="4"
          fontSize="16"
          as={icon}
          _groupHover={{
            color: activeColor,
          }}
        />
      )}
      {children}
    </Flex>
  );
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const currentPath = router.pathname;

  const SidebarContent = () => (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Image src="/logo.png" alt="HVAC CRM Logo" boxSize="40px" />
        <Text fontSize="2xl" fontWeight="bold">
          HVAC CRM
        </Text>
      </Flex>
      <VStack spacing={1} align="stretch" px={2}>
        <NavItem icon={FiHome} path="/dashboard" isActive={currentPath === '/dashboard'}>
          Dashboard
        </NavItem>
        <NavItem icon={FiUsers} path="/clients" isActive={currentPath.startsWith('/clients')}>
          Clients
        </NavItem>
        <NavItem icon={FiMail} path="/emails" isActive={currentPath.startsWith('/emails')}>
          Emails
        </NavItem>
        <NavItem
          icon={FiFileText}
          path="/transcriptions"
          isActive={currentPath.startsWith('/transcriptions')}
        >
          Transcriptions
        </NavItem>
        <NavItem icon={FiFileText} path="/offers" isActive={currentPath.startsWith('/offers')}>
          Offers
        </NavItem>
        <NavItem icon={FiCalendar} path="/calendar" isActive={currentPath.startsWith('/calendar')}>
          Calendar
        </NavItem>
        <NavItem icon={FiMap} path="/map" isActive={currentPath.startsWith('/map')}>
          Map
        </NavItem>
        <NavItem icon={FiPackage} path="/inventory" isActive={currentPath.startsWith('/inventory')}>
          Inventory
        </NavItem>
        <NavItem
          icon={FiClipboard}
          path="/reports"
          isActive={currentPath.startsWith('/reports')}
        >
          Service Reports
        </NavItem>
        <NavItem
          icon={FiBarChart2}
          path="/analytics"
          isActive={currentPath.startsWith('/analytics')}
        >
          Analytics
        </NavItem>
      </VStack>
    </Box>
  );

  return (
    <>
      <Box display={{ base: 'none', md: 'block' }} w={60}>
        <SidebarContent />
      </Box>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>HVAC CRM</DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}