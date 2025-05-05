/**
 * Structured logger for the frontend
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logHistory: LogEntry[] = [];
  private readonly maxHistorySize: number = 100;
  private readonly isProduction: boolean = process.env.NODE_ENV === 'production';

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: Date.now(),
      level,
      message,
      data,
    };
  }

  private storeLogEntry(entry: LogEntry): void {
    // Add to history, maintaining max size
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // In production, you could send logs to a remote service here
    if (this.isProduction) {
      // Example: sendToRemoteLoggingService(entry);
    }
  }

  public debug(message: string, data?: any): void {
    if (!this.isProduction) {
      const entry = this.createLogEntry('debug', message, data);
      console.debug(`[DEBUG] ${message}`, data);
      this.storeLogEntry(entry);
    }
  }

  public info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data);
    console.info(`[INFO] ${message}`, data);
    this.storeLogEntry(entry);
  }

  public warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data);
    console.warn(`[WARN] ${message}`, data);
    this.storeLogEntry(entry);
  }

  public error(message: string, error?: any): void {
    const entry = this.createLogEntry('error', message, error);
    console.error(`[ERROR] ${message}`, error);
    this.storeLogEntry(entry);
  }

  public getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  public clearLogHistory(): void {
    this.logHistory = [];
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

// Export a hook for components to use
export function useLogger() {
  return logger;
}

export default logger;
