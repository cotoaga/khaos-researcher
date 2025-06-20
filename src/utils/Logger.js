import winston from 'winston';

export class Logger {
  constructor(component) {
    this.component = component;
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  info(message, ...args) {
    this.winston.info(`[${this.component}] ${message}`, ...args);
  }

  error(message, ...args) {
    this.winston.error(`[${this.component}] ${message}`, ...args);
  }

  warn(message, ...args) {
    this.winston.warn(`[${this.component}] ${message}`, ...args);
  }

  debug(message, ...args) {
    this.winston.debug(`[${this.component}] ${message}`, ...args);
  }
}