export const logger = {
  info: (msg: string, data?: any) => {
    if (import.meta.env.DEV) console.log(`[INFO] ${msg}`, data || '');
  },
  warn: (msg: string, data?: any) => {
    if (import.meta.env.DEV) console.warn(`[WARN] ${msg}`, data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error || '');
    // In production, integrate with Sentry or Datadog
  }
};
