import { User, UserRole } from '../../user.entity';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('User Entity Unit Tests', () => {
  let user: User;

  beforeEach(() => {
    user = User.create({
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
      role: UserRole.USER,
    });
  });

  describe('constructor / create', () => {
    it('should create a valid user with correct properties', () => {
      expect(user).toBeInstanceOf(User);
      expect(user.getId()).toBe(1);
      expect(user.getName()).toBe('John Doe');
      expect(user.getEmail()).toBe('john.doe@example.com');
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.hasPassword('securePassword123')).toBe(true);
      expect(user.hasPassword('wrong-password')).toBe(false);
    });

    it('should trim the name when creating a user', () => {
      const createdUser = User.create({
        id: 2,
        name: '   Jane Doe   ',
        email: 'jane.doe@example.com',
        password: 'securePassword123',
        role: UserRole.TECHNICIAN,
      });

      expect(createdUser.getName()).toBe('Jane Doe');
    });

    it('should create a user with different roles', () => {
      const adminUser = User.create({
        id: 3,
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
          id: 4,
          name: 'Invalid Email User',
          email: 'invalid-email',
          password: 'password123',
          role: UserRole.USER,
        }),
      ).toThrow('Invalid email format: invalid-email');
    });

    it('should throw an error if an empty email is provided', () => {
      expect(() =>
        User.create({
          id: 5,
          name: 'Empty Email User',
          email: '   ',
          password: 'password123',
          role: UserRole.USER,
        }),
      ).toThrow('Email cannot be empty');
    });
  });

  describe('getters', () => {
    it('should return the user id with getId()', () => {
      expect(user.getId()).toBe(1);
      expect(typeof user.getId()).toBe('number');
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

    it('should validate password correctly with hasPassword()', () => {
      expect(user.hasPassword('securePassword123')).toBe(true);
      expect(user.hasPassword('otherPassword')).toBe(false);
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
