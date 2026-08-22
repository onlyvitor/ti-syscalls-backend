import { User, UserRole } from '../../user.entity';
import { describe, it, expect } from '@jest/globals';

describe('User Entity Unit Tests', () => {
  describe('constructor', () => {
    it('should create a valid user with correct properties', () => {
      const userProps = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        role: UserRole.USER,
      };

      const user = User.create(userProps);

      expect(user).toBeInstanceOf(User);
      expect(user.getId()).toBe(userProps.id);
      expect(user.getName()).toBe(userProps.name);
      expect(user.getEmail()).toBe(userProps.email);
      expect(user.getRole()).toBe(userProps.role);
      expect(user.hasPassword(userProps.password)).toBe(true);
      expect(user.hasPassword('wrong-password')).toBe(false);
    });

    it('should trim the name when creating a user', () => {
      const userProps = {
        id: 2,
        name: '   Jane Doe   ',
        email: 'jane.doe@example.com',
        password: 'securePassword123',
        role: UserRole.TECHNICIAN,
      };

      const user = User.create(userProps);

      expect(user.getName()).toBe('Jane Doe');
    });

    it('should create a user with different roles', () => {
      const user = User.create({
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminPassword',
        role: UserRole.ADMIN,
      });

      expect(user.getRole()).toBe(UserRole.ADMIN);
    });

    it('should throw an error if an invalid email is provided', () => {
      const invalidProps = {
        id: 1,
        name: 'Invalid Email User',
        email: 'invalid-email',
        password: 'password123',
        role: UserRole.USER,
      };

      expect(() => User.create(invalidProps)).toThrow(
        'Invalid email format: invalid-email',
      );
    });

    it('should throw an error if an empty email is provided', () => {
      const emptyEmailProps = {
        id: 1,
        name: 'Empty Email User',
        email: '   ',
        password: 'password123',
        role: UserRole.USER,
      };

      expect(() => User.create(emptyEmailProps)).toThrow(
        'Email cannot be empty',
      );
    });
    it('should get the name of the user', () => {
      const userProps = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        role: UserRole.USER,
      };

      const user = User.create(userProps);

      expect(user.getName()).toBe(userProps.name);
    });
  });
});
