export type AppEnvironment = Record<string, unknown> & {
  PORT: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
};

const DEFAULT_PORT = 3000;
const DEFAULT_JWT_EXPIRES_IN = '1h';

/**
 * Validates the environment at boot time so misconfiguration fails fast
 * instead of surfacing as a runtime error on the first login attempt.
 */
export function validateEnv(config: Record<string, unknown>): AppEnvironment {
  const jwtSecret = readString(config.JWT_SECRET).trim();
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return {
    ...config,
    PORT: readPort(config.PORT),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN:
      readString(config.JWT_EXPIRES_IN).trim() || DEFAULT_JWT_EXPIRES_IN,
  };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readPort(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}
