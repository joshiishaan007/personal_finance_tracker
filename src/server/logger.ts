import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // Never let a secret or session credential reach the logs (CLAUDE.md §3.3).
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      '*.authorization',
      '*.cookie',
      '*.token',
      '*.password',
      '*.secret',
      '*.jwt',
      '*.MONGODB_URI',
      '*.GEMINI_API_KEY',
      '*.VAPID_PRIVATE_KEY',
      '*.JWT_SECRET',
    ],
    censor: '[redacted]',
  },
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});
