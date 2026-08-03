import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * pino-pretty runs in a worker thread (thread-stream). Next.js webpack bundling
 * breaks that worker path — do not enable pretty transport inside Next.js.
 */
const canUsePrettyTransport =
  isDev &&
  process.env.PINO_PRETTY === 'true' &&
  !process.env.NEXT_RUNTIME

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'snapforge', env: process.env.NODE_ENV || 'development' },
  ...(canUsePrettyTransport && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname,service,env',
      },
    },
  }),
})
