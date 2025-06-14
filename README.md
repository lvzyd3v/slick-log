# slick-log

[![npm version](https://badge.fury.io/js/slick-log.svg)](https://badge.fury.io/js/slick-log)
[![npm downloads](https://img.shields.io/npm/dm/slick-log.svg)](https://www.npmjs.com/package/slick-log)
[![license](https://img.shields.io/npm/l/slick-log.svg)](https://github.com/lvzyd3v/slick-log/blob/main/LICENSE)

A simple, yet flexible & powerful logging utility for Node.js applications with beautiful console output and file logging capabilities.


## Installation

```bash
npm install slick-log
```

## Features

- **Beautiful Console Output**: Colorized logs with consistent formatting and timestamps
- **Multiple Log Levels**: DEBUG, INFO, SUCCESS, WARN, ERROR, FATAL
- **File Logging**: Write logs to files with automatic directory creation (disabled by default)
- **Log Rotation**: Automatic file rotation when size limits are reached
- **TypeScript Support**: Full TypeScript definitions included
- **Singleton Pattern**: Consistent logging configuration across your application
- **Async Safe**: Handles concurrent writes properly with promise-based file operations

## Usage

### Quick Start

```typescript
import { Logger, LogLevel } from 'slick-log';

// Simple logging
Logger.info('Application started');
Logger.success('Operation completed successfully');
Logger.warn('This is a warning message');
Logger.error('An error occurred');
Logger.fatal('Critical system failure');
Logger.debug('Debug information');
```

### Console Output

The logger produces beautifully formatted console output with colors and consistent spacing:

```
2024-01-15 14:30:25 ❯❯  INFO  ❯❯ Application started
2024-01-15 14:30:26 ❯❯  SUCC  ❯❯ Operation completed successfully
2024-01-15 14:30:27 ❯❯  WARN  ❯❯ This is a warning message
2024-01-15 14:30:28 ❯❯  EROR  ❯❯ An error occurred
2024-01-15 14:30:29 ❯❯  FATL  ❯❯ Critical system failure
```

### Configure Log Level

```typescript
// Set minimum log level
Logger.setLogLevel(LogLevel.DEBUG);  // Show all logs
Logger.setLogLevel(LogLevel.WARN);   // Show only WARN, ERROR, FATAL

// Check current log level
const currentLevel = Logger.getLogLevel();
```

### File Logging

```typescript
// Enable file logging
Logger.setLogFiles('./logs/app.log', './logs/error.log');

// All logs go to app.log, errors also go to error.log
Logger.info('This goes to console and app.log');
Logger.error('This goes to console, app.log, and error.log');

// Disable file logging
Logger.disableFileLogging();

// Check if file logging is enabled
const isEnabled = Logger.isFileLoggingEnabled();
```

### Log Rotation Configuration

```typescript
// Configure maximum file size (default: 100MB)
Logger.setMaxFileSize(50); // 50MB

// Configure number of rotated files to keep (default: 5)
Logger.setMaxRotatedFiles(10);

// Files will be rotated as: app.log -> app.log.1 -> app.log.2 -> etc.
```

### Advanced Usage

```typescript
// Log complex objects
Logger.info('User data:', { id: 123, name: 'John', active: true });

// Log with multiple arguments
Logger.error('Database connection failed:', error.message, 'Retrying in 5s');

// Wait for all pending file writes to complete
await Logger.waitForWrites();
```

### Complete Example

```typescript
import { Logger, LogLevel } from 'slick-log';

// Configure the logger
Logger.setLogLevel(LogLevel.DEBUG);
Logger.setLogFiles('./logs/app.log', './logs/error.log');
Logger.setMaxFileSize(25); // 25MB files
Logger.setMaxRotatedFiles(7); // Keep 7 rotated files

// Use throughout your application
class UserService {
    async createUser(userData: any) {
        Logger.info('Creating new user:', userData.email);
        
        try {
            // ... user creation logic
            Logger.success('User created successfully:', userData.id);
            return user;
        } catch (error) {
            Logger.error('Failed to create user:', error.message);
            throw error;
        }
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    Logger.info('Shutting down gracefully...');
    await Logger.waitForWrites();
    process.exit(0);
});
```



## API Reference

### Static Methods

#### `Logger.setLogLevel(level: LogLevel)`
Set the minimum log level. Only messages at or above this level will be displayed.

#### `Logger.setLogFiles(logFile: string, errorLogFile: string)`
Enable file logging with separate files for all logs and error logs.
- Creates directories automatically if they don't exist
- Appends an initialization message to both files

#### `Logger.disableFileLogging()`
Disable file logging. Console logging continues normally.

#### `Logger.isFileLoggingEnabled(): boolean`
Check if file logging is currently enabled.

#### `Logger.getLogLevel(): LogLevel`
Get the current minimum log level.

#### `Logger.setMaxFileSize(sizeInMB: number)`
Set the maximum file size before rotation (in megabytes).

#### `Logger.setMaxRotatedFiles(count: number)`
Set the number of rotated log files to keep.

#### `Logger.waitForWrites(): Promise<void>`
Wait for all pending file write operations to complete.

### Logging Methods

#### `Logger.debug(...args: any[])`
Log debug messages (lowest priority).

#### `Logger.info(...args: any[])`
Log informational messages.

#### `Logger.success(...args: any[])`
Log success messages with green formatting.

#### `Logger.warn(...args: any[])`
Log warning messages.

#### `Logger.error(...args: any[])`
Log error messages.

#### `Logger.fatal(...args: any[])`
Log fatal error messages (highest priority).

## File Structure

When file logging is enabled, the logger creates the following structure:

```
logs/
├── app.log              # All log messages
├── app.log.1            # Rotated log file
├── app.log.2            # Older rotated log file
├── error.log            # Error messages only
├── error.log.1          # Rotated error log file
└── error.log.2          # Older rotated error log file
```

## TypeScript Support

`slick-log` is written in TypeScript and includes full type definitions:

```typescript
import { Logger, LogLevel } from 'slick-log';

// LogLevel enum is fully typed
const level: LogLevel = LogLevel.INFO;

// All methods are properly typed
Logger.info('message', { data: 'object' }, 123, true);
```

## Contributing

Contributions are welcome! I appreciate your help in making `slick-log` better.

## License

ISC 