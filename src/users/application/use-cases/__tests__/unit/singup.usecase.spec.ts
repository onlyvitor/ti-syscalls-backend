import { beforeEach, describe, expect, it } from '@jest/globals';
import { SingUpUseCase, SingUpUseCaseInput } from '../../singup.usecase';
import { InMemorySearchableUserRepository } from '../../../../infrastructure/repositories/in-memory-searchable-user.repository';
import { BadRequestException } from '../../../errors/BadRequestExeption.error';
import { User } from '../../../../domain/entities/user.entity';

describe('SingUpUseCase Unit Tests', () => {
  let useCase: SingUpUseCase;
  let repository: InMemorySearchableUserRepository;

  beforeEach(() => {
    repository = new InMemorySearchableUserRepository();
    useCase = new SingUpUseCase(repository);
  });

  const validInput = (): SingUpUseCaseInput => ({
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'securePassword123',
  });

  describe('execute - error cases', () => {
    it('should throw BadRequestException when name is missing', async () => {
      const input = { ...validInput(), name: '' };

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when email is missing', async () => {
      const input = { ...validInput(), email: '' };

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when password is missing', async () => {
      const input = { ...validInput(), password: '' };

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with message and details when fields are missing', async () => {
      const input = { ...validInput(), name: '' };

      await expect(useCase.execute(input)).rejects.toEqual(
        expect.objectContaining<Partial<BadRequestException>>({
          name: 'BadRequestException',
          message: 'Missing required fields',
          details: input,
        }),
      );
    });

    it('should throw an error when email has an invalid format', async () => {
      const input = { ...validInput(), email: 'invalid-email' };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Invalid email format: invalid-email',
      );
    });

    it('should throw an error when email is empty after trimming', async () => {
      const input = { ...validInput(), email: '   ' };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Email cannot be empty',
      );
    });

    it('should throw BadRequestException when email already exists', async () => {
      const existingUser = User.create(validInput());
      await repository.insert(existingUser);

      const input = validInput();

      await expect(useCase.execute(input)).rejects.toEqual(
        expect.objectContaining<Partial<BadRequestException>>({
          name: 'BadRequestException',
          message: 'Invalid email',
          details: input,
        }),
      );
    });

    it('should detect an already existing email regardless of casing', async () => {
      const existingUser = User.create(validInput());
      await repository.insert(existingUser);

      const input = { ...validInput(), email: 'JOHN.DOE@EXAMPLE.COM' };

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });
  });
});
