/**
 * Centralized Logging Utility
 * Environment-aware logging with support for different log levels
 * Production-ready with error tracking integration support
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    enabled: boolean;
    level: LogLevel;
    isDevelopment: boolean;
}

class Logger {
    private config: LoggerConfig;

    constructor() {
        this.config = {
            enabled: import.meta.env.MODE !== 'production',
            level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
            isDevelopment: import.meta.env.DEV,
        };
    }

    /**
     * Log debug messages (only in development)
     */
    debug(message: string, ...args: unknown[]): void {
        if (!this.config.enabled || this.config.level === 'error' || this.config.level === 'warn') {
            return;
        }

        if (this.config.isDevelopment) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Log informational messages
     */
    info(message: string, ...args: unknown[]): void {
        if (!this.config.enabled) {
            return;
        }

        if (this.config.isDevelopment) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }

    /**
     * Log warning messages
     */
    warn(message: string, ...args: unknown[]): void {
        if (!this.config.enabled && this.config.level === 'error') {
            return;
        }

        console.warn(`[WARN] ${message}`, ...args);

        // In production, you could send to error tracking service
        if (!this.config.isDevelopment) {
            this.sendToErrorTracking('warning', message, args);
        }
    }

    /**
     * Log error messages
     */
    error(message: string, error?: Error | unknown, ...args: unknown[]): void {
        console.error(`[ERROR] ${message}`, error, ...args);

        // Always send errors to tracking service in production
        if (!this.config.isDevelopment) {
            this.sendToErrorTracking('error', message, [error, ...args]);
        }
    }

    /**
     * Send logs to error tracking service (e.g., Sentry)
     * Placeholder for future integration
     */
    private sendToErrorTracking(
        _level: 'warning' | 'error',
        _message: string,
        _data: unknown[]
    ): void {
        // TODO: Integrate with Sentry or similar service
        // Example:
        // Sentry.captureMessage(message, {
        //   level,
        //   extra: { data }
        // });
    }

    /**
     * Create a scoped logger with a prefix
     */
    scope(prefix: string): ScopedLogger {
        return new ScopedLogger(this, prefix);
    }
}

/**
 * Scoped logger for specific modules/features
 */
class ScopedLogger {
    constructor(
        private logger: Logger,
        private prefix: string
    ) { }

    debug(message: string, ...args: unknown[]): void {
        this.logger.debug(`[${this.prefix}] ${message}`, ...args);
    }

    info(message: string, ...args: unknown[]): void {
        this.logger.info(`[${this.prefix}] ${message}`, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.logger.warn(`[${this.prefix}] ${message}`, ...args);
    }

    error(message: string, error?: Error | unknown, ...args: unknown[]): void {
        this.logger.error(`[${this.prefix}] ${message}`, error, ...args);
    }
}

// Export singleton instance
export const logger = new Logger();

// Export scoped loggers for common modules
export const authLogger = logger.scope('Auth');
export const apiLogger = logger.scope('API');
export const storageLogger = logger.scope('Storage');
export const dbLogger = logger.scope('Database');
export const uploadLogger = logger.scope('Upload');
