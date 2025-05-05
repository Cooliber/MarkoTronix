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
import { Observer } from 'gsap/dist/Observer';
import { TextPlugin } from 'gsap/dist/TextPlugin';

// Import our animation context
import { AnimationProvider } from '@/contexts/AnimationContext';
import PageTransition from '@/components/PageTransition';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(
    ScrollTrigger,
    ScrollToPlugin,
    Draggable,
    MotionPathPlugin,
    Observer,
    TextPlugin
  );
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

  // Refresh ScrollTrigger on route change
  useEffect(() => {
    const handleRouteChangeComplete = () => {
      // Refresh ScrollTrigger to recalculate positions
      if (typeof window !== 'undefined') {
        ScrollTrigger.refresh();
      }
    };

    // Add router event listener
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Cleanup
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  return (
    <ChakraProvider theme={theme}>
      <AnimationProvider>
        <AuthProvider>
          {/* Main content with page transitions */}
          <PageTransition
            mode="fade"
            duration={0.4}
            width="100%"
            height="100%"
          >
            <Component {...pageProps} />
          </PageTransition>
        </AuthProvider>
      </AnimationProvider>
    </ChakraProvider>
  );
}