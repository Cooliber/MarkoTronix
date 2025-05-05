/**
 * Enhanced Logger utility for consistent structured logging across the application
 * Features:
 * - Structured logging with metadata
 * - Request ID tracking for correlation
 * - Log history for debugging
 * - Production mode with remote logging capability
 * - Context enrichment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Base log entry structure
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  sessionId?: string;
  userId?: string;
  component?: string;
  tags?: string[];
  data?: any;
}

// Global context that can be set application-wide
interface LoggerContext {
  requestId?: string;
  sessionId?: string;
  userId?: string;
  component?: string;
  tags?: string[];
  [key: string]: any; // Allow for additional context properties
}

// Remote logging service interface
interface RemoteLoggingService {
  send(entry: LogEntry): Promise<void>;
}

class Logger {
  private static instance: Logger;
  private isProduction: boolean;
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;
  private context: LoggerContext = {};
  private remoteLoggingService?: RemoteLoggingService;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';

    // Generate a session ID for this browser session
    if (typeof window !== 'undefined') {
      this.setSessionId(this.generateSessionId());
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Generate a unique session ID
  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substring(2, 15);
  }

  // Generate a unique request ID
  public generateRequestId(): string {
    return 'req_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
  }

  // Set the remote logging service
  public setRemoteLoggingService(service: RemoteLoggingService): void {
    this.remoteLoggingService = service;
  }

  // Set request ID in the context
  public setRequestId(requestId: string): void {
    this.context.requestId = requestId;
  }

  // Get the current request ID
  public getRequestId(): string | undefined {
    return this.context.requestId;
  }

  // Set session ID in the context
  public setSessionId(sessionId: string): void {
    this.context.sessionId = sessionId;
  }

  // Set user ID in the context
  public setUserId(userId: string): void {
    this.context.userId = userId;
  }

  // Set component name in the context
  public setComponent(component: string): void {
    this.context.component = component;
  }

  // Add tags to the context
  public addTags(tags: string[]): void {
    this.context.tags = [...(this.context.tags || []), ...tags];
  }

  // Set custom context property
  public setContextProperty(key: string, value: any): void {
    this.context[key] = value;
  }

  // Clear all context
  public clearContext(): void {
    this.context = {};
    // Regenerate session ID if in browser
    if (typeof window !== 'undefined') {
      this.setSessionId(this.generateSessionId());
    }
  }

  // Create a structured log entry with context
  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.context.requestId,
      sessionId: this.context.sessionId,
      userId: this.context.userId,
      component: this.context.component,
      tags: this.context.tags,
      data,
    };
  }

  // Store and potentially send log entry
  private storeLogEntry(entry: LogEntry): void {
    // Add to history, maintaining max size
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // In production, send logs to a remote service if configured
    if (this.isProduction && this.remoteLoggingService) {
      this.remoteLoggingService.send(entry).catch(err => {
        console.error('Failed to send log to remote service:', err);
      });
    }
  }

  // Enhanced logging methods with structured data
  public debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, data);
      console.debug(`[DEBUG] [${entry.requestId || '-'}] ${message}`, {
        ...this.context,
        ...data
      });
      this.storeLogEntry(entry);
    }
  }

  public info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data);
    console.info(`[INFO] [${entry.requestId || '-'}] ${message}`, {
      ...this.context,
      ...data
    });
    this.storeLogEntry(entry);
  }

  public warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data);
    console.warn(`[WARN] [${entry.requestId || '-'}] ${message}`, {
      ...this.context,
      ...data
    });
    this.storeLogEntry(entry);
  }

  public error(message: string, error?: any): void {
    const entry = this.createLogEntry('error', message, error);

    // Format error object for better logging
    let formattedError = error;
    if (error instanceof Error) {
      formattedError = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any) // Include any additional properties
      };
    }

    console.error(`[ERROR] [${entry.requestId || '-'}] ${message}`, {
      ...this.context,
      error: formattedError
    });
    this.storeLogEntry(entry);
  }

  // Create a child logger with additional context
  public child(additionalContext: Record<string, any>): Logger {
    const childLogger = Logger.getInstance();

    // Copy all context from parent
    Object.keys(this.context).forEach(key => {
      childLogger.setContextProperty(key, this.context[key]);
    });

    // Add additional context
    Object.keys(additionalContext).forEach(key => {
      childLogger.setContextProperty(key, additionalContext[key]);
    });

    return childLogger;
  }

  // Get log history for debugging
  public getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  // Clear log history
  public clearLogHistory(): void {
    this.logHistory = [];
  }

  // Create a logger specifically for a component
  public forComponent(componentName: string): Logger {
    const componentLogger = this.child({});
    componentLogger.setComponent(componentName);
    return componentLogger;
  }

  // Create a logger for a specific request
  public forRequest(requestId?: string): Logger {
    const requestLogger = this.child({});
    requestLogger.setRequestId(requestId || this.generateRequestId());
    return requestLogger;
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

// React hook for using logger in components
export function useLogger(componentName?: string) {
  if (componentName) {
    return logger.forComponent(componentName);
  }
  return logger;
}

// Create a middleware for Next.js API routes to add request_id
export function loggerMiddleware(req: any, res: any, next: () => void) {
  // Generate or extract request ID
  const requestId = req.headers['x-request-id'] || logger.generateRequestId();

  // Set request ID in response headers
  res.setHeader('X-Request-ID', requestId);

  // Create a request-specific logger
  const requestLogger = logger.forRequest(requestId);

  // Attach logger to request object for use in route handlers
  req.logger = requestLogger;

  // Log request
  requestLogger.info(`API Request: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  // Log response when finished
  res.on('finish', () => {
    requestLogger.info(`API Response: ${res.statusCode}`, {
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime,
      contentLength: res.getHeader('content-length')
    });
  });

  next();
}

export default logger;