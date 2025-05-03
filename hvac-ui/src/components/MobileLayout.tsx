import { ReactNode, useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useColorModeValue,
  VStack,
  HStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  Image,
  useBreakpointValue,
  Button,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {
  FiMenu,
  FiBell,
  FiUser,
  FiLogOut,
  FiSettings,
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
  FiChevronLeft,
} from 'react-icons/fi';
import { gsap } from 'gsap';
import { useAnimation } from '@/hooks/useAnimation';
import { mobileMenuOpenAnimation, mobileMenuCloseAnimation, pageEnterAnimation } from '@/utils/animations';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function MobileLayout({
  children,
  title,
  showBackButton = false,
  onBack,
}: MobileLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const currentPath = router.pathname;
  const { registerAnimation } = useAnimation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [notificationCount, setNotificationCount] = useState(3);

  // Handle drawer animations
  useEffect(() => {
    if (drawerRef.current) {
      if (isOpen) {
        const animation = mobileMenuOpenAnimation(drawerRef.current);
        registerAnimation(animation);
      }
    }
  }, [isOpen, registerAnimation]);

  // Handle page transition animations
  useEffect(() => {
    if (contentRef.current) {
      const animation = pageEnterAnimation(contentRef.current);
      registerAnimation(animation);
    }
  }, [currentPath, registerAnimation]);

  const handleCloseDrawer = () => {
    if (drawerRef.current && isOpen) {
      const animation = mobileMenuCloseAnimation(drawerRef.current);
      animation.eventCallback('onComplete', onClose);
      registerAnimation(animation);
    } else {
      onClose();
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    handleCloseDrawer();
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Mobile Header */}
      <Flex
        as="header"
        position="fixed"
        top={0}
        width="full"
        zIndex={10}
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH="60px"
        py={2}
        px={4}
        borderBottomWidth={1}
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        align="center"
        justify="space-between"
        boxShadow="sm"
      >
        <HStack spacing={4}>
          {showBackButton ? (
            <IconButton
              aria-label="Go back"
              icon={<FiChevronLeft />}
              variant="ghost"
              onClick={handleBackClick}
            />
          ) : (
            <IconButton
              aria-label="Open menu"
              icon={<FiMenu />}
              variant="ghost"
              onClick={onOpen}
            />
          )}
          {title && (
            <Text fontSize="lg" fontWeight="semibold" noOfLines={1}>
              {title}
            </Text>
          )}
        </HStack>

        <HStack spacing={3}>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Notifications"
              icon={
                <>
                  <FiBell />
                  {notificationCount > 0 && (
                    <Badge
                      position="absolute"
                      top="-5px"
                      right="-5px"
                      colorScheme="red"
                      borderRadius="full"
                      fontSize="xs"
                      minW="1.5em"
                      textAlign="center"
                    >
                      {notificationCount}
                    </Badge>
                  )}
                </>
              }
              variant="ghost"
            />
            <MenuList>
              <MenuItem>New service order assigned</MenuItem>
              <MenuItem>Client message received</MenuItem>
              <MenuItem>Warranty expiring soon</MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => setNotificationCount(0)}>Mark all as read</MenuItem>
            </MenuList>
          </Menu>

          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="User menu"
              icon={<FiUser />}
              variant="ghost"
            />
            <MenuList>
              <MenuItem icon={<FiUser />}>Profile</MenuItem>
              <MenuItem icon={<FiSettings />}>Settings</MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={handleCloseDrawer} size="xs">
        <DrawerOverlay />
        <DrawerContent ref={drawerRef}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Flex align="center">
              <Image src="/logo.png" alt="HVAC CRM Logo" boxSize="30px" mr={2} />
              <Text fontSize="xl" fontWeight="bold">
                HVAC CRM
              </Text>
            </Flex>
          </DrawerHeader>
          <DrawerBody p={0}>
            <VStack spacing={0} align="stretch">
              <Button
                leftIcon={<FiHome />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath === '/dashboard' ? 'blue' : undefined}
                onClick={() => handleNavigation('/dashboard')}
              >
                Dashboard
              </Button>
              
              <Text px={4} pt={4} pb={1} fontSize="xs" fontWeight="bold" color="gray.500">
                CLIENT MANAGEMENT
              </Text>
              
              <Button
                leftIcon={<FiUsers />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/clients') ? 'blue' : undefined}
                onClick={() => handleNavigation('/clients')}
              >
                Clients
              </Button>
              
              <Button
                leftIcon={<FiMail />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/emails') ? 'blue' : undefined}
                onClick={() => handleNavigation('/emails')}
              >
                Emails
              </Button>
              
              <Button
                leftIcon={<FiFileText />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/transcriptions') ? 'blue' : undefined}
                onClick={() => handleNavigation('/transcriptions')}
              >
                Transcriptions
              </Button>
              
              <Button
                leftIcon={<FiFileText />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/offers') ? 'blue' : undefined}
                onClick={() => handleNavigation('/offers')}
              >
                Offers
              </Button>
              
              <Text px={4} pt={4} pb={1} fontSize="xs" fontWeight="bold" color="gray.500">
                SERVICE MANAGEMENT
              </Text>
              
              <Button
                leftIcon={<FiCalendar />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/calendar') ? 'blue' : undefined}
                onClick={() => handleNavigation('/calendar')}
              >
                Calendar
              </Button>
              
              <Button
                leftIcon={<FiTool />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/service-orders') ? 'blue' : undefined}
                onClick={() => handleNavigation('/service-orders')}
              >
                Service Orders
              </Button>
              
              <Button
                leftIcon={<FiAward />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/warranty') ? 'blue' : undefined}
                onClick={() => handleNavigation('/warranty')}
              >
                Warranty Cards
              </Button>
              
              <Button
                leftIcon={<FiMap />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/map') ? 'blue' : undefined}
                onClick={() => handleNavigation('/map')}
              >
                Map
              </Button>
              
              <Text px={4} pt={4} pb={1} fontSize="xs" fontWeight="bold" color="gray.500">
                INVENTORY & REPORTS
              </Text>
              
              <Button
                leftIcon={<FiPackage />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/inventory') ? 'blue' : undefined}
                onClick={() => handleNavigation('/inventory')}
              >
                Inventory
              </Button>
              
              <Button
                leftIcon={<FiClipboard />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/reports') ? 'blue' : undefined}
                onClick={() => handleNavigation('/reports')}
              >
                Service Reports
              </Button>
              
              <Button
                leftIcon={<FiBarChart2 />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/analytics') ? 'blue' : undefined}
                onClick={() => handleNavigation('/analytics')}
              >
                Analytics
              </Button>
              
              <Text px={4} pt={4} pb={1} fontSize="xs" fontWeight="bold" color="gray.500">
                SYSTEM
              </Text>
              
              <Button
                leftIcon={<FiSliders />}
                justifyContent="flex-start"
                variant="ghost"
                py={3}
                borderRadius={0}
                colorScheme={currentPath.startsWith('/workflow') ? 'blue' : undefined}
                onClick={() => handleNavigation('/workflow')}
              >
                Workflow Automation
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box 
        ref={contentRef} 
        pt="60px" 
        pb="70px" 
        px={4}
        opacity={0} // Initial state for animation
      >
        {children}
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Flex
          as="nav"
          position="fixed"
          bottom={0}
          width="full"
          zIndex={10}
          bg={useColorModeValue('white', 'gray.800')}
          color={useColorModeValue('gray.600', 'white')}
          py={2}
          px={4}
          borderTopWidth={1}
          borderTopColor={useColorModeValue('gray.200', 'gray.700')}
          justify="space-around"
          boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
        >
          <IconButton
            aria-label="Dashboard"
            icon={<FiHome />}
            variant="ghost"
            colorScheme={currentPath === '/dashboard' ? 'blue' : undefined}
            onClick={() => router.push('/dashboard')}
          />
          <IconButton
            aria-label="Clients"
            icon={<FiUsers />}
            variant="ghost"
            colorScheme={currentPath.startsWith('/clients') ? 'blue' : undefined}
            onClick={() => router.push('/clients')}
          />
          <IconButton
            aria-label="Service Orders"
            icon={<FiTool />}
            variant="ghost"
            colorScheme={currentPath.startsWith('/service-orders') ? 'blue' : undefined}
            onClick={() => router.push('/service-orders')}
          />
          <IconButton
            aria-label="Calendar"
            icon={<FiCalendar />}
            variant="ghost"
            colorScheme={currentPath.startsWith('/calendar') ? 'blue' : undefined}
            onClick={() => router.push('/calendar')}
          />
          <IconButton
            aria-label="More"
            icon={<FiMenu />}
            variant="ghost"
            onClick={onOpen}
          />
        </Flex>
      )}
    </Box>
  );
}