import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

// Make sure ScrollTrigger is registered
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hook for creating scroll-triggered animations
 * @param options ScrollTrigger options
 */
export const useScrollTrigger = (options: ScrollTrigger.Vars = {}) => {
  const triggerRef = useRef<HTMLElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  
  useEffect(() => {
    // Skip if no element or not in browser
    if (!triggerRef.current || typeof window === 'undefined') return;
    
    // Create a timeline for the animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerRef.current,
        start: 'top bottom-=100',
        end: 'bottom top+=100',
        toggleActions: 'play none none reverse',
        ...options,
      },
    });
    
    // Store the timeline for later use
    animationRef.current = tl;
    
    // Clean up
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
      
      // Kill the ScrollTrigger instance
      ScrollTrigger.getAll().forEach(st => {
        if (st.vars.trigger === triggerRef.current) {
          st.kill();
        }
      });
    };
  }, [options]);
  
  return { triggerRef, timeline: animationRef };
};

/**
 * Hook for creating a fade-in animation on scroll
 */
export const useFadeInOnScroll = (delay: number = 0) => {
  const { triggerRef, timeline } = useScrollTrigger({
    start: 'top bottom-=50',
  });
  
  useEffect(() => {
    if (!triggerRef.current || !timeline.current) return;
    
    // Add the fade-in animation to the timeline
    timeline.current.fromTo(
      triggerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay }
    );
  }, [delay, timeline]);
  
  return triggerRef;
};

/**
 * Hook for creating a staggered animation on scroll for child elements
 */
export const useStaggerOnScroll = (selector: string, staggerAmount: number = 0.1) => {
  const { triggerRef, timeline } = useScrollTrigger({
    start: 'top bottom-=50',
  });
  
  useEffect(() => {
    if (!triggerRef.current || !timeline.current) return;
    
    // Get all child elements matching the selector
    const elements = triggerRef.current.querySelectorAll(selector);
    
    if (elements.length > 0) {
      // Add the staggered animation to the timeline
      timeline.current.fromTo(
        elements,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: staggerAmount, 
          ease: 'power2.out' 
        }
      );
    }
  }, [selector, staggerAmount, timeline]);
  
  return triggerRef;
};

export default useScrollTrigger;