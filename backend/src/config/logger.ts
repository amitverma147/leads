import winston from 'winston';

const { combine, timestamp, errors, colorize, printf, json } = winston.format;

const isDevelopment = process.env['NODE_ENV'] !== 'production';

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: isDevelopment ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
});

export default logger;

export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
