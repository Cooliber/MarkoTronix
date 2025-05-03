import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BellIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';

interface NavbarProps {
  onSidebarOpen: () => void;
}

export default function Navbar({ onSidebarOpen }: NavbarProps) {
  const { isOpen, onToggle } = useDisclosure();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
        justify={'space-between'}
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onSidebarOpen}
            icon={<HamburgerIcon w={5} h={5} />}
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Text
            textAlign={useDisclosure ? 'left' : 'center'}
            fontFamily={'heading'}
            color={useColorModeValue('gray.800', 'white')}
            display={{ base: 'none', md: 'flex' }}
            fontWeight="bold"
          >
            {router.pathname.split('/')[1]?.charAt(0).toUpperCase() + router.pathname.split('/')[1]?.slice(1) || 'Dashboard'}
          </Text>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}
          align="center"
        >
          <Button
            as={'a'}
            fontSize={'sm'}
            fontWeight={400}
            variant={'ghost'}
            position="relative"
            onClick={() => router.push('/notifications')}
          >
            <BellIcon w={5} h={5} />
            <Badge
              colorScheme="red"
              position="absolute"
              top="-5px"
              right="-5px"
              borderRadius="full"
              fontSize="xs"
            >
              3
            </Badge>
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'link'}
              cursor={'pointer'}
              minW={0}
            >
              <Avatar
                size={'sm'}
                name={user?.name || 'User'}
                src={user?.avatar || ''}
              />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => router.push('/profile')}>Profile</MenuItem>
              <MenuItem onClick={() => router.push('/settings')}>Settings</MenuItem>
              <MenuDivider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Stack>
      </Flex>
    </Box>
  );
}