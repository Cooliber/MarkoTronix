import { useEffect, useState, ReactNode } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  CloseButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { gsap } from 'gsap';
import { useAnimationRef } from '@/hooks/useAnimation';
import { notificationAnimation } from '@/utils/animations';

interface AnimatedNotificationProps {
  status?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
  children?: ReactNode;
}

/**
 * An animated notification component using GSAP
 */
export default function AnimatedNotification({
  status = 'info',
  title,
  description,
  isOpen,
  onClose,
  duration = 5000,
  position = 'top',
  children,
}: AnimatedNotificationProps) {
  const { elementRef, animate } = useAnimationRef();
  const [isVisible, setIsVisible] = useState(isOpen);
  
  // Colors based on status
  const bgColor = useColorModeValue(
    {
      success: 'green.50',
      error: 'red.50',
      warning: 'orange.50',
      info: 'blue.50',
    }[status],
    {
      success: 'green.900',
      error: 'red.900',
      warning: 'orange.900',
      info: 'blue.900',
    }[status]
  );
  
  const borderColor = useColorModeValue(
    {
      success: 'green.500',
      error: 'red.500',
      warning: 'orange.500',
      info: 'blue.500',
    }[status],
    {
      success: 'green.300',
      error: 'red.300',
      warning: 'orange.300',
      info: 'blue.300',
    }[status]
  );
  
  const iconColor = useColorModeValue(
    {
      success: 'green.500',
      error: 'red.500',
      warning: 'orange.500',
      info: 'blue.500',
    }[status],
    {
      success: 'green.300',
      error: 'red.300',
      warning: 'orange.300',
      info: 'blue.300',
    }[status]
  );
  
  // Status icon
  const StatusIcon = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
  }[status];
  
  // Handle animation when isOpen changes
  useEffect(() => {
    if (isOpen && elementRef.current) {
      setIsVisible(true);
      
      // Animate in
      const animation = animate(() => notificationAnimation(elementRef.current as HTMLElement));
      
      // Auto-close after duration
      if (duration > 0) {
        const timeout = setTimeout(() => {
          onClose();
        }, duration);
        
        return () => clearTimeout(timeout);
      }
    } else if (!isOpen && isVisible && elementRef.current) {
      // Animate out
      const tl = gsap.timeline({
        onComplete: () => setIsVisible(false),
      });
      
      tl.to(elementRef.current, {
        opacity: 0,
        y: position === 'top' ? -20 : 20,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isOpen, duration, onClose, animate, elementRef, isVisible, position]);
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  return (
    <Box
      ref={elementRef}
      position="fixed"
      zIndex={9999}
      left="50%"
      transform="translateX(-50%)"
      {...(position === 'top' ? { top: '20px' } : { bottom: '20px' })}
      opacity={0} // Start with opacity 0 for animation
    >
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        boxShadow="md"
        p={4}
        maxW="sm"
        width="100%"
      >
        <Flex align="center">
          <Icon as={StatusIcon} color={iconColor} boxSize={5} mr={3} />
          <Box flex="1">
            <Text fontWeight="bold">{title}</Text>
            {description && <Text fontSize="sm" mt={1}>{description}</Text>}
            {children}
          </Box>
          <CloseButton size="sm" onClick={onClose} />
        </Flex>
      </Box>
    </Box>
  );
}