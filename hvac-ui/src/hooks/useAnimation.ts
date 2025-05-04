import { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { useAnimationContext } from '../contexts/AnimationContext';

// Hook for creating and managing GSAP animations
export const useAnimation = () => {
  // Use the global animation context
  const { settings, registerAnimation: contextRegisterAnimation } = useAnimationContext();

  // Create a local ref to store animations for components that don't use context
  const animationsRef = useRef<(gsap.core.Tween | gsap.core.Timeline)[]>([]);

  // Function to register animations for cleanup
  const registerAnimation = useCallback((animation: gsap.core.Tween | gsap.core.Timeline) => {
    // Register with context if available, otherwise use local ref
    if (contextRegisterAnimation) {
      return contextRegisterAnimation(animation);
    } else {
      animationsRef.current.push(animation);
      return animation;
    }
  }, [contextRegisterAnimation]);

  // Apply global settings to animation config
  const applySettings = useCallback(<T extends Record<string, any>>(config: T): T => {
    if (!settings.enabled) {
      // If animations are disabled, make them instant
      return {
        ...config,
        duration: 0.01,
      };
    }

    if (settings.reducedMotion) {
      // Apply reduced motion settings
      return {
        ...config,
        duration: Math.min(config.duration || settings.duration, 0.2),
        y: config.y ? Math.min(Math.abs(config.y), 10) * Math.sign(config.y) : config.y,
        x: config.x ? Math.min(Math.abs(config.x), 10) * Math.sign(config.x) : config.x,
        scale: config.scale ? Math.max(0.95, config.scale) : config.scale,
      };
    }

    // Apply default settings if not specified in config
    return {
      duration: settings.duration,
      ease: settings.ease,
      ...config,
    };
  }, [settings]);

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

  return { registerAnimation, applySettings, settings };
};

// Hook for creating refs with GSAP animations
export const useAnimationRef = <T extends HTMLElement>() => {
  const elementRef = useRef<T>(null);
  const { registerAnimation, applySettings } = useAnimation();

  const animate = useCallback((
    animationFn: (element: T, applySettings: <C extends Record<string, any>>(config: C) => C) =>
      gsap.core.Tween | gsap.core.Timeline
  ) => {
    if (elementRef.current) {
      const animation = animationFn(elementRef.current, applySettings);
      return registerAnimation(animation);
    }
    return null;
  }, [registerAnimation, applySettings]);

  return { elementRef, animate };
};

// Hook for staggered animations on multiple elements
export const useStaggerAnimation = <T extends HTMLElement>() => {
  const containerRef = useRef<T>(null);
  const { registerAnimation, applySettings, settings } = useAnimation();

  const animateChildren = useCallback((
    selector: string,
    animationFn: (
      elements: HTMLElement[],
      applySettings: <C extends Record<string, any>>(config: C) => C,
      staggerAmount: number
    ) => gsap.core.Tween | gsap.core.Timeline
  ) => {
    if (containerRef.current) {
      const elements = Array.from(
        containerRef.current.querySelectorAll(selector)
      ) as HTMLElement[];

      if (elements.length > 0) {
        const animation = animationFn(elements, applySettings, settings.staggerAmount);
        return registerAnimation(animation);
      }
    }
    return null;
  }, [registerAnimation, applySettings, settings.staggerAmount]);

  return { containerRef, animateChildren };
};

// Hook for scroll-triggered animations
export const useScrollAnimation = <T extends HTMLElement>(
  options: {
    threshold?: number;
    animation?: {
      from: gsap.TweenVars;
      to: gsap.TweenVars;
    };
    once?: boolean;
  } = {}
) => {
  const {
    threshold = 0.2,
    animation = {
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0 }
    },
    once = true
  } = options;

  const elementRef = useRef<T>(null);
  const { registerAnimation, applySettings } = useAnimation();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if element is in viewport
      if (rect.top <= windowHeight * (1 - threshold)) {
        // Element is in view, trigger animation
        if (!element.dataset.animated || !once) {
          element.dataset.animated = 'true';

          // Apply animation with global settings
          const gsapAnimation = gsap.fromTo(
            element,
            animation.from,
            applySettings({
              ...animation.to,
              onComplete: () => {
                if (!once) {
                  // Reset for next animation if not once
                  element.dataset.animated = '';
                }
              }
            })
          );

          registerAnimation(gsapAnimation);
        }
      } else if (!once && element.dataset.animated) {
        // If element is out of view and not once, reset
        element.dataset.animated = '';
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
  }, [registerAnimation, applySettings, threshold, animation, once]);

  return elementRef;
};

// Hook for hover animations
export const useHoverAnimation = <T extends HTMLElement>(
  hoverConfig: {
    enter?: gsap.TweenVars;
    leave?: gsap.TweenVars;
  } = {}
) => {
  const {
    enter = { scale: 1.05, duration: 0.2 },
    leave = { scale: 1, duration: 0.2 }
  } = hoverConfig;

  const elementRef = useRef<T>(null);
  const { applySettings } = useAnimation();
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      animationRef.current = gsap.to(element, applySettings(enter));
    };

    const handleMouseLeave = () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      animationRef.current = gsap.to(element, applySettings(leave));
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [applySettings, enter, leave]);

  return elementRef;
};

export default useAnimation;