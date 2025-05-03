import { ReactNode } from 'react';
import {
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Text,
  BoxProps,
  FlexProps,
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiMail,
  FiFileText,
  FiCalendar,
  FiColumns,
  FiMap,
  FiPackage,
  FiClipboard,
} from 'react-icons/fi';
import { IconType } from 'react-icons';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LinkItemProps {
  name: string;
  icon: IconType;
  href: string;
}

const LinkItems: Array<LinkItemProps> = [
  { name: 'Dashboard', icon: FiHome, href: '/dashboard' },
  { name: 'Clients', icon: FiUsers, href: '/clients' },
  { name: 'Emails', icon: FiMail, href: '/emails' },
  { name: 'Transcriptions', icon: FiFileText, href: '/transcriptions' },
  { name: 'Offers', icon: FiFileText, href: '/offers' },
  { name: 'Calendar', icon: FiCalendar, href: '/calendar' },
  { name: 'Kanban', icon: FiColumns, href: '/kanban' },
  { name: 'Map', icon: FiMap, href: '/map' },
  { name: 'Inventory', icon: FiPackage, href: '/inventory' },
  { name: 'Service Reports', icon: FiClipboard, href: '/reports' },
];

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

export default function Sidebar({ onClose, ...rest }: SidebarProps) {
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
          HVAC CRM
        </Text>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} href={link.href}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
}

interface NavItemProps extends FlexProps {
  icon: IconType;
  href: string;
  children: ReactNode;
}

const NavItem = ({ icon, href, children, ...rest }: NavItemProps) => {
  const router = useRouter();
  const isActive = router.pathname === href;
  
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? 'blue.400' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{
          bg: 'blue.400',
          color: 'white',
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};