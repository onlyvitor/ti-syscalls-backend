import { beforeEach, describe, expect, it } from '@jest/globals';
import { InMemoryUserRepository } from '../../in-memory-user.repository';
import { User, UserRole } from '../../../../domain/entities/user.entity';
import { Email } from '../../../../domain/value-objects/email.vo';

describe('InMemoryUserRepository Unit Tests', () => {
  let repository: InMemoryUserRepository;
  let user: User;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    user = User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
      role: UserRole.USER,
    });
  });

  describe('insert', () => {
    it('should insert a user into repository', async () => {
      await repository.insert(user);
      const found = await repository.findById(user.getId());

      expect(found).toEqual(user);
    });

    it('should insert multiple users', async () => {
      const user2 = User.create({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
        role: UserRole.TECHNICIAN,
      });

      await repository.insert(user);
      await repository.insert(user2);

      const allUsers = await repository.findAll();
      expect(allUsers).toHaveLength(2);
      expect(allUsers).toEqual([user, user2]);
    });
  });

  describe('findById', () => {
    it('should return the user when exists', async () => {
      await repository.insert(user);

      const result = await repository.findById(user.getId());
      expect(result).toEqual(user);
    });

    it('should return null when user does not exist', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an empty array when no users are present', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });

    it('should return all users in the repository', async () => {
      const user2 = User.create({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
        role: UserRole.ADMIN,
      });

      await repository.insert(user);
      await repository.insert(user2);

      const result = await repository.findAll();
      expect(result).toHaveLength(2);
      expect(result).toContain(user);
      expect(result).toContain(user2);
    });
  });

  describe('findByEmail', () => {
    it('should return the user when email exists', async () => {
      await repository.insert(user);

      const emailVO = Email.create('john.doe@example.com');
      const result = await repository.findByEmail(emailVO);

      expect(result).toEqual(user);
    });

    it('should return null when email does not exist', async () => {
      const emailVO = Email.create('notfound@example.com');
      const result = await repository.findByEmail(emailVO);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      await repository.insert(user);

      user.updateName('John Updated');
      user.assignRole(UserRole.ADMIN);
      await repository.update(user);

      const updatedUser = await repository.findById(user.getId());
      expect(updatedUser?.getName()).toBe('John Updated');
      expect(updatedUser?.getRole()).toBe(UserRole.ADMIN);
    });

    it('should do nothing when trying to update a non-existing user', async () => {
      const nonExistingUser = User.create({
        name: 'Ghost User',
        email: 'ghost@example.com',
        password: 'ghostPassword123',
      });

      await repository.update(nonExistingUser);

      const allUsers = await repository.findAll();
      expect(allUsers).toHaveLength(0);
      const found = await repository.findById(nonExistingUser.getId());
      expect(found).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing user by id', async () => {
      await repository.insert(user);

      await repository.delete(user.getId());

      const found = await repository.findById(user.getId());
      expect(found).toBeNull();
      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });

    it('should do nothing when deleting a non-existing user id', async () => {
      await repository.insert(user);

      await repository.delete('non-existent-id');

      const all = await repository.findAll();
      expect(all).toHaveLength(1);
    });
  });
});
