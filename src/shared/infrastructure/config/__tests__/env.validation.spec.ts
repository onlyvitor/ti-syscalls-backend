import { describe, expect, it } from '@jest/globals';
import { validateEnv } from '../env.validation';

const databaseUrl = 'mysql://root:secret@127.0.0.1:3306/ti_syscalls';
const baseEnv = { JWT_SECRET: 'super-secret', DATABASE_URL: databaseUrl };

describe('validateEnv Unit Tests', () => {
  it('should require JWT_SECRET', () => {
    expect(() => validateEnv({})).toThrow(
      'JWT_SECRET environment variable is required',
    );
  });

  it('should reject a blank JWT_SECRET', () => {
    expect(() => validateEnv({ JWT_SECRET: '   ' })).toThrow(
      'JWT_SECRET environment variable is required',
    );
  });

  it('should trim the JWT secret', () => {
    const env = validateEnv({ ...baseEnv, JWT_SECRET: '  secret  ' });

    expect(env.JWT_SECRET).toBe('secret');
  });

  it('should default PORT to 3000 and JWT_EXPIRES_IN to 1h', () => {
    const env = validateEnv(baseEnv);

    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('1h');
  });

  it('should parse PORT from a string', () => {
    const env = validateEnv({ ...baseEnv, PORT: '4000' });

    expect(env.PORT).toBe(4000);
  });

  it.each(['0', '65536', 'abc', '3000.5'])(
    'should reject an invalid PORT: %s',
    (port) => {
      expect(() => validateEnv({ ...baseEnv, PORT: port })).toThrow(
        'PORT must be an integer between 1 and 65535',
      );
    },
  );

  it('should accept a custom token expiration', () => {
    const env = validateEnv({ ...baseEnv, JWT_EXPIRES_IN: ' 30m ' });

    expect(env.JWT_EXPIRES_IN).toBe('30m');
  });

  it('should preserve unrelated environment variables', () => {
    const env = validateEnv({ ...baseEnv, NODE_ENV: 'test' });

    expect(env.NODE_ENV).toBe('test');
  });

  describe('persistence', () => {
    it('should default PERSISTENCE to prisma', () => {
      const env = validateEnv(baseEnv);

      expect(env.PERSISTENCE).toBe('prisma');
    });

    it('should require DATABASE_URL when using prisma', () => {
      expect(() => validateEnv({ JWT_SECRET: 'super-secret' })).toThrow(
        'DATABASE_URL environment variable is required when PERSISTENCE is "prisma"',
      );
    });

    it('should reject a non-MySQL DATABASE_URL', () => {
      expect(() =>
        validateEnv({
          ...baseEnv,
          DATABASE_URL: 'postgresql://localhost:5432/app',
        }),
      ).toThrow(
        'DATABASE_URL must be a MySQL connection string starting with mysql://',
      );
    });

    it('should trim DATABASE_URL', () => {
      const env = validateEnv({
        ...baseEnv,
        DATABASE_URL: `  ${databaseUrl}  `,
      });

      expect(env.DATABASE_URL).toBe(databaseUrl);
    });

    it('should accept the in-memory driver without DATABASE_URL', () => {
      const env = validateEnv({
        JWT_SECRET: 'super-secret',
        PERSISTENCE: 'in-memory',
      });

      expect(env.PERSISTENCE).toBe('in-memory');
      expect(env.DATABASE_URL).toBeUndefined();
    });

    it('should keep DATABASE_URL when the in-memory driver provides one', () => {
      const env = validateEnv({
        ...baseEnv,
        PERSISTENCE: 'in-memory',
      });

      expect(env.DATABASE_URL).toBe(databaseUrl);
    });

    it('should reject an unknown persistence driver', () => {
      expect(() => validateEnv({ ...baseEnv, PERSISTENCE: 'sqlite' })).toThrow(
        'PERSISTENCE must be one of: prisma, in-memory',
      );
    });
  });
});
