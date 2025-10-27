import 'dotenv/config';

export const CONFIG = Object.freeze({
  TARGET_URL: process.env.TARGET_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NOTIFY_EMAIL: process.env.NOTIFY_EMAIL,
  FROM_EMAIL: process.env.FROM_EMAIL || 'Kopahund Bot <noreply@example.com>',
  USER_AGENT:
    process.env.USER_AGENT || 'Mozilla/5.0 (compatible; kopahund-notifier/1.0)',
});

function assertEnv() {
  const missing = Object.entries(CONFIG)
    .filter(
      ([k, v]) =>
        ['TARGET_URL', 'RESEND_API_KEY', 'NOTIFY_EMAIL', 'FROM_EMAIL'].includes(
          k
        ) && !v
    )
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

assertEnv();
