/**
 * =============================================================================
 * LIBS LOGGER.JS - Winston Logger Configuration
 * =============================================================================
 * 
 * PURPOSE:
 * This file configures Winston, a versatile logging library for Node.js.
 * It provides structured logging with timestamps, multiple output formats,
 * and file rotation capabilities.
 * 
 * =============================================================================
 * WHY WINSTON INSTEAD OF CONSOLE.LOG:
 * =============================================================================
 * 
 * 1. STRUCTURED OUTPUT
 *    - Timestamps on every log entry
 *    - Log levels (info, warn, error)
 *    - Machine-parseable format for log aggregation
 * 
 * 2. MULTIPLE TRANSPORTS
 *    - Console: Real-time output for development
 *    - File: Persistent logs for debugging and auditing
 *    - Easy to add more (HTTP, databases, etc.)
 * 
 * 3. LOG LEVELS
 *    - error: System failures, security issues
 *    - warn: Deprecations, unusual behavior
 *    - info: Normal operations (registrations, logins)
 *    - debug: Detailed debugging info (disabled in prod)
 * 
 * 4. PRODUCTION READY
 *    - Configurable log levels via environment
 *    - Colorized console output
 *    - File rotation ready (via additional transports)
 * 
 * =============================================================================
 * SECURITY CONSIDERATIONS:
 * =============================================================================
 * 
 * 1. SENSITIVE DATA PROTECTION
 *    - Never log req.body (contains passwords!)
 *    - Never log full JWT tokens
 *    - Never log user passwords or hashes
 * 
 * 2. LOG ROTATION
 *    - Implement log rotation to prevent disk full
 *    - Use winston-daily-rotate-file for production
 * 
 * 3. ACCESS CONTROL
 *    - Log files should have restricted permissions
 *    - Consider storing logs in secure location
 * 
 * =============================================================================
 * LOG LEVELS EXPLAINED:
 * =============================================================================
 * 
 * error (0): Error conditions that need immediate attention
 *   Examples: Database connection failed, unhandled exceptions
 * 
 * warn (1): Warning conditions that should be addressed
 *   Examples: Deprecation warnings, unusual patterns
 * 
 * info (2): General operational information
 *   Examples: User registration, successful login, API requests
 * 
 * verbose (3): Detailed information for debugging
 *   Examples: Function entry/exit, variable states
 * 
 * debug (4): Debug-level information
 *   Examples: Detailed flow tracking (disabled in production)
 * 
 * silly (5): Very detailed tracing (rarely used)
 * 
 * =============================================================================
 * TRANSPORT CONFIGURATION:
 * =============================================================================
 * 
 * CONSOLE TRANSPORT:
 * - Colorized output for readability
 * - Simple format for development
 * - Shows all log levels in dev
 * 
 * ERROR FILE TRANSPORT:
 * - Stores only error-level logs
 * - Filename: logs/error.log
 * - Useful for error monitoring/alerting
 * 
 * COMBINED FILE TRANSPORT:
 * - Stores all log levels
 * - Filename: logs/combined.log
 * - Useful for full audit trail
 * 
 * =============================================================================
 * PRODUCTION CONSIDERATIONS:
 * =============================================================================
 * 
 * 1. LOG_LEVEL environment variable controls verbosity
 *    - Development: "debug" or "info"
 *    - Production: "warn" or "error"
 * 
 * 2. LOG ROTATION
 *    - Add winston-daily-rotate-file for automatic rotation
 *    - Prevents disk space issues
 * 
 * 3. CENTRALIZED LOGGING
 *    - Consider shipping logs to ELK stack, Datadog, etc.
 *    - Enables searching across multiple servers
 */

import winston from "winston";

/**
 * Custom log format for console and file output
 * 
 * FORMAT: "2024-01-15 10:30:45 [INFO]: User logged in"
 * 
 * WHY THIS FORMAT:
 * - Timestamp: When events occurred
 * - Level: Severity of the event
 * - Message: Human-readable description
 * 
 * @param {Object} info - Winston log entry
 * @returns {string} Formatted log string
 */
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

/**
 * Main logger instance
 * 
 * CONFIGURATION:
 * - level: Minimum log level to output (from LOG_LEVEL env or "info")
 * - format: Combined timestamp + custom format
 * - transports: Where logs are sent (console + files)
 * 
 * WHY COMBINE FORMATS:
 * - timestamp(): Adds ISO-like timestamp
 * - logFormat: Custom readable format
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info", // Default to info, override with env
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat,
  ),
  transports: [
    // Console transport for real-time output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Color codes for level
        winston.format.simple(), // Simple combined format
      ),
    }),
    
    // Error-only file transport
    // WHY SEPARATE: Easy to monitor just errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error", // Only errors and above
    }),
    
    // Combined file transport (all levels)
    // WHY COMBINED: Full audit trail
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

export default logger;
