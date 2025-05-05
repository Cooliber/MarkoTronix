/**
 * Client-side error logging utility
 * In production, this would send errors to a monitoring service like Sentry
 */

interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  source?: string;
  additionalData?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private setupGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.logError({
          message: event.message,
          stack: event.error?.stack,
          source: 'window.onerror',
          url: window.location.href,
        });
        
        // Don't prevent default error handling
        return false;
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason;
        this.logError({
          message: error?.message || 'Unhandled Promise Rejection',
          stack: error?.stack,
          source: 'unhandledrejection',
          url: window.location.href,
        });
      });
    }
  }

  public logError(details: ErrorDetails): void {
    // Always log to console
    console.error('[ErrorLogger]', details.message, details);

    // In production, send to monitoring service
    if (this.isProduction) {
      try {
        // This would be replaced with actual monitoring service code
        // Example: Sentry.captureException(new Error(details.message), { extra: details });
        
        // For now, just log that we would send to monitoring
        console.log('[ErrorLogger] Would send to monitoring service:', details);
        
        // You could also send to your own API endpoint
        // this.sendToApi(details);
      } catch (err) {
        // Fail silently in production, but log in development
        if (!this.isProduction) {
          console.error('[ErrorLogger] Failed to send error to monitoring service:', err);
        }
      }
    }
  }

  private async sendToApi(details: ErrorDetails): Promise<void> {
    try {
      // Example implementation - replace with your actual API endpoint
      const response = await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...details,
          userAgent: navigator.userAgent,
          url: details.url || window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to log error: ${response.statusText}`);
      }
    } catch (err) {
      // Fail silently in production
      if (!this.isProduction) {
        console.error('[ErrorLogger] Failed to send error to API:', err);
      }
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Export helper functions
export function logError(message: string, error?: Error, additionalData?: Record<string, any>): void {
  errorLogger.logError({
    message,
    stack: error?.stack,
    additionalData,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });
}

export default errorLogger;