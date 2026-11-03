import { describe, expect, it } from '@jest/globals';
import { validateEnv } from '../env.validation';

const baseEnv = { JWT_SECRET: 'super-secret' };

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
    const env = validateEnv({ JWT_SECRET: '  secret  ' });

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
});
