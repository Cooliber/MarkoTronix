import { ChakraProvider } from '@chakra-ui/react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider } from '../context/AuthContext';
import theme from '../styles/theme';
import '../styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

function MyApp({ Component, pageProps }: AppProps) {
  // Log page views for analytics in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const logPageView = () => {
        console.log(`Page view: ${window.location.pathname}`);
        // In a real app, you would send this to your analytics service
      };
      
      // Log initial page load
      logPageView();
      
      // Log subsequent page navigations
      const handleRouteChange = (url: string) => {
        logPageView();
      };
      
      // Add event listeners
      window.addEventListener('popstate', logPageView);
      
      // Clean up
      return () => {
        window.removeEventListener('popstate', logPageView);
      };
    }
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary>
        <AuthProvider>
          <Head>
            <title>HVAC CRM</title>
            <meta name="description" content="HVAC CRM System" />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            <link rel="icon" href="/favicon.ico" />
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#3182CE" />
            <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          </Head>
          <Component {...pageProps} />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AuthProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default MyApp;