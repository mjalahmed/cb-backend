import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels with colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info;
    
    // Color-coded level indicators
    const levelEmoji: Record<string, string> = {
      error: '❌',
      warn: '⚠️',
      info: '✅',
      http: '🌐',
      debug: '🔍'
    };
    
    const emoji = levelEmoji[info.level] || '📝';
    let log = `${emoji} ${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present (only in development or for errors)
    if (Object.keys(meta).length > 0 && (process.env.NODE_ENV === 'development' || info.level === 'error')) {
      const metaStr = JSON.stringify(meta, null, 2);
      // Truncate very long metadata
      const truncatedMeta = metaStr.length > 500 ? metaStr.substring(0, 500) + '...' : metaStr;
      log += `\n${truncatedMeta}`;
    }
    
    return log;
  })
);

// Format for file output (no colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport with colors
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'debug',
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create stream for Express morgan integration
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;

