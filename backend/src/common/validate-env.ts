const REQUIRED_ENV_KEYS = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY',
  'OPENAI_API_KEY',
] as const;

/**
 * Validates that required environment variables are set at startup.
 * Throws with a clear message if any is missing.
 */
export function validateEnv(): void {
  const missing = REQUIRED_ENV_KEYS.filter(
    (key) => !process.env[key] || String(process.env[key]).trim() === '',
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Set them in .env or in the environment before starting the server.',
    );
  }
}
