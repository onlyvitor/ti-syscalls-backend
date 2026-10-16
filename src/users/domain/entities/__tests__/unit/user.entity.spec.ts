import { User, UserRole } from '../../user.entity';
import { beforeEach, describe, expect, it } from '@jest/globals';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('User Entity Unit Tests', () => {
  let user: User;

  beforeEach(() => {
    user = User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
      role: UserRole.USER,
    });
  });

  describe('constructor / create', () => {
    it('should create a valid user with correct properties', () => {
      expect(user).toBeInstanceOf(User);
      expect(user.getId()).toMatch(UUID_REGEX);
      expect(user.getName()).toBe('John Doe');
      expect(user.getEmail()).toBe('john.doe@example.com');
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.getPassword()).toBe('securePassword123');
    });

    it('should use USER as the default role', () => {
      const createdUser = User.create({
        name: 'Default Role User',
        email: 'default.role@example.com',
        password: 'securePassword123',
      });

      expect(createdUser.getRole()).toBe(UserRole.USER);
    });

    it('should generate a unique UUID for each user instance', () => {
      const anotherUser = User.create({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'securePassword123',
        role: UserRole.USER,
      });

      expect(user.getId()).not.toBe(anotherUser.getId());
      expect(anotherUser.getId()).toMatch(UUID_REGEX);
    });

    it('should trim the name when creating a user', () => {
      const createdUser = User.create({
        name: '   Jane Doe   ',
        email: 'jane.doe@example.com',
        password: 'securePassword123',
        role: UserRole.TECHNICIAN,
      });

      expect(createdUser.getName()).toBe('Jane Doe');
    });

    it('should create a user with different roles', () => {
      const adminUser = User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminPassword',
        role: UserRole.ADMIN,
      });

      expect(adminUser.getRole()).toBe(UserRole.ADMIN);
    });

    it('should throw an error if an invalid email is provided', () => {
      expect(() =>
        User.create({
          name: 'Invalid Email User',
          email: 'invalid-email',
          password: 'password123',
          role: UserRole.USER,
        }),
      ).toThrow('Invalid email format: invalid-email');
    });

    it('should throw an error if an empty name is provided', () => {
      expect(() =>
        User.create({
          name: '   ',
          email: 'empty.name@example.com',
          password: 'password123',
        }),
      ).toThrow('Name cannot be empty');
    });

    it('should throw an error if an empty email is provided', () => {
      expect(() =>
        User.create({
          name: 'Empty Email User',
          email: '   ',
          password: 'password123',
          role: UserRole.USER,
        }),
      ).toThrow('Email cannot be empty');
    });
  });

  describe('getters', () => {
    it('should return the user id as a UUID string with getId()', () => {
      expect(typeof user.getId()).toBe('string');
      expect(user.getId()).toMatch(UUID_REGEX);
    });

    it('should return the user name with getName()', () => {
      expect(user.getName()).toBe('John Doe');
      expect(typeof user.getName()).toBe('string');
    });

    it('should return the user email string with getEmail()', () => {
      expect(user.getEmail()).toBe('john.doe@example.com');
      expect(typeof user.getEmail()).toBe('string');
    });

    it('should return the user role with getRole()', () => {
      expect(user.getRole()).toBe(UserRole.USER);
    });

    it('should expose the stored (hashed) password with getPassword()', () => {
      expect(user.getPassword()).toBe('securePassword123');
      expect(user.getPassword()).not.toBe('otherPassword');
    });
  });

  describe('reconstitute', () => {
    it('should rebuild a user with the persisted identity and data', () => {
      const reconstituted = User.reconstitute({
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Persisted User',
        email: user.getEmail(),
        password: user.getPassword(),
        role: UserRole.ADMIN,
      });

      expect(reconstituted.getId()).toBe(
        '00000000-0000-4000-8000-000000000001',
      );
      expect(reconstituted.getName()).toBe('Persisted User');
      expect(reconstituted.getEmail()).toBe(user.getEmail());
      expect(reconstituted.getPassword()).toBe(user.getPassword());
      expect(reconstituted.getRole()).toBe(UserRole.ADMIN);
    });

    it('should keep the provided identity instead of generating a new one', () => {
      const a = User.reconstitute({
        id: 'identity-1',
        name: 'A',
        email: user.getEmail(),
        password: 'x',
        role: UserRole.USER,
      });
      const b = User.create({
        name: 'B',
        email: 'b@example.com',
        password: 'x',
      });

      expect(a.getId()).toBe('identity-1');
      expect(b.getId()).not.toBe(a.getId());
    });
  });

  describe('updateName', () => {
    it('should update the name successfully', () => {
      user.updateName('New Name');
      expect(user.getName()).toBe('New Name');
    });

    it('should trim the new name upon update', () => {
      user.updateName('   Trimmed Name   ');
      expect(user.getName()).toBe('Trimmed Name');
    });

    it('should throw an error when updating name with an empty string', () => {
      expect(() => user.updateName('')).toThrow('Name cannot be empty');
    });

    it('should throw an error when updating name with whitespace only', () => {
      expect(() => user.updateName('    ')).toThrow('Name cannot be empty');
    });
  });

  describe('updateEmail', () => {
    it('should update the email successfully with a valid email', () => {
      user.updateEmail('new.email@example.com');
      expect(user.getEmail()).toBe('new.email@example.com');
    });

    it('should throw an error when updating email with invalid format', () => {
      expect(() => user.updateEmail('not-an-email')).toThrow(
        'Invalid email format: not-an-email',
      );
    });

    it('should throw an error when updating email with an empty string', () => {
      expect(() => user.updateEmail('   ')).toThrow('Email cannot be empty');
    });
  });

  describe('assignRole', () => {
    it('should assign a new role to the user', () => {
      expect(user.getRole()).toBe(UserRole.USER);

      user.assignRole(UserRole.TECHNICIAN);
      expect(user.getRole()).toBe(UserRole.TECHNICIAN);

      user.assignRole(UserRole.ADMIN);
      expect(user.getRole()).toBe(UserRole.ADMIN);
    });
  });
});
