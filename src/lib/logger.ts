/**
 * Environment-aware logging utility
 * In development: Full error details for debugging
 * In production: Sanitized logging to prevent info leakage
 */

type LogContext = string;

interface SafeError {
  context: LogContext;
  message: string;
  timestamp: number;
}

/**
 * Safely extracts error message from unknown error type
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
};

/**
 * Log an error with environment-appropriate detail level
 * - Development: Full error object for debugging
 * - Production: Only error message (no stack traces, internal paths, etc.)
 */
export const logError = (context: LogContext, error: unknown): void => {
  if (import.meta.env.DEV) {
    // Development: Full error details for debugging
    console.error(`[${context}]`, error);
  } else {
    // Production: Sanitized logging
    const safeError: SafeError = {
      context,
      message: getErrorMessage(error),
      timestamp: Date.now(),
    };
    console.error(JSON.stringify(safeError));
  }
};

/**
 * Log a warning with environment-appropriate detail level
 */
export const logWarning = (context: LogContext, message: string, data?: unknown): void => {
  if (import.meta.env.DEV) {
    console.warn(`[${context}]`, message, data);
  } else {
    console.warn(JSON.stringify({ context, message, timestamp: Date.now() }));
  }
};

/**
 * Log info (only in development)
 */
export const logInfo = (context: LogContext, message: string, data?: unknown): void => {
  if (import.meta.env.DEV) {
    console.info(`[${context}]`, message, data);
  }
};
