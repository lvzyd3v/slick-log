import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    SUCCESS = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}

class SimpleLogger {
    private static instance: SimpleLogger;
    private logLevel: LogLevel = LogLevel.INFO;
    private logFile?: string;

    private constructor() {}

    public static getInstance(): SimpleLogger {
        if (!SimpleLogger.instance) {
            SimpleLogger.instance = new SimpleLogger();
        }
        return SimpleLogger.instance;
    }

    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    setLogFile(filePath: string): void {
        this.logFile = filePath;
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        return `${timestamp} [${level}] ${message}`;
    }

    private writeToFile(message: string): void {
        if (this.logFile) {
            fs.appendFileSync(this.logFile, message + '\n');
        }
    }

    debug(message: string): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            const formatted = this.formatMessage('DEBUG', message);
            console.log(chalk.gray(formatted));
            this.writeToFile(formatted);
        }
    }

    info(message: string): void {
        if (this.logLevel <= LogLevel.INFO) {
            const formatted = this.formatMessage('INFO', message);
            console.log(chalk.blue(formatted));
            this.writeToFile(formatted);
        }
    }

    success(message: string): void {
        if (this.logLevel <= LogLevel.SUCCESS) {
            const formatted = this.formatMessage('SUCCESS', message);
            console.log(chalk.green(formatted));
            this.writeToFile(formatted);
        }
    }

    warn(message: string): void {
        if (this.logLevel <= LogLevel.WARN) {
            const formatted = this.formatMessage('WARN', message);
            console.log(chalk.yellow(formatted));
            this.writeToFile(formatted);
        }
    }

    error(message: string): void {
        if (this.logLevel <= LogLevel.ERROR) {
            const formatted = this.formatMessage('ERROR', message);
            console.log(chalk.red(formatted));
            this.writeToFile(formatted);
        }
    }

    fatal(message: string): void {
        if (this.logLevel <= LogLevel.FATAL) {
            const formatted = this.formatMessage('FATAL', message);
            console.log(chalk.redBright(formatted));
            this.writeToFile(formatted);
        }
    }
}

export const Logger = SimpleLogger.getInstance();