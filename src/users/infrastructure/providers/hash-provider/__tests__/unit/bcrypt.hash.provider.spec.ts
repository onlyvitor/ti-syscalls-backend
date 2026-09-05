import { beforeAll, describe, expect, it } from '@jest/globals';
import { BcryptHashProvider } from '../../bcrypt.hash.provider';

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

describe('BcryptHashProvider Unit Tests', () => {
  let provider: BcryptHashProvider;
  let hashed: string;

  beforeAll(async () => {
    provider = new BcryptHashProvider();
    hashed = await provider.generateHash('password123');
  });

  describe('generateHash', () => {
    it('should return a non-empty string', () => {
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe('');
    });

    it('should generate a valid bcrypt hash', () => {
      expect(hashed).toMatch(BCRYPT_HASH_REGEX);
    });

    it('should use the configured cost factor of 12 rounds', () => {
      expect(hashed).toMatch(/^\$2[aby]\$12\$/);
    });

    it('should generate a unique hash for the same payload', async () => {
      const other = await provider.generateHash('password123');

      expect(other).not.toBe(hashed);
      expect(other).toMatch(BCRYPT_HASH_REGEX);
    });

    it('should generate different hashes for different payloads', async () => {
      const other = await provider.generateHash('different-password');

      expect(other).not.toBe(hashed);
      expect(other).toMatch(BCRYPT_HASH_REGEX);
    });
  });
});
