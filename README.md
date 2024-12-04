# slick-log

A simple logging utility for Node.js applications.

## Features

- Console logging with colors
- File logging support
- Configurable log levels
- TypeScript support

## Installation

```bash
npm install slick-log
```

## Usage

```typescript
import { Logger, LogLevel } from 'slick-log';

Logger.info('Information message');
Logger.warn('Warning message');
Logger.error('Error message');

// Set log level
Logger.setLogLevel(LogLevel.DEBUG);

// Set log file
Logger.setLogFile('./logs/app.log');
```

## Log Levels

- DEBUG
- INFO
- WARN
- ERROR
- FATAL

## License

ISC 