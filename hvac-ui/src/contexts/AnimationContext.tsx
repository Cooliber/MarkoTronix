import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';
import { useMediaQuery, mediaQueries } from '@/hooks/usehooks';

// Define animation settings type
interface AnimationSettings {
  duration: number;
  ease: string;
  staggerAmount: number;
  enabled: boolean;
  reducedMotion: boolean;
}

// Define context type
interface AnimationContextType {
  settings: AnimationSettings;
  updateSettings: (newSettings: Partial<AnimationSettings>) => void;
  registerAnimation: (animation: gsap.core.Tween | gsap.core.Timeline) => void;
  clearAnimations: () => void;
}

// Default animation settings
const defaultSettings: AnimationSettings = {
  duration: 0.5,
  ease: 'power2.out',
  staggerAmount: 0.1,
  enabled: true,
  reducedMotion: false,
};

// Create context with default values
const AnimationContext = createContext<AnimationContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  registerAnimation: () => {},
  clearAnimations: () => {},
});

// Animation provider component
export const AnimationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AnimationSettings>(defaultSettings);
  const [animations, setAnimations] = useState<(gsap.core.Tween | gsap.core.Timeline)[]>([]);

  // Use our custom hook to check for reduced motion preference
  const prefersReducedMotion = useMediaQuery(mediaQueries.reducedMotion);

  // Update settings when reduced motion preference changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      duration: prefersReducedMotion ? 0.1 : defaultSettings.duration,
    }));
  }, [prefersReducedMotion]);

  // Update settings
  const updateSettings = (newSettings: Partial<AnimationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Register an animation for cleanup
  const registerAnimation = (animation: gsap.core.Tween | gsap.core.Timeline) => {
    setAnimations(prev => [...prev, animation]);
    return animation;
  };

  // Clear all animations
  const clearAnimations = () => {
    animations.forEach(animation => {
      if (animation.isActive()) {
        animation.kill();
      }
    });
    setAnimations([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimations();
    };
  }, []);

  return (
    <AnimationContext.Provider
      value={{
        settings,
        updateSettings,
        registerAnimation,
        clearAnimations,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

// Custom hook to use animation context
export const useAnimationContext = () => useContext(AnimationContext);

export default AnimationContext;
