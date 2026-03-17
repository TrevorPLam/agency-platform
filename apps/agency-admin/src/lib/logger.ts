interface LogContext {
  [key: string]: unknown
}

function write(level: 'info' | 'warn' | 'error', message: string, context: LogContext): void {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  })

  if (level === 'error') {
    console.error(payload)
    return
  }
  if (level === 'warn') {
    console.warn(payload)
    return
  }
  console.log(payload)
}

export function createRequestLogger(defaultContext: LogContext) {
  return {
    info(message: string, context: LogContext = {}) {
      write('info', message, { ...defaultContext, ...context })
    },
    warn(message: string, context: LogContext = {}) {
      write('warn', message, { ...defaultContext, ...context })
    },
    error(message: string, context: LogContext = {}) {
      write('error', message, { ...defaultContext, ...context })
    },
  }
}
