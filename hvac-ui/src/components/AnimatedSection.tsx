import React, { ReactNode, forwardRef } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { useStaggerOnScroll } from '../hooks/useScrollAnimation';

interface AnimatedSectionProps extends BoxProps {
  children: ReactNode;
  childSelector?: string;
  staggerAmount?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
  threshold?: number;
  markers?: boolean;
}

/**
 * A section component that animates its children with a staggered animation on scroll
 */
const AnimatedSection = forwardRef<HTMLDivElement, AnimatedSectionProps>(
  (
    {
      children,
      childSelector = '> *',
      staggerAmount = 0.1,
      animateFrom = 'bottom',
      distance = 30,
      duration = 0.5,
      delay = 0,
      once = true,
      threshold = 0.2,
      markers = false,
      ...boxProps
    },
    ref
  ) => {
    // Calculate animation values based on direction
    const getAnimationValues = () => {
      switch (animateFrom) {
        case 'top':
          return { y: -distance, x: 0 };
        case 'bottom':
          return { y: distance, x: 0 };
        case 'left':
          return { y: 0, x: -distance };
        case 'right':
          return { y: 0, x: distance };
        default:
          return { y: distance, x: 0 };
      }
    };

    const { y, x } = getAnimationValues();

    // Use the stagger animation hook
    const containerRef = useStaggerOnScroll(childSelector, {
      staggerAmount,
      y,
      x,
      duration,
      markers,
      start: `top bottom-=${threshold * 100}%`,
      from: {
        opacity: 0,
        y,
        x,
      },
      to: {
        opacity: 1,
        y: 0,
        x: 0,
        duration,
        delay,
        ease: 'power2.out',
      },
    });

    return (
      <Box
        ref={containerRef}
        position="relative"
        {...boxProps}
      >
        {children}
      </Box>
    );
  }
);

AnimatedSection.displayName = 'AnimatedSection';

export default AnimatedSection;
