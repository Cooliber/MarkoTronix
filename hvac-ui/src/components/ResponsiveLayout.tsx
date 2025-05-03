import { ReactNode, useEffect } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';
import Layout from './Layout';
import MobileLayout from './MobileLayout';
import useResponsiveLayout from '@/hooks/useResponsiveLayout';

interface ResponsiveLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * A responsive layout component that automatically switches between
 * desktop and mobile layouts based on screen size
 */
export default function ResponsiveLayout({
  children,
  title,
  showBackButton = false,
  onBack,
}: ResponsiveLayoutProps) {
  const { isMobile, checkMobileRedirect } = useResponsiveLayout();
  
  // Check if we need to redirect to a mobile-specific page
  useEffect(() => {
    checkMobileRedirect();
  }, [checkMobileRedirect]);
  
  // Render the appropriate layout based on screen size
  if (isMobile) {
    return (
      <MobileLayout title={title} showBackButton={showBackButton} onBack={onBack}>
        {children}
      </MobileLayout>
    );
  }
  
  return <Layout>{children}</Layout>;
}