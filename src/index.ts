import chalk from 'chalk';
import fs from 'fs';
import util from 'util';
import path from 'path';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    SUCCESS = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5,
}

// Display names for log levels
const LOG_LEVEL_DISPLAY_NAMES: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'DEBG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.SUCCESS]: 'SUCC',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'EROR',
    [LogLevel.FATAL]: 'FATL',
};

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
    private static instance: Logger;
    private logLevel: number = LogLevel.INFO;
    private logFile: string | null = null;
    private errorLogFile: string | null = null;
    private pendingWrites: Promise<void>[] = [];
    private maxFileSize: number = 100 * 1024 * 1024; // 100MB default
    private maxRotatedFiles: number = 5; // Keep 5 rotated files
    private currentFileSize: number = 0;
    private currentErrorFileSize: number = 0;

    private constructor() {
    }

    /**
     * Set the log level for the logger
     * @param level The log level to set
     */
    public static setLogLevel(level: LogLevel): void {
        Logger.getInstance().logLevel = level;
    }

    /**
     * Set log files for output
     * @param logFile Path to main log file
     * @param errorLogFile Path to error log file
     */
    public static setLogFiles(logFile: string, errorLogFile: string): void {
        const instance = Logger.getInstance();
        
        const logDir = path.dirname(logFile);
        const errorLogDir = path.dirname(errorLogFile);
        
        try {
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            
            if (errorLogDir !== logDir && !fs.existsSync(errorLogDir)) {
                fs.mkdirSync(errorLogDir, { recursive: true });
            }
        } catch (error) {
            console.error("Failed to create log directories:", error);
        }
        
        instance.logFile = logFile;
        instance.errorLogFile = errorLogFile;
        
        const initializeFileSize = async (filePath: string, isErrorLog: boolean) => {
            try {
                const stats = await fs.promises.stat(filePath);
                if (isErrorLog) {
                    instance.currentErrorFileSize = stats.size;
                } else {
                    instance.currentFileSize = stats.size;
                }
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                    console.error(`Failed to get size for ${filePath}:`, error);
                }
            }
        };

        initializeFileSize(logFile, false);
        initializeFileSize(errorLogFile, true);
        
        try {
            const initMessage = "\n=== Logger initialized at " + new Date().toISOString() + " ===\n";
            fs.appendFileSync(logFile, initMessage);
            fs.appendFileSync(errorLogFile, initMessage);
        } catch (error) {
            console.error("Failed to write to log files:", error);
        }
    }

    /**
     * Disable file logging (console logging will continue)
     */
    public static disableFileLogging(): void {
        const instance = Logger.getInstance();
        instance.logFile = null;
        instance.errorLogFile = null;
        instance.currentFileSize = 0;
        instance.currentErrorFileSize = 0;
    }

    /**
     * Check if file logging is enabled
     */
    public static isFileLoggingEnabled(): boolean {
        const instance = Logger.getInstance();
        return instance.logFile !== null || instance.errorLogFile !== null;
    }

    /**
     * Get the current log level
     */
    public static getLogLevel(): LogLevel {
        return Logger.getInstance().logLevel;
    }

    /**
     * Wait for all pending writes to complete
     */
    public static async waitForWrites(): Promise<void> {
        const instance = Logger.getInstance();
        if (instance.pendingWrites.length > 0) {
            await Promise.all(instance.pendingWrites);
        }
    }

    /**
     * Log a message to the console and files
     * @param level The log level
     * @param args The message to log
     */
    private static log(level: LogLevel, ...args: any[]): void {
        const instance = Logger.getInstance();
        if (instance.logLevel <= level) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0];
            const levelName = LOG_LEVEL_DISPLAY_NAMES[level];
            const message = util.format(...args);
            
            const timestamp = chalk.gray(`${dateStr} ${timeStr}`);
            const separator = chalk.gray(' ❯❯ ');
            
            const levelWidth = 6;
            let levelLabel;
            let messageText;
            
            const centerText = (text: string, width: number): string => {
                const textLength = text.length;
                const totalPadding = width - textLength;
                const leftPadding = Math.floor(totalPadding / 2);
                const rightPadding = totalPadding - leftPadding;
                return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
            };
            
            const centeredLevelName = centerText(levelName, levelWidth);
            
            switch (level) {
                case LogLevel.DEBUG:
                    levelLabel = chalk.bold.white.bgGray(centeredLevelName);
                    messageText = chalk.gray(message);
                    break;
                case LogLevel.INFO:
                    levelLabel = chalk.bold.white.bgBlue(centeredLevelName);
                    messageText = chalk.blueBright(message);
                    break;
                case LogLevel.SUCCESS:
                    levelLabel = chalk.bold.black.bgGreenBright(centeredLevelName);
                    messageText = chalk.greenBright(message);
                    break;
                case LogLevel.WARN:
                    levelLabel = chalk.bold.black.bgYellow(centeredLevelName);
                    messageText = chalk.yellow(message);
                    break;
                case LogLevel.ERROR:
                    levelLabel = chalk.bold.white.bgRed(centeredLevelName);
                    messageText = chalk.bold.red(message);
                    break;
                case LogLevel.FATAL:
                    levelLabel = chalk.bold.white.bgRedBright(centeredLevelName);
                    messageText = chalk.bold.redBright(message);
                    break;
                default:
                    levelLabel = chalk.bold.white.bgGray(centeredLevelName);
                    messageText = chalk.white(message);
            }
            
            // Assemble the message with consistent formatting across all log levels
            const consoleMessage = `${levelLabel}${separator}${timestamp} ${messageText}`;
            
            // Add decorative borders for ERROR and FATAL levels
            let finalConsoleMessage = consoleMessage;
            if (level >= LogLevel.ERROR) {
                // Get terminal width or default to a reasonable size if not available
                const terminalWidth = process.stdout.columns || 80;
                // Use the smaller of terminal width, message length + padding, or 100
                const borderLength = Math.min(terminalWidth, consoleMessage.length, 100);
                const border = level === LogLevel.FATAL 
                    ? chalk.redBright('━'.repeat(borderLength))
                    : chalk.red('━'.repeat(borderLength));
                finalConsoleMessage = `\n${border}\n${consoleMessage}\n${border}`;
            }
            
            console.log(finalConsoleMessage);
            
            const paddedLevelName = levelName.padEnd(4);
            const fileMessage = `${dateStr} ${timeStr} [${paddedLevelName}] ${message}`;
            
            if (instance.logFile) {
                const writePromise = (async () => {
                    try {
                        await instance.updateFileSize(instance.logFile!, fileMessage);
                        await fs.promises.appendFile(instance.logFile!, fileMessage + '\n');
                    } catch (error) {
                        console.error("Failed to write to log file:", error);
                    }
                })();
                instance.pendingWrites.push(writePromise);
                
                writePromise.finally(() => {
                    const index = instance.pendingWrites.indexOf(writePromise);
                    if (index !== -1) {
                        instance.pendingWrites.splice(index, 1);
                    }
                });
            }
            
            if (level >= LogLevel.ERROR && instance.errorLogFile) {
                const writePromise = (async () => {
                    try {
                        await instance.updateFileSize(instance.errorLogFile!, fileMessage, true);
                        await fs.promises.appendFile(instance.errorLogFile!, fileMessage + '\n');
                    } catch (error) {
                        console.error("Failed to write to error log file:", error);
                    }
                })();
                instance.pendingWrites.push(writePromise);
                
                // Clean up completed writes
                writePromise.finally(() => {
                    const index = instance.pendingWrites.indexOf(writePromise);
                    if (index !== -1) {
                        instance.pendingWrites.splice(index, 1);
                    }
                });
            }
        }
    }

    public static success(...args: any[]): void {
        Logger.log(LogLevel.SUCCESS, ...args);
    }

    public static debug(...args: any[]): void {
        Logger.log(LogLevel.DEBUG, ...args);
    }

    public static info(...args: any[]): void {
        Logger.log(LogLevel.INFO, ...args);
    }

    public static warn(...args: any[]): void {
        Logger.log(LogLevel.WARN, ...args);
    }

    public static error(...args: any[]): void {
        Logger.log(LogLevel.ERROR, ...args);
    }

    public static fatal(...args: any[]): void {
        Logger.log(LogLevel.FATAL, ...args);
    }
    
    private getLevelColor(level: LogLevel): (text: string) => string {
        switch (level) {
            case LogLevel.DEBUG:
                return chalk.blue;
            case LogLevel.INFO:
                return chalk.green;
            case LogLevel.WARN:
                return chalk.yellow;
            case LogLevel.ERROR:
                return chalk.red;
            case LogLevel.FATAL:
                return chalk.bgRed.white;
            default:
                return chalk.white;
        }
    }

    private static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Set the maximum file size before rotation
     * @param sizeInMB Size in megabytes
     */
    public static setMaxFileSize(sizeInMB: number): void {
        Logger.getInstance().maxFileSize = sizeInMB * 1024 * 1024;
    }

    /**
     * Set the maximum number of rotated files to keep
     * @param count Number of rotated files to keep
     */
    public static setMaxRotatedFiles(count: number): void {
        Logger.getInstance().maxRotatedFiles = count;
    }

    private async rotateLogFile(filePath: string, isErrorLog: boolean = false): Promise<void> {
        try {
            const stats = await fs.promises.stat(filePath);
            const currentSize = isErrorLog ? this.currentErrorFileSize : this.currentFileSize;

            if (currentSize >= this.maxFileSize) {
                for (let i = this.maxRotatedFiles - 1; i >= 0; i--) {
                    const oldPath = i === 0 ? filePath : `${filePath}.${i}`;
                    const newPath = `${filePath}.${i + 1}`;

                    try {
                        await fs.promises.access(oldPath);
                        await fs.promises.rename(oldPath, newPath);
                    } catch (error) {
                        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                            throw error;
                        }
                    }
                }

                await fs.promises.truncate(filePath);
                
                if (isErrorLog) {
                    this.currentErrorFileSize = 0;
                } else {
                    this.currentFileSize = 0;
                }

                const rotationMessage = `\n=== Log file rotated at ${new Date().toISOString()} ===\n`;
                await fs.promises.appendFile(filePath, rotationMessage);
            }
        } catch (error) {
            console.error(`Failed to rotate log file ${filePath}:`, error);
        }
    }

    private async updateFileSize(filePath: string, content: string, isErrorLog: boolean = false): Promise<void> {
        const size = Buffer.byteLength(content + '\n', 'utf8');
        if (isErrorLog) {
            this.currentErrorFileSize += size;
        } else {
            this.currentFileSize += size;
        }
        await this.rotateLogFile(filePath, isErrorLog);
    }
}