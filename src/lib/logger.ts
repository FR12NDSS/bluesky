/**
 * Safe logger that avoids leaking internal error details (stack traces, DB
 * schema, IDs) to end users via the browser console in production builds.
 * In development, full details are preserved to aid debugging.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  error(message: string, error?: unknown) {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error(message, error);
    } else {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  },
  warn(message: string, error?: unknown) {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(message, error);
    } else {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  },
};
