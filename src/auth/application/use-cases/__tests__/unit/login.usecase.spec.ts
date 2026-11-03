import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LoginUseCase, LoginUseCaseInput } from '../../login.usecase';
import { InMemorySearchableUserRepository } from 'src/users/infrastructure/repositories/in-memory-searchable-user.repository';
import { User, UserRole } from 'src/users/domain/entities/user.entity';
import { InvalidCredentialsError } from '../../../errors/invalid-credentials.error';
import { HashProvider } from 'src/shared/application/providers/hash.provider';
import {
  AuthTokenPayload,
  TokenProvider,
} from 'src/auth/application/providers/token.provider';
import { Email } from 'src/users/domain/value-objects/email.vo';

class FakeHashProvider implements HashProvider {
  generateHash = jest.fn();
  compareHash = jest.fn();
}

class FakeTokenProvider implements TokenProvider {
  generate = jest.fn();
  verify = jest.fn();
}

describe('LoginUseCase Unit Tests', () => {
  let useCase: LoginUseCase;
  let repository: InMemorySearchableUserRepository;
  let hashProvider: FakeHashProvider;
  let tokenProvider: FakeTokenProvider;
  let user: User;

  beforeEach(async () => {
    repository = new InMemorySearchableUserRepository();
    hashProvider = new FakeHashProvider();
    tokenProvider = new FakeTokenProvider();

    hashProvider.compareHash.mockResolvedValue(true);
    tokenProvider.generate.mockResolvedValue('signed-token');

    useCase = new LoginUseCase(repository, hashProvider, tokenProvider);

    user = User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'stored-password-hash',
      role: UserRole.TECHNICIAN,
    });
    await repository.insert(user);
  });

  const validInput = (): LoginUseCaseInput => ({
    email: 'john.doe@example.com',
    password: 'securePassword123',
  });

  describe('execute - success cases', () => {
    it('should return an access token and the public user representation', async () => {
      const output = await useCase.execute(validInput());

      expect(output).toEqual({
        accessToken: 'signed-token',
        user: {
          id: user.getId(),
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: UserRole.TECHNICIAN,
        },
      });
      expect(output.user).not.toHaveProperty('password');
    });

    it('should find the user by the normalized Email value object', async () => {
      const spy = jest.spyOn(repository, 'findByEmail');

      await useCase.execute({
        ...validInput(),
        email: '  JOHN.DOE@EXAMPLE.COM ',
      });

      expect(spy).toHaveBeenCalledWith(expect.any(Email));
      expect(spy.mock.calls[0][0].valueOf()).toBe('john.doe@example.com');
    });

    it('should compare the provided password with the stored hash', async () => {
      await useCase.execute(validInput());

      expect(hashProvider.compareHash).toHaveBeenCalledWith(
        'securePassword123',
        'stored-password-hash',
      );
    });

    it('should sign the token with the user identity and role', async () => {
      await useCase.execute(validInput());

      expect(tokenProvider.generate).toHaveBeenCalledWith({
        sub: user.getId(),
        email: 'john.doe@example.com',
        role: UserRole.TECHNICIAN,
      } satisfies AuthTokenPayload);
    });
  });

  describe('execute - error cases', () => {
    it('should throw InvalidCredentialsError when the e-mail does not exist', async () => {
      hashProvider.compareHash.mockResolvedValue(false);

      await expect(
        useCase.execute({ ...validInput(), email: 'unknown@example.com' }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError when the password is wrong', async () => {
      hashProvider.compareHash.mockResolvedValue(false);

      await expect(
        useCase.execute({ ...validInput(), password: 'wrong-password' }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should use a generic message to avoid user enumeration', async () => {
      hashProvider.compareHash.mockResolvedValue(false);

      await expect(
        useCase.execute({ ...validInput(), email: 'unknown@example.com' }),
      ).rejects.toEqual(
        expect.objectContaining({
          name: 'InvalidCredentialsError',
          message: 'Invalid email or password',
        }),
      );
    });

    it('should compare against a dummy hash when the user does not exist', async () => {
      await expect(
        useCase.execute({ ...validInput(), email: 'unknown@example.com' }),
      ).rejects.toThrow(InvalidCredentialsError);

      expect(hashProvider.compareHash).toHaveBeenCalledWith(
        'securePassword123',
        expect.stringMatching(/^\$2[aby]\$12\$/),
      );
    });

    it('should not sign a token when authentication fails', async () => {
      hashProvider.compareHash.mockResolvedValue(false);

      await expect(useCase.execute(validInput())).rejects.toThrow(
        InvalidCredentialsError,
      );

      expect(tokenProvider.generate).not.toHaveBeenCalled();
    });

    it('should reject an invalid e-mail format', async () => {
      await expect(
        useCase.execute({ ...validInput(), email: 'not-an-email' }),
      ).rejects.toThrow('Invalid email format: not-an-email');
    });
  });
});
