/**
 * Central runtime configuration (audit fix: hard-coded localhost sweep).
 *
 * A deployment can point the client at a different API host by setting
 * REACT_APP_API_URL in the environment (.env or hosting platform) - no code
 * change required. Everything that needs the server origin derives it here.
 */
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/** Server origin (no /api suffix) for absolute URLs to uploaded files. */
export const SERVER_URL = API_URL.replace(/\/api\/?$/, '');
