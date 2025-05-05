import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  HStack,
  Badge,
  Collapse,
  useDisclosure,
  CircularProgress,
  CircularProgressLabel
} from '@chakra-ui/react';
import { logger } from '@/utils/logger';
import { useRouter } from 'next/router';

// Można dodać integrację z Sentry lub innym narzędziem monitoringu
// import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetAfterMs?: number; // Automatyczne resetowanie po określonym czasie (ms)
  withRetry?: boolean; // Czy pokazać przycisk ponowienia próby
  withReload?: boolean; // Czy pokazać przycisk przeładowania strony
  withNavigateHome?: boolean; // Czy pokazać przycisk powrotu do strony głównej
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number; // Licznik błędów, aby uniknąć nieskończonej pętli
}

interface ErrorContext {
  route?: string;
  timestamp: number;
  userAgent: string;
  requestId?: string; // Jeśli używamy request_id w aplikacji
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0
  };

  private resetTimeout: NodeJS.Timeout | null = null;

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Zbierz kontekst błędu
    const errorContext: ErrorContext = {
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      requestId: this.getRequestId()
    };

    // Log the error using our structured logger
    logger.error('Uncaught error in component', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      context: errorContext,
      location: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });

    // Wywołaj callback onError, jeśli został przekazany
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // W produkcji wysyłamy do serwisu monitoringu
    if (process.env.NODE_ENV === 'production') {
      // Przykład integracji z Sentry
      // Sentry.captureException(error, {
      //   extra: {
      //     componentStack: errorInfo.componentStack,
      //     ...errorContext
      //   }
      // });
    }

    // Ustaw timer do automatycznego resetowania, jeśli określono resetAfterMs
    if (this.props.resetAfterMs && this.state.errorCount < 3) { // Limit prób resetowania
      this.resetTimeout = setTimeout(() => {
        this.handleReset();
      }, this.props.resetAfterMs);
    }
  }

  private getRequestId(): string | undefined {
    // Implementacja pobierania request_id z kontekstu aplikacji
    // Można to zaimplementować używając React Context API
    return undefined;
  }

  public componentWillUnmount(): void {
    // Wyczyść timeout przy odmontowaniu komponentu
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Jeśli przekazano własny fallback, użyj go
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Domyślny fallback z opcjami konfiguracji
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.handleReset}
          withRetry={this.props.withRetry ?? true}
          withReload={this.props.withReload ?? true}
          withNavigateHome={this.props.withNavigateHome ?? true}
          resetAfterMs={this.props.resetAfterMs}
          errorCount={this.state.errorCount}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  withRetry: boolean;
  withReload: boolean;
  withNavigateHome: boolean;
  resetAfterMs?: number;
  errorCount: number;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  withRetry,
  withReload,
  withNavigateHome,
  resetAfterMs,
  errorCount
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const codeBg = useColorModeValue('gray.50', 'gray.700');
  const codeBorder = useColorModeValue('gray.200', 'gray.600');

  const router = useRouter();
  const { isOpen, onToggle } = useDisclosure();

  // Stan dla odliczania do automatycznego resetu
  const [countdown, setCountdown] = useState<number>(resetAfterMs ? resetAfterMs / 1000 : 0);

  // Efekt dla odliczania
  useEffect(() => {
    if (!resetAfterMs || errorCount >= 3) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resetAfterMs, errorCount]);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleNavigateHome = () => {
    router.push('/');
  };

  const isAutoResetDisabled = errorCount >= 3;

  return (
    <Box
      p={6}
      m={4}
      borderRadius="md"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="md"
      maxWidth="800px"
      mx="auto"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg" color="red.500">
            Coś poszło nie tak
          </Heading>
          {resetAfterMs && errorCount < 3 && (
            <CircularProgress value={(countdown / (resetAfterMs / 1000)) * 100} color="blue.400" size="40px">
              <CircularProgressLabel>{countdown}</CircularProgressLabel>
            </CircularProgress>
          )}
        </HStack>

        <Text>
          Wystąpił błąd podczas renderowania tego komponentu. Nasz zespół został powiadomiony.
          {isAutoResetDisabled && resetAfterMs && (
            <Text as="span" color="orange.500" fontWeight="bold"> Automatyczne odświeżanie zostało wyłączone po wielu próbach.</Text>
          )}
        </Text>

        {error && (
          <Box
            p={3}
            borderRadius="md"
            bg={codeBg}
            borderWidth="1px"
            borderColor={codeBorder}
            overflowX="auto"
          >
            <HStack mb={2} justify="space-between">
              <Badge colorScheme="red">{error.name}</Badge>
              <Button size="xs" onClick={onToggle}>
                {isOpen ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
              </Button>
            </HStack>
            <Text fontFamily="monospace" fontSize="sm">
              {error.message}
            </Text>

            <Collapse in={isOpen} animateOpacity>
              {errorInfo && (
                <Box mt={4} p={2} bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md">
                  <Text fontFamily="monospace" fontSize="xs" whiteSpace="pre-wrap">
                    {errorInfo.componentStack}
                  </Text>
                </Box>
              )}
              {error.stack && (
                <Box mt={2} p={2} bg={useColorModeValue('gray.100', 'gray.600')} borderRadius="md">
                  <Text fontFamily="monospace" fontSize="xs" whiteSpace="pre-wrap">
                    {error.stack}
                  </Text>
                </Box>
              )}
            </Collapse>
          </Box>
        )}

        <HStack spacing={4}>
          {withRetry && (
            <Button colorScheme="blue" onClick={resetError}>
              Spróbuj ponownie
            </Button>
          )}
          {withReload && (
            <Button variant="outline" colorScheme="blue" onClick={handleReload}>
              Odśwież stronę
            </Button>
          )}
          {withNavigateHome && (
            <Button variant="outline" onClick={handleNavigateHome}>
              Wróć do strony głównej
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default ErrorBoundary;