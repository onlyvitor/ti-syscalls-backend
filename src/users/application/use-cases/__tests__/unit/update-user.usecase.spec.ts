import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  UpdateUserUseCase,
  UpdateUserUseCaseInput,
} from '../../update-user.usecase';
import { InMemorySearchableUserRepository } from '../../../../infrastructure/repositories/in-memory-searchable-user.repository';
import { User, UserRole } from '../../../../domain/entities/user.entity';
import { BadRequestException } from '../../../errors/bad-request.error';
import { UsersAlreadyExistError } from '../../../../domain/errors/users-already-exist.error';
import { Email } from '../../../../domain/value-objects/email.vo';

describe('UpdateUserUseCase Unit Tests', () => {
  let useCase: UpdateUserUseCase;
  let repository: InMemorySearchableUserRepository;
  let user: User;

  beforeEach(async () => {
    repository = new InMemorySearchableUserRepository();
    useCase = new UpdateUserUseCase(repository);
    user = User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
    });
    await repository.insert(user);
  });

  const validInput = (
    overrides: Partial<UpdateUserUseCaseInput> = {},
  ): UpdateUserUseCaseInput => ({
    id: user.getId(),
    ...overrides,
  });

  describe('execute - error cases', () => {
    it('should throw NotFoundException when the user does not exist', async () => {
      await expect(
        useCase.execute(validInput({ id: 'unknown-id' })),
      ).rejects.toEqual(
        expect.objectContaining({
          name: 'NotFoundException',
          message: 'User not found',
        }),
      );
    });

    it('should throw BadRequestException when no fields are provided', async () => {
      await expect(useCase.execute(validInput())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include the sent input in the details of the empty-update error', async () => {
      const input = validInput();

      await expect(useCase.execute(input)).rejects.toEqual(
        expect.objectContaining({ details: input }),
      );
    });

    it('should throw an error when the new email is already used by another user', async () => {
      const jane = User.create({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
      });
      await repository.insert(jane);

      await expect(
        useCase.execute(validInput({ email: jane.getEmail() })),
      ).rejects.toThrow(UsersAlreadyExistError);
    });

    it('should not consider the user own current e-mail as a conflict', async () => {
      const output = await useCase.execute(
        validInput({ email: '  JOHN.DOE@EXAMPLE.COM ' }),
      );

      expect(output.email).toBe('john.doe@example.com');
    });

    it('should throw an error when the new email has an invalid format', async () => {
      await expect(
        useCase.execute(validInput({ email: 'not-an-email' })),
      ).rejects.toThrow('Invalid email format: not-an-email');
    });

    it('should throw BadRequestException when the role is invalid', async () => {
      await expect(
        useCase.execute(validInput({ role: 'wizard' as unknown as UserRole })),
      ).rejects.toEqual(
        expect.objectContaining({
          name: 'BadRequestException',
          message: 'Invalid role: wizard',
        }),
      );
    });
  });

  describe('execute - success cases', () => {
    it('should update the name', async () => {
      const output = await useCase.execute(validInput({ name: 'Johnny Doe' }));

      expect(output.name).toBe('Johnny Doe');
    });

    it('should trim the updated name', async () => {
      const output = await useCase.execute(validInput({ name: '  Trimmed  ' }));

      expect(output.name).toBe('Trimmed');
    });

    it('should normalize the updated email', async () => {
      const output = await useCase.execute(
        validInput({ email: ' New.Email@EXAMPLE.com ' }),
      );

      expect(output.email).toBe('new.email@example.com');
    });

    it('should update the role', async () => {
      const output = await useCase.execute(
        validInput({ role: UserRole.TECHNICIAN }),
      );

      expect(output.role).toBe(UserRole.TECHNICIAN);
    });

    it('should not change untouched fields', async () => {
      const before = await repository.findById(user.getId());

      const output = await useCase.execute(validInput({ name: 'Only Name' }));

      expect(output.email).toBe(before?.getEmail());
      expect(output.role).toBe(before?.getRole());
    });

    it('should persist the changes', async () => {
      await useCase.execute(validInput({ name: 'Persisted Name' }));

      const saved = await repository.findById(user.getId());
      expect(saved?.getName()).toBe('Persisted Name');
    });

    it('should return the user output without the password', async () => {
      const output = await useCase.execute(validInput({ name: 'Any Name' }));

      expect(output).toEqual({
        id: user.getId(),
        name: 'Any Name',
        email: user.getEmail(),
        role: user.getRole(),
      });
      expect(output).not.toHaveProperty('password');
    });

    it('should read users through the repository contract by Email VO', async () => {
      const spy = jest.spyOn(repository, 'findByEmail');

      await useCase.execute(validInput({ email: 'spy@example.com' }));

      expect(spy).toHaveBeenCalledWith(expect.any(Email));
    });
  });
});
