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
  Divider,
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
  FiAward,
  FiTool,
  FiSliders,
  FiSettings,
  FiPaperclip,
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
          _groupHover={{
            color: activeColor,
          }}
        >{icon}</Icon>
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
      overflowY="auto"
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Image src="/logo.png" alt="HVAC CRM Logo" boxSize="40px" />
        <Text fontSize="2xl" fontWeight="bold">
          HVAC CRM
        </Text>
      </Flex>
      <VStack spacing={1} align="stretch" px={2}>
        <NavItem icon={FiHome as unknown as ReactNode} path="/dashboard" isActive={currentPath === '/dashboard'}>
          Dashboard
        </NavItem>

        <Text px="4" pt="4" pb="1" fontSize="xs" fontWeight="bold" color="gray.500">
          CLIENT MANAGEMENT
        </Text>
        <NavItem icon={FiUsers as unknown as ReactNode} path="/clients" isActive={currentPath.startsWith('/clients')}>
          Clients
        </NavItem>
        <NavItem icon={FiMail as unknown as ReactNode} path="/communications" isActive={currentPath.startsWith('/communications')}>
          Communications
        </NavItem>
        <NavItem icon={FiPaperclip as unknown as ReactNode} path="/attachments" isActive={currentPath.startsWith('/attachments')}>
          Attachments
        </NavItem>
        <NavItem
          icon={FiFileText as unknown as ReactNode}
          path="/transcriptions"
          isActive={currentPath.startsWith('/transcriptions')}
        >
          Transcriptions
        </NavItem>
        <NavItem icon={FiFileText as unknown as ReactNode} path="/offers" isActive={currentPath.startsWith('/offers')}>
          Offers
        </NavItem>

        <Text px="4" pt="4" pb="1" fontSize="xs" fontWeight="bold" color="gray.500">
          SERVICE MANAGEMENT
        </Text>
        <NavItem icon={FiCalendar as unknown as ReactNode} path="/calendar" isActive={currentPath.startsWith('/calendar')}>
          Calendar
        </NavItem>
        <NavItem
          icon={FiTool as unknown as ReactNode}
          path="/service-orders"
          isActive={currentPath.startsWith('/service-orders')}
        >
          Service Orders
        </NavItem>
        <NavItem
          icon={FiAward as unknown as ReactNode}
          path="/warranty"
          isActive={currentPath.startsWith('/warranty')}
        >
          Warranty Cards
        </NavItem>
        <NavItem icon={FiMap as unknown as ReactNode} path="/map" isActive={currentPath.startsWith('/map')}>
          Map
        </NavItem>

        <Text px="4" pt="4" pb="1" fontSize="xs" fontWeight="bold" color="gray.500">
          INVENTORY & REPORTS
        </Text>
        <NavItem icon={FiPackage as unknown as ReactNode} path="/inventory" isActive={currentPath.startsWith('/inventory')}>
          Inventory
        </NavItem>
        <NavItem
          icon={FiClipboard as unknown as ReactNode}
          path="/reports"
          isActive={currentPath.startsWith('/reports')}
        >
          Service Reports
        </NavItem>
        <NavItem
          icon={FiBarChart2 as unknown as ReactNode}
          path="/analytics"
          isActive={currentPath.startsWith('/analytics')}
        >
          Analytics
        </NavItem>

        <Text px="4" pt="4" pb="1" fontSize="xs" fontWeight="bold" color="gray.500">
          SYSTEM
        </Text>
        <NavItem
          icon={FiSliders as unknown as ReactNode}
          path="/workflow"
          isActive={currentPath.startsWith('/workflow')}
        >
          Workflow Automation
        </NavItem>
        <NavItem
          icon={FiSettings as unknown as ReactNode}
          path="/settings"
          isActive={currentPath.startsWith('/settings')}
        >
          System Settings
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