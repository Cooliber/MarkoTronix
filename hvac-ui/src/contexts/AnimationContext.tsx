import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';

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

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: mediaQuery.matches,
        duration: mediaQuery.matches ? 0.1 : defaultSettings.duration,
      }));
    };
    
    // Set initial value
    handleChange();
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

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
