import { ReactNode, useEffect } from 'react';
import { Box, BoxProps, useColorModeValue } from '@chakra-ui/react';
import { gsap } from 'gsap';
import { useAnimationRef } from '@/hooks/useAnimation';
import { cardEnterAnimation } from '@/utils/animations';

interface AnimatedCardProps extends BoxProps {
  children: ReactNode;
  delay?: number;
  animated?: boolean;
  hoverEffect?: 'lift' | 'glow' | 'border' | 'none';
}

/**
 * An animated card component using GSAP
 */
export default function AnimatedCard({
  children,
  delay = 0,
  animated = true,
  hoverEffect = 'lift',
  ...props
}: AnimatedCardProps) {
  const { elementRef, animate } = useAnimationRef();
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBorderColor = useColorModeValue('blue.500', 'blue.300');
  const hoverShadow = useColorModeValue(
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
  );
  
  // Apply entrance animation
  useEffect(() => {
    if (animated && elementRef.current) {
      animate(() => cardEnterAnimation(elementRef.current as HTMLElement, delay));
    }
  }, [animate, animated, delay, elementRef]);
  
  // Apply hover effects
  useEffect(() => {
    const element = elementRef.current;
    if (!element || hoverEffect === 'none') return;
    
    if (hoverEffect === 'lift') {
      // Lift effect
      element.addEventListener('mouseenter', () => {
        gsap.to(element, { 
          y: -5, 
          boxShadow: hoverShadow, 
          duration: 0.2 
        });
      });
      
      element.addEventListener('mouseleave', () => {
        gsap.to(element, { 
          y: 0, 
          boxShadow: props.boxShadow || 'md', 
          duration: 0.2 
        });
      });
    } else if (hoverEffect === 'glow') {
      // Glow effect
      element.addEventListener('mouseenter', () => {
        gsap.to(element, { 
          boxShadow: `0 0 0 1px ${hoverBorderColor}, ${hoverShadow}`, 
          duration: 0.3 
        });
      });
      
      element.addEventListener('mouseleave', () => {
        gsap.to(element, { 
          boxShadow: props.boxShadow || 'md', 
          duration: 0.3 
        });
      });
    } else if (hoverEffect === 'border') {
      // Border effect
      element.addEventListener('mouseenter', () => {
        gsap.to(element, { 
          borderColor: hoverBorderColor, 
          duration: 0.3 
        });
      });
      
      element.addEventListener('mouseleave', () => {
        gsap.to(element, { 
          borderColor: borderColor, 
          duration: 0.3 
        });
      });
    }
    
    // Cleanup
    return () => {
      element.removeEventListener('mouseenter', () => {});
      element.removeEventListener('mouseleave', () => {});
    };
  }, [
    elementRef, 
    hoverEffect, 
    hoverShadow, 
    hoverBorderColor, 
    borderColor, 
    props.boxShadow
  ]);
  
  return (
    <Box
      ref={elementRef}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      transition="all 0.2s"
      opacity={animated ? 0 : 1} // Start with opacity 0 for animation
      {...props}
    >
      {children}
    </Box>
  );
}