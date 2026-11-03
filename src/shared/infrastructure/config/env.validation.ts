export const PERSISTENCE_DRIVERS = ['prisma', 'in-memory'] as const;

export type PersistenceDriver = (typeof PERSISTENCE_DRIVERS)[number];

export type AppEnvironment = Record<string, unknown> & {
  PORT: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PERSISTENCE: PersistenceDriver;
  DATABASE_URL?: string;
};

const DEFAULT_PORT = 3000;
const DEFAULT_JWT_EXPIRES_IN = '1h';
const DEFAULT_PERSISTENCE: PersistenceDriver = 'prisma';
const MYSQL_URL_PREFIX = 'mysql://';

/**
 * Validates the environment at boot time so misconfiguration fails fast
 * instead of surfacing as a runtime error on the first login attempt or
 * database query.
 */
export function validateEnv(config: Record<string, unknown>): AppEnvironment {
  const jwtSecret = readString(config.JWT_SECRET).trim();
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const persistence = readPersistence(config.PERSISTENCE);

  return {
    ...config,
    PORT: readPort(config.PORT),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN:
      readString(config.JWT_EXPIRES_IN).trim() || DEFAULT_JWT_EXPIRES_IN,
    PERSISTENCE: persistence,
    DATABASE_URL: readDatabaseUrl(config.DATABASE_URL, persistence),
  };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readPersistence(value: unknown): PersistenceDriver {
  const raw = readString(value).trim();
  if (raw === '') {
    return DEFAULT_PERSISTENCE;
  }

  if ((PERSISTENCE_DRIVERS as readonly string[]).includes(raw)) {
    return raw as PersistenceDriver;
  }

  throw new Error(
    `PERSISTENCE must be one of: ${PERSISTENCE_DRIVERS.join(', ')}`,
  );
}

function readDatabaseUrl(
  value: unknown,
  persistence: PersistenceDriver,
): string | undefined {
  const url = readString(value).trim();

  if (persistence === 'in-memory') {
    return url || undefined;
  }

  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is required when PERSISTENCE is "prisma"',
    );
  }

  if (!url.startsWith(MYSQL_URL_PREFIX)) {
    throw new Error(
      `DATABASE_URL must be a MySQL connection string starting with ${MYSQL_URL_PREFIX}`,
    );
  }

  return url;
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
