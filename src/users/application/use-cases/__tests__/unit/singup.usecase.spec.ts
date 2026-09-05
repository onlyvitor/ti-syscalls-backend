import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SingUpUseCase, SingUpUseCaseInput } from '../../singup.usecase';
import { InMemorySearchableUserRepository } from '../../../../infrastructure/repositories/in-memory-searchable-user.repository';
import { BadRequestException } from '../../../errors/BadRequestExeption.error';
import { User, UserRole } from '../../../../domain/entities/user.entity';
import { BcryptHashProvider } from '../../../../infrastructure/providers/hash-provider/bcrypt.hash.provider';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class FakeHashProvider implements BcryptHashProvider {
  generateHash = jest.fn();
  compareHash = jest.fn();
}

describe('SingUpUseCase Unit Tests', () => {
  let useCase: SingUpUseCase;
  let repository: InMemorySearchableUserRepository;
  let hashProvider: FakeHashProvider;

  beforeEach(() => {
    repository = new InMemorySearchableUserRepository();
    hashProvider = new FakeHashProvider();
    hashProvider.generateHash.mockResolvedValue('hashed-password');
    useCase = new SingUpUseCase(repository, hashProvider);
  });

  const validInput = (): SingUpUseCaseInput => ({
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'securePassword123',
  });

  describe('execute - error cases', () => {
    describe.each([
      ['name', { name: '' }],
      ['email', { email: '' }],
      ['password', { password: '' }],
    ])('when %s is missing', (_field, overrides) => {
      it('should throw BadRequestException', async () => {
        const input = { ...validInput(), ...overrides };

        await expect(useCase.execute(input)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    it('should throw BadRequestException with message and details when fields are missing', async () => {
      const input = { ...validInput(), name: '' };

      await expect(useCase.execute(input)).rejects.toEqual(
        expect.objectContaining({
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
      await repository.insert(User.create(validInput()));

      const input = validInput();

      await expect(useCase.execute(input)).rejects.toEqual(
        expect.objectContaining({
          name: 'BadRequestException',
          message: 'Invalid email',
          details: input,
        }),
      );
    });

    it('should detect an already existing email regardless of casing', async () => {
      await repository.insert(User.create(validInput()));

      const input = { ...validInput(), email: 'JOHN.DOE@EXAMPLE.COM' };

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });
  });

  describe('execute - success cases', () => {
    it('should create a user and return its public representation', async () => {
      const output = await useCase.execute(validInput());

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
      await useCase.execute(validInput());

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
