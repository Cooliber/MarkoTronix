import { ReactNode, useEffect, useRef } from 'react';
import { Button, ButtonProps, Box } from '@chakra-ui/react';
import { gsap } from 'gsap';
import { buttonHoverAnimation } from '@/utils/animations';

interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
  hoverEffect?: 'scale' | 'glow' | 'pulse' | 'none';
  clickEffect?: 'ripple' | 'bounce' | 'none';
}

/**
 * An animated button component using GSAP
 */
export default function AnimatedButton({
  children,
  hoverEffect = 'scale',
  clickEffect = 'ripple',
  ...props
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Apply hover animation
  useEffect(() => {
    const button = buttonRef.current;
    if (!button || hoverEffect === 'none') return;
    
    if (hoverEffect === 'scale') {
      // Scale effect
      button.addEventListener('mouseenter', () => {
        gsap.to(button, { scale: 1.05, duration: 0.2, ease: 'power1.out' });
      });
      
      button.addEventListener('mouseleave', () => {
        gsap.to(button, { scale: 1, duration: 0.2, ease: 'power1.in' });
      });
    } else if (hoverEffect === 'glow') {
      // Glow effect
      button.addEventListener('mouseenter', () => {
        gsap.to(button, { 
          boxShadow: '0 0 15px rgba(66, 153, 225, 0.6)', 
          duration: 0.3 
        });
      });
      
      button.addEventListener('mouseleave', () => {
        gsap.to(button, { 
          boxShadow: props.boxShadow as any || 'none',
          duration: 0.3 
        });
      });
    } else if (hoverEffect === 'pulse') {
      // Pulse effect
      let animation: gsap.core.Tween | null = null;
      
      button.addEventListener('mouseenter', () => {
        animation = gsap.to(button, { 
          scale: 1.05, 
          duration: 0.5, 
          repeat: -1, 
          yoyo: true, 
          ease: 'power1.inOut' 
        });
      });
      
      button.addEventListener('mouseleave', () => {
        if (animation) {
          animation.kill();
          gsap.to(button, { scale: 1, duration: 0.2 });
        }
      });
    }
    
    // Cleanup
    return () => {
      button.removeEventListener('mouseenter', () => {});
      button.removeEventListener('mouseleave', () => {});
    };
  }, [hoverEffect, props.boxShadow]);
  
  // Handle click animation
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button || clickEffect === 'none') {
      props.onClick?.(e);
      return;
    }
    
    if (clickEffect === 'ripple') {
      // Create ripple effect
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create ripple element
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.width = '0';
      ripple.style.height = '0';
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      ripple.style.transform = 'translate(-50%, -50%)';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      button.appendChild(ripple);
      
      // Animate ripple
      gsap.to(ripple, {
        width: rect.width * 2,
        height: rect.width * 2,
        opacity: 0,
        duration: 0.6,
        onComplete: () => {
          button.removeChild(ripple);
        },
      });
    } else if (clickEffect === 'bounce') {
      // Bounce effect
      gsap.timeline()
        .to(button, { scale: 0.95, duration: 0.1 })
        .to(button, { scale: 1, duration: 0.2, ease: 'back.out(3)' });
    }
    
    // Call original onClick handler
    props.onClick?.(e);
  };
  
  return (
    <Button
      ref={buttonRef}
      position="relative"
      overflow="hidden"
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}
