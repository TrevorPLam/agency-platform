export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  traceId?: string
  spanId?: string
  service?: string
  component?: string
  [key: string]: unknown
}

function writeLog(level: LogLevel, message: string, context: LogContext = {}): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  const serialized = JSON.stringify(payload)
  if (level === 'error') {
    console.error(serialized)
    return
  }
  if (level === 'warn') {
    console.warn(serialized)
    return
  }
  if (level === 'debug') {
    console.debug(serialized)
    return
  }
  console.log(serialized)
}

export function logInfo(message: string, context: LogContext = {}): void {
  writeLog('info', message, context)
}

export function logWarn(message: string, context: LogContext = {}): void {
  writeLog('warn', message, context)
}

export function logError(message: string, context: LogContext = {}): void {
  writeLog('error', message, context)
}

export function createRequestLogger(defaultContext: LogContext) {
  return {
    info(message: string, context: LogContext = {}) {
      logInfo(message, { ...defaultContext, ...context })
    },
    warn(message: string, context: LogContext = {}) {
      logWarn(message, { ...defaultContext, ...context })
    },
    error(message: string, context: LogContext = {}) {
      logError(message, { ...defaultContext, ...context })
    },
  }
}
