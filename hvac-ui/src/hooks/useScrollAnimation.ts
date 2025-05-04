import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useAnimationContext } from '../contexts/AnimationContext';

// Make sure ScrollTrigger is registered
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hook for creating scroll-triggered animations with enhanced options
 * @param options ScrollTrigger options
 */
export const useScrollTrigger = (options: ScrollTrigger.Vars = {}) => {
  const triggerRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const { settings, registerAnimation } = useAnimationContext();

  // Create the ScrollTrigger instance
  const createScrollTrigger = useCallback(() => {
    // Skip if no element or not in browser
    if (!triggerRef.current || typeof window === 'undefined') return;

    // Kill any existing ScrollTrigger
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
      scrollTriggerRef.current = null;
    }

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Create a timeline for the animation
    const tl = gsap.timeline({
      paused: true,
      data: { createdAt: Date.now() }
    });

    // Apply reduced motion settings if needed
    const scrollOptions = {
      trigger: triggerRef.current,
      start: 'top bottom-=100',
      end: 'bottom top+=100',
      toggleActions: 'play none none reverse',
      // Apply reduced motion settings
      scrub: settings.reducedMotion ? true : false,
      ...options,
      onUpdate: (self) => {
        // Call the original onUpdate if it exists
        if (options.onUpdate) {
          options.onUpdate(self);
        }
      }
    };

    // Create the ScrollTrigger
    scrollTriggerRef.current = ScrollTrigger.create({
      ...scrollOptions,
      animation: tl,
    });

    // Store the timeline for later use
    timelineRef.current = tl;

    // Register the timeline for cleanup
    registerAnimation(tl);

    return tl;
  }, [options, registerAnimation, settings.reducedMotion]);

  // Create or recreate the ScrollTrigger when dependencies change
  useEffect(() => {
    const tl = createScrollTrigger();

    // Clean up
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [createScrollTrigger, options]);

  // Method to refresh the ScrollTrigger (useful after DOM changes)
  const refresh = useCallback(() => {
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.refresh();
    }
  }, []);

  // Method to manually trigger the animation
  const play = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.play();
    }
  }, []);

  // Method to pause the animation
  const pause = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.pause();
    }
  }, []);

  return {
    triggerRef,
    timeline: timelineRef,
    scrollTrigger: scrollTriggerRef,
    refresh,
    play,
    pause
  };
};

/**
 * Hook for creating a fade-in animation on scroll with enhanced options
 */
export const useFadeInOnScroll = (options: {
  delay?: number;
  start?: string;
  y?: number;
  x?: number;
  scale?: number;
  duration?: number;
  ease?: string;
  stagger?: number;
  markers?: boolean;
} = {}) => {
  const {
    delay = 0,
    start = 'top bottom-=50',
    y = 30,
    x = 0,
    scale,
    duration,
    ease = 'power2.out',
    stagger = 0,
    markers = false
  } = options;

  const { settings } = useAnimationContext();

  // Apply reduced motion settings
  const effectiveY = settings.reducedMotion ? Math.min(Math.abs(y), 10) * Math.sign(y) : y;
  const effectiveX = settings.reducedMotion ? Math.min(Math.abs(x), 10) * Math.sign(x) : x;
  const effectiveScale = scale ? (settings.reducedMotion ? Math.max(0.95, scale) : scale) : undefined;
  const effectiveDuration = settings.reducedMotion ?
    Math.min(duration || settings.duration, 0.2) :
    (duration || settings.duration);

  const { triggerRef, timeline } = useScrollTrigger({
    start,
    markers,
  });

  useEffect(() => {
    if (!triggerRef.current || !timeline.current) return;

    // Create the from state
    const fromState: gsap.TweenVars = { opacity: 0 };
    if (effectiveY !== 0) fromState.y = effectiveY;
    if (effectiveX !== 0) fromState.x = effectiveX;
    if (effectiveScale !== undefined) fromState.scale = effectiveScale;

    // Create the to state
    const toState: gsap.TweenVars = {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: effectiveDuration,
      ease,
      delay
    };

    // Add the fade-in animation to the timeline
    timeline.current.fromTo(
      triggerRef.current,
      fromState,
      toState
    );
  }, [
    delay,
    timeline,
    effectiveY,
    effectiveX,
    effectiveScale,
    effectiveDuration,
    ease
  ]);

  return triggerRef;
};

