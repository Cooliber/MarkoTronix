import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useAnimationContext } from '../contexts/AnimationContext';
import { useCallback, useRef } from 'react';

// Define a type for the contextSafe function
type ContextSafeFunction = <T extends (...args: any[]) => any>(fn: T) => T;

/**
 * Enhanced hook that combines GSAP React integration with our animation context
 */
export const useGSAPContext = (
  callback?: (
    contextSafe: ContextSafeFunction,
    scope?: gsap.Context
  ) => void,
  dependencies: any[] = []
) => {
  const { settings, registerAnimation } = useAnimationContext();
  const animationsRef = useRef<(gsap.core.Tween | gsap.core.Timeline)[]>([]);

  // Apply global settings to animation config
  const applySettings = useCallback((config: Record<string, any>): Record<string, any> => {
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

  // Create a wrapper for gsap.to that applies our settings
  const to = useCallback(
    (
      targets: gsap.TweenTarget,
      vars: gsap.TweenVars
    ): gsap.core.Tween => {
      const animation = gsap.to(targets, applySettings(vars) as gsap.TweenVars);
      registerAnimation(animation);
      animationsRef.current.push(animation);
      return animation;
    },
    [applySettings, registerAnimation]
  );

  // Create a wrapper for gsap.from that applies our settings
  const from = useCallback(
    (
      targets: gsap.TweenTarget,
      vars: gsap.TweenVars
    ): gsap.core.Tween => {
      const animation = gsap.from(targets, applySettings(vars) as gsap.TweenVars);
      registerAnimation(animation);
      animationsRef.current.push(animation);
      return animation;
    },
    [applySettings, registerAnimation]
  );

  // Create a wrapper for gsap.fromTo that applies our settings
  const fromTo = useCallback(
    (
      targets: gsap.TweenTarget,
      fromVars: gsap.TweenVars,
      toVars: gsap.TweenVars
    ): gsap.core.Tween => {
      const animation = gsap.fromTo(targets, fromVars, applySettings(toVars) as gsap.TweenVars);
      registerAnimation(animation);
      animationsRef.current.push(animation);
      return animation;
    },
    [applySettings, registerAnimation]
  );

  // Create a wrapper for gsap.timeline that registers the timeline
  const timeline = useCallback((vars?: gsap.TimelineVars): gsap.core.Timeline => {
    const tl = gsap.timeline(vars);
    registerAnimation(tl);
    animationsRef.current.push(tl);
    return tl;
  }, [registerAnimation]);

  // Use the GSAP React hook with our enhanced context
  const context = useGSAP((contextSafe, scope) => {
    // Call the user's callback with our enhanced context
    if (callback) {
      // We need to ignore the TypeScript error here as the types from GSAP are not fully compatible
      // @ts-ignore
      callback(contextSafe, scope);
    }

    // Return a cleanup function
    return () => {
      // Kill all animations created in this context
      animationsRef.current.forEach(animation => {
        if (animation.isActive()) {
          animation.kill();
        }
      });
      animationsRef.current = [];
    };
  }, dependencies);

  return {
    ...context,
    to,
    from,
    fromTo,
    timeline,
    applySettings,
    settings,
  };
};

export default useGSAPContext;
