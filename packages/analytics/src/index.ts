// Client-side analytics exports
export {
  initAnalytics,
  captureEvent,
  identifyUser,
  resetUser,
  getPostHogClient,
} from './client'

// Server-side analytics exports
export {
  captureServerEvent,
  identifyServerUser,
  aliasServerUser,
  flushServerEvents,
  getPostHogServerClient,
  type ServerEventProperties,
} from './server'
