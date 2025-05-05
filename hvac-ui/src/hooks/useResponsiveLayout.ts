import { useBreakpointValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useMediaQuery, mediaQueries } from './usehooks';

/**
 * Custom hook to determine which layout to use based on screen size
 * and to handle mobile-specific routes
 */
export const useResponsiveLayout = () => {
  // Use Chakra's breakpoint for compatibility with existing code
  const isMobileChakra = useBreakpointValue({ base: true, md: false });
  // Also use our custom hook for more flexibility
  const isMobileMedia = useMediaQuery(mediaQueries.mobile);
  // Prioritize Chakra's value for consistency with the rest of the UI
  const isMobile = isMobileChakra !== undefined ? isMobileChakra : isMobileMedia;

  const router = useRouter();

  // Check if we should redirect to a mobile-specific page
  const checkMobileRedirect = () => {
    // Only redirect if we're on mobile
    if (isMobile) {
      // List of pages that have mobile-specific versions
      const mobileRoutes: { [key: string]: string } = {
        '/dashboard': '/mobile-dashboard',
        // Add more routes as needed
      };

      // Check if current path has a mobile version
      const currentPath = router.pathname;
      if (mobileRoutes[currentPath] && currentPath !== mobileRoutes[currentPath]) {
        router.replace(mobileRoutes[currentPath]);
        return true;
      }
    }

    return false;
  };

  // Determine which layout component to use
  const getLayoutComponent = () => {
    return isMobile ? 'mobile' : 'desktop';
  };

  return {
    isMobile,
    checkMobileRedirect,
    getLayoutComponent,
  };
};

export default useResponsiveLayout;
