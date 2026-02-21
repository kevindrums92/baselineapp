/**
 * Timezone conversion utilities for notification times.
 * All server-stored times are in UTC; UI displays local times.
 */

/** Convert a local HH:MM string to UTC HH:MM */
export function convertLocalToUTC(timeLocal: string): string {
  const [hours, minutes] = timeLocal.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
}

/** Convert a UTC HH:MM string to local HH:MM */
export function convertUTCToLocal(timeUTC: string): string {
  const [hours, minutes] = timeUTC.split(':').map(Number);
  const now = new Date();
  now.setUTCHours(hours, minutes, 0, 0);
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}
