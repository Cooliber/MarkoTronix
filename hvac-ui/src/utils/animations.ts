import { gsap } from 'gsap';

// Page transition animations
export const pageEnterAnimation = (element: HTMLElement) => {
  const tl = gsap.timeline();

  tl.fromTo(
    element,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
  );

  return tl;
};

export const pageExitAnimation = (element: HTMLElement) => {
  const tl = gsap.timeline();

  tl.to(
    element,
    { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }
  );

  return tl;
};

// Card animations
export const cardEnterAnimation = (element: HTMLElement, delay: number = 0) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 30, scale: 0.95 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      delay,
      ease: 'back.out(1.4)'
    }
  );
};

// List item animations
export const listItemAnimation = (elements: HTMLElement[], stagger: number = 0.05) => {
  return gsap.fromTo(
    elements,
    { opacity: 0, x: -20 },
    {
      opacity: 1,
      x: 0,
      duration: 0.3,
      stagger,
      ease: 'power1.out'
    }
  );
};

// Button hover animation
export const buttonHoverAnimation = (element: HTMLElement) => {
  const originalScale = gsap.getProperty(element, 'scale') as number || 1;

  element.addEventListener('mouseenter', () => {
    gsap.to(element, { scale: originalScale * 1.05, duration: 0.2, ease: 'power1.out' });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, { scale: originalScale, duration: 0.2, ease: 'power1.in' });
  });
};

// Notification animation
export const notificationAnimation = (element: HTMLElement) => {
  const tl = gsap.timeline();

  tl.fromTo(
    element,
    { opacity: 0, y: -50, scale: 0.8 },
    { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
  ).to(
    element,
    { opacity: 0, y: -20, delay: 2.5, duration: 0.3, ease: 'power2.in' }
  );

  return tl;
};

// Dashboard widget animation
export const widgetEnterAnimation = (elements: HTMLElement[], stagger: number = 0.1) => {
  return gsap.fromTo(
    elements,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger,
      ease: 'power2.out'
    }
  );
};

// Progress bar animation
export const progressAnimation = (element: HTMLElement, fromValue: number, toValue: number) => {
  return gsap.fromTo(
    element,
    { width: `${fromValue}%` },
    { width: `${toValue}%`, duration: 1, ease: 'power2.inOut' }
  );
};

// Mobile menu animation
export const mobileMenuOpenAnimation = (element: HTMLElement) => {
  const tl = gsap.timeline();

  tl.fromTo(
    element,
    { opacity: 0, x: '100%' },
    { opacity: 1, x: '0%', duration: 0.3, ease: 'power2.out' }
  );

  return tl;
};

export const mobileMenuCloseAnimation = (element: HTMLElement) => {
  const tl = gsap.timeline();

  tl.to(
    element,
    { opacity: 0, x: '100%', duration: 0.2, ease: 'power2.in' }
  );

  return tl;
};

// Chart animation
export const chartAnimation = (element: HTMLElement) => {
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
  );
};

// Form field focus animation
export const formFieldFocusAnimation = (element: HTMLElement) => {
  element.addEventListener('focus', () => {
    gsap.to(element, { boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.6)', duration: 0.2 });
  });

  element.addEventListener('blur', () => {
    gsap.to(element, { boxShadow: '0 0 0 1px rgba(226, 232, 240, 1)', duration: 0.2 });
  });
};

// Pulse animation (for notifications or alerts)
export const pulseAnimation = (element: HTMLElement, repeat: number = -1) => {
  return gsap.to(
    element,
    {
      scale: 1.05,
      duration: 0.5,
      repeat,
      yoyo: true,
      ease: 'power1.inOut'
    }
  );
};