/**
 * Hook for creating a staggered animation on scroll for child elements with enhanced options
 */
export const useStaggerOnScroll = (
  selector: string,
  options: {
    staggerAmount?: number;
    start?: string;
    y?: number;
    x?: number;
    scale?: number;
    duration?: number;
    ease?: string;
    stagger?: number;
    markers?: boolean;
    from?: gsap.TweenVars;
    to?: gsap.TweenVars;
  } = {}
) => {
  const {
    staggerAmount = 0.1,
    start = 'top bottom-=50',
    y = 20,
    x = 0,
    scale,
    duration,
    ease = 'power2.out',
    markers = false,
    from,
    to
  } = options;

  const { settings } = useAnimationContext();

  // Apply reduced motion settings
  const effectiveStagger = settings.reducedMotion ? Math.min(staggerAmount, 0.05) : staggerAmount;
  const effectiveY = settings.reducedMotion ? Math.min(Math.abs(y), 10) * Math.sign(y) : y;
  const effectiveX = settings.reducedMotion ? Math.min(Math.abs(x), 10) * Math.sign(x) : x;
  const effectiveScale = scale ? (settings.reducedMotion ? Math.max(0.95, scale) : scale) : undefined;
  const effectiveDuration = settings.reducedMotion ?
    Math.min(duration || settings.duration, 0.2) :
    (duration || settings.duration);

  const { triggerRef, timeline } = useScrollTrigger({
    start,
    markers,
  });

  useEffect(() => {
    if (!triggerRef.current || !timeline.current) return;

    // Get all child elements matching the selector
    const elements = triggerRef.current.querySelectorAll(selector);

    if (elements.length > 0) {
      // Create the from state
      const fromState: gsap.TweenVars = from || { opacity: 0 };
      if (!from) {
        if (effectiveY !== 0) fromState.y = effectiveY;
        if (effectiveX !== 0) fromState.x = effectiveX;
        if (effectiveScale !== undefined) fromState.scale = effectiveScale;
      }

      // Create the to state
      const toState: gsap.TweenVars = to || {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration: effectiveDuration,
        stagger: effectiveStagger,
        ease
      };

      if (!to) {
        toState.duration = effectiveDuration;
        toState.stagger = effectiveStagger;
        toState.ease = ease;
      }

      // Add the staggered animation to the timeline
      timeline.current.fromTo(
        elements,
        fromState,
        toState
      );
    }
  }, [
    selector,
    timeline,
    effectiveStagger,
    effectiveY,
    effectiveX,
    effectiveScale,
    effectiveDuration,
    ease,
    from,
    to
  ]);

  return triggerRef;
};

/**
 * Hook for creating a parallax effect on scroll
 */
export const useParallaxOnScroll = (
  options: {
    speed?: number;
    direction?: 'vertical' | 'horizontal';
    start?: string;
    end?: string;
    markers?: boolean;
    scrub?: boolean | number;
  } = {}
) => {
  const {
    speed = 0.5,
    direction = 'vertical',
    start = 'top bottom',
    end = 'bottom top',
    markers = false,
    scrub = true
  } = options;

  const { settings } = useAnimationContext();

  // Apply reduced motion settings
  const effectiveSpeed = settings.reducedMotion ? Math.min(Math.abs(speed), 0.2) * Math.sign(speed) : speed;
  const effectiveScrub = settings.reducedMotion ? 0.5 : scrub;

  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof window === 'undefined') return;

    // Create the animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start,
        end,
        scrub: effectiveScrub,
        markers,
      }
    });

    // Apply the parallax effect
    if (direction === 'vertical') {
      tl.fromTo(
        element,
        { y: 0 },
        { y: 100 * effectiveSpeed, ease: 'none' }
      );
    } else {
      tl.fromTo(
        element,
        { x: 0 },
        { x: 100 * effectiveSpeed, ease: 'none' }
      );
    }

    // Clean up
    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(st => {
        if (st.vars.trigger === element) {
          st.kill();
        }
      });
    };
  }, [direction, effectiveSpeed, effectiveScrub, start, end, markers]);

  return elementRef;
};

// Utility to refresh all ScrollTrigger instances
export const refreshAllScrollTriggers = () => {
  if (typeof window !== 'undefined') {
    ScrollTrigger.refresh();
  }
};

export default useScrollTrigger;