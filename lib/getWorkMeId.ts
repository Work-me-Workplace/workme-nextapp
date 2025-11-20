/**
 * Re-export server and client functions for convenience
 * Import getWorkMeId from './getWorkMeId.server' in server actions
 * Import getWorkMeIdFromStorage from './getWorkMeId.client' in client components
 */

// Re-export for backward compatibility
export { getWorkMeId } from './getWorkMeId.server'
export { getWorkMeIdFromStorage } from './getWorkMeId.client'

