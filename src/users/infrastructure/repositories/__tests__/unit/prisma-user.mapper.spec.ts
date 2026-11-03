import { describe, expect, it } from '@jest/globals';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { User, UserRole } from '../../../../domain/entities/user.entity';
import {
  PrismaUserMapper,
  toDomainRole,
  toPrismaRole,
  UserRow,
} from '../../prisma-user.mapper';

const row = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'John Doe',
  email: 'john.doe@example.com',
  passwordHash: 'stored-hash',
  role: PrismaUserRole.user,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('PrismaUserMapper Unit Tests', () => {
  describe('toDomain', () => {
    it('should map every persisted column to the domain entity', () => {
      const user = PrismaUserMapper.toDomain(row());

      expect(user.getId()).toBe('00000000-0000-4000-8000-000000000001');
      expect(user.getName()).toBe('John Doe');
      expect(user.getEmail()).toBe('john.doe@example.com');
      expect(user.getPassword()).toBe('stored-hash');
      expect(user.getRole()).toBe(UserRole.USER);
    });

    it.each([
      [PrismaUserRole.user, UserRole.USER],
      [PrismaUserRole.technician, UserRole.TECHNICIAN],
      [PrismaUserRole.admin, UserRole.ADMIN],
    ])('should map the %s role to %s', (persisted, expected) => {
      const user = PrismaUserMapper.toDomain(row({ role: persisted }));

      expect(user.getRole()).toBe(expected);
    });

    it('should normalize the persisted e-mail through the value object', () => {
      const user = PrismaUserMapper.toDomain(
        row({ email: '  JOHN.DOE@EXAMPLE.COM ' }),
      );

      expect(user.getEmail()).toBe('john.doe@example.com');
    });
  });

  describe('toPersistence', () => {
    it('should map the domain entity to the persisted payload', () => {
      const user = User.reconstitute({
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'another-hash',
        role: UserRole.TECHNICIAN,
      });

      expect(PrismaUserMapper.toPersistence(user)).toEqual({
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        passwordHash: 'another-hash',
        role: PrismaUserRole.technician,
      });
    });

    it('should rename the password field to passwordHash', () => {
      const user = User.create({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'the-password',
      });

      const payload = PrismaUserMapper.toPersistence(user);

      expect(payload.passwordHash).toBe('the-password');
      expect(payload).not.toHaveProperty('password');
    });

    it('should round-trip a user through both directions', () => {
      const user = User.create({
        name: 'Round Trip',
        email: 'round.trip@example.com',
        password: 'hash-value',
        role: UserRole.ADMIN,
      });

      const restored = PrismaUserMapper.toDomain({
        ...PrismaUserMapper.toPersistence(user),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(restored.getId()).toBe(user.getId());
      expect(restored.getName()).toBe(user.getName());
      expect(restored.getEmail()).toBe(user.getEmail());
      expect(restored.getPassword()).toBe(user.getPassword());
      expect(restored.getRole()).toBe(user.getRole());
    });
  });

  describe('role converters', () => {
    it('should convert both directions for every role', () => {
      expect(toDomainRole(toPrismaRole(UserRole.USER))).toBe(UserRole.USER);
      expect(toDomainRole(toPrismaRole(UserRole.TECHNICIAN))).toBe(
        UserRole.TECHNICIAN,
      );
      expect(toDomainRole(toPrismaRole(UserRole.ADMIN))).toBe(UserRole.ADMIN);
    });
  });
});
