import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

// Hook for creating and managing GSAP animations
export const useAnimation = () => {
  // Create a ref to store all animations for cleanup
  const animationsRef = useRef<gsap.core.Tween[]>([]);
  
  // Function to register animations for cleanup
  const registerAnimation = (animation: gsap.core.Tween) => {
    animationsRef.current.push(animation);
    return animation;
  };
  
  // Cleanup animations on component unmount
  useEffect(() => {
    return () => {
      animationsRef.current.forEach(animation => {
        if (animation.isActive()) {
          animation.kill();
        }
      });
      animationsRef.current = [];
    };
  }, []);
  
  return { registerAnimation };
};

// Hook for creating refs with GSAP animations
export const useAnimationRef = <T extends HTMLElement>() => {
  const elementRef = useRef<T>(null);
  const { registerAnimation } = useAnimation();
  
  const animate = (animationFn: (element: T) => gsap.core.Tween) => {
    if (elementRef.current) {
      const animation = animationFn(elementRef.current);
      return registerAnimation(animation);
    }
    return null;
  };
  
  return { elementRef, animate };
};

// Hook for staggered animations on multiple elements
export const useStaggerAnimation = <T extends HTMLElement>() => {
  const containerRef = useRef<HTMLElement>(null);
  const { registerAnimation } = useAnimation();
  
  const animateChildren = (
    selector: string,
    animationFn: (elements: HTMLElement[]) => gsap.core.Tween
  ) => {
    if (containerRef.current) {
      const elements = Array.from(
        containerRef.current.querySelectorAll(selector)
      ) as HTMLElement[];
      
      if (elements.length > 0) {
        const animation = animationFn(elements);
        return registerAnimation(animation);
      }
    }
    return null;
  };
  
  return { containerRef, animateChildren };
};

// Hook for scroll-triggered animations
export const useScrollAnimation = <T extends HTMLElement>(
  threshold: number = 0.2
) => {
  const elementRef = useRef<T>(null);
  const { registerAnimation } = useAnimation();
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if element is in viewport
      if (rect.top <= windowHeight * (1 - threshold)) {
        // Element is in view, trigger animation
        if (!element.dataset.animated) {
          element.dataset.animated = 'true';
          
          // Apply animation
          const animation = gsap.fromTo(
            element,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          );
          
          registerAnimation(animation);
        }
      }
    };
    
    // Initial check
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [registerAnimation, threshold]);
  
  return elementRef;
};

export default useAnimation;