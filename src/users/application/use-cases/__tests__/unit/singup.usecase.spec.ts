import { beforeEach, describe, expect, it } from '@jest/globals';
import { SingUpUseCase, SingUpUseCaseInput } from '../../singup.usecase';
import { InMemorySearchableUserRepository } from '../../../../infrastructure/repositories/in-memory-searchable-user.repository';
import { BadRequestException } from '../../../errors/BadRequestExeption.error';
import { User, UserRole } from '../../../../domain/entities/user.entity';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  describe('execute - success cases', () => {
    it('should create a user and return its public representation', async () => {
      const input = validInput();

      const output = await useCase.execute(input);

      expect(output).toEqual({
        id: expect.stringMatching(UUID_REGEX),
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: UserRole.USER,
      });
    });

    it('should default the user role to USER', async () => {
      const output = await useCase.execute(validInput());

      expect(output.role).toBe(UserRole.USER);
    });

    it('should normalize the email by trimming and lowercasing', async () => {
      const input = {
        ...validInput(),
        email: '  JOHN.Doe@Example.COM  ',
      };

      const output = await useCase.execute(input);

      expect(output.email).toBe('john.doe@example.com');
    });

    it('should persist the created user in the repository', async () => {
      const output = await useCase.execute(validInput());

      const persisted = await repository.findById(output.id);

      expect(persisted).not.toBeNull();
      expect(persisted?.getId()).toBe(output.id);
      expect(persisted?.getName()).toBe(output.name);
      expect(persisted?.getEmail()).toBe(output.email);
      expect(persisted?.getRole()).toBe(UserRole.USER);
    });

    it('should insert the user into the repository', async () => {
      const input = validInput();

      await useCase.execute(input);

      const allUsers = await repository.findAll();
      expect(allUsers).toHaveLength(1);
    });

    it('should generate a unique id for each created user', async () => {
      const first = await useCase.execute(validInput());
      const second = await useCase.execute({
        ...validInput(),
        email: 'jane.doe@example.com',
      });

      expect(first.id).not.toBe(second.id);
      expect(second.id).toMatch(UUID_REGEX);
    });
  });
});
