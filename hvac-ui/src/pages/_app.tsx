import { useEffect } from 'react';
import { ChakraProvider, extendTheme, Box } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/context/AuthContext';
import { gsap } from 'gsap';
import '@/styles/globals.css';

// Import GSAP plugins
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';
import { Draggable } from 'gsap/dist/Draggable';
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Draggable, MotionPathPlugin);
}

// Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0080ff',
      600: '#0066cc',
      700: '#004d99',
      800: '#003366',
      900: '#001a33',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  breakpoints: {
    sm: '30em',    // 480px
    md: '48em',    // 768px
    lg: '62em',    // 992px
    xl: '80em',    // 1280px
    '2xl': '96em', // 1536px
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          overflow: 'hidden',
        },
      },
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Set up global page transition animations
  useEffect(() => {
    // Create a timeline for page transitions
    const pageTransition = (completeCallback: () => void) => {
      const tl = gsap.timeline({
        onComplete: completeCallback,
        defaults: { ease: 'power2.inOut' },
      });

      tl.to('#page-transition-overlay', { 
        duration: 0.5, 
        scaleY: 1, 
        transformOrigin: 'bottom', 
      })
      .to('#page-transition-overlay', { 
        duration: 0.5, 
        scaleY: 0, 
        transformOrigin: 'top', 
        delay: 0.1 
      });

      return tl;
    };

    // Handle route change start
    const handleRouteChangeStart = (url: string) => {
      // Don't animate if it's the same route
      if (router.pathname === url) return;
      
      pageTransition(() => {});
    };

    // Handle route change complete
    const handleRouteChangeComplete = () => {
      // Animate content in
      gsap.fromTo(
        '.page-content',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' }
      );
    };

    // Add router event listeners
    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Initial animation for first load
    gsap.fromTo(
      '.page-content',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.2, clearProps: 'all' }
    );

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        {/* Page transition overlay */}
        <Box
          id="page-transition-overlay"
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="brand.500"
          zIndex={9999}
          scaleY={0}
          pointerEvents="none"
        />
        
        {/* Main content */}
        <Box className="page-content">
          <Component {...pageProps} />
        </Box>
      </AuthProvider>
    </ChakraProvider>
  );
}