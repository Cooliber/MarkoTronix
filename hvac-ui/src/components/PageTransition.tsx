import React, { ReactNode, useEffect, useRef } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { gsap } from 'gsap';
import { useRouter } from 'next/router';
import { useAnimationContext } from '../contexts/AnimationContext';

interface PageTransitionProps extends BoxProps {
  children: ReactNode;
  mode?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
}

/**
 * Component for smooth transitions between pages
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  mode = 'fade',
  duration,
  ...boxProps
}) => {
  const router = useRouter();
  const { settings, registerAnimation } = useAnimationContext();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Skip animations if reduced motion is enabled
  const effectiveMode = settings.reducedMotion ? 'none' : mode;
  const effectiveDuration = settings.reducedMotion ? 
    Math.min(duration || settings.duration, 0.2) : 
    (duration || settings.duration);
  
  useEffect(() => {
    // Skip if no container or animations disabled
    if (!containerRef.current || effectiveMode === 'none') return;
    
    // Initial animation (enter)
    let animation;
    
    switch (effectiveMode) {
      case 'fade':
        animation = gsap.fromTo(
          containerRef.current,
          { opacity: 0 },
          { 
            opacity: 1, 
            duration: effectiveDuration,
            ease: 'power2.out'
          }
        );
        break;
        
      case 'slide':
        animation = gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: 20 },
          { 
            opacity: 1, 
            y: 0, 
            duration: effectiveDuration,
            ease: 'power2.out'
          }
        );
        break;
        
      case 'scale':
        animation = gsap.fromTo(
          containerRef.current,
          { opacity: 0, scale: 0.98 },
          { 
            opacity: 1, 
            scale: 1, 
            duration: effectiveDuration,
            ease: 'power2.out'
          }
        );
        break;
    }
    
    if (animation) {
      registerAnimation(animation);
    }
    
    // Handle route change animations
    const handleRouteChangeStart = () => {
      if (!containerRef.current) return;
      
      let exitAnimation;
      
      switch (effectiveMode) {
        case 'fade':
          exitAnimation = gsap.to(
            containerRef.current,
            { 
              opacity: 0, 
              duration: effectiveDuration * 0.75,
              ease: 'power2.in'
            }
          );
          break;
          
        case 'slide':
          exitAnimation = gsap.to(
            containerRef.current,
            { 
              opacity: 0, 
              y: -20, 
              duration: effectiveDuration * 0.75,
              ease: 'power2.in'
            }
          );
          break;
          
        case 'scale':
          exitAnimation = gsap.to(
            containerRef.current,
            { 
              opacity: 0, 
              scale: 0.98, 
              duration: effectiveDuration * 0.75,
              ease: 'power2.in'
            }
          );
          break;
      }
      
      if (exitAnimation) {
        registerAnimation(exitAnimation);
      }
    };
    
    router.events.on('routeChangeStart', handleRouteChangeStart);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [effectiveMode, effectiveDuration, registerAnimation, router.events]);
  
  return (
    <Box
      ref={containerRef}
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export default PageTransition;
