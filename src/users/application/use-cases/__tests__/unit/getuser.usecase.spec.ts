import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetUserUseCase, GetUserUseCaseInput } from '../../getuser.usecase';
import { InMemoryUserRepository } from '../../../../infrastructure/repositories/in-memory-user.repository';
import { User, UserRole } from '../../../../domain/entities/user.entity';
import { NotFoundException } from '../../../errors/not-found.error';

describe('GetUserUseCase Unit Tests', () => {
  let useCase: GetUserUseCase;
  let repository: InMemoryUserRepository;
  let user: User;

  beforeEach(async () => {
    repository = new InMemoryUserRepository();
    useCase = new GetUserUseCase(repository);
    user = User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
    });
    await repository.insert(user);
  });

  const validInput = (): GetUserUseCaseInput => ({
    id: user.getId(),
  });

  describe('execute - success cases', () => {
    it('should return the user found by id', async () => {
      const output = await useCase.execute(validInput());

      expect(output.id).toBe(user.getId());
      expect(output.name).toBe(user.getName());
      expect(output.email).toBe(user.getEmail());
      expect(output.role).toBe(user.getRole());
    });

    it('should return a user with the expected data', async () => {
      const output = await useCase.execute(validInput());

      expect(output.id).toBe(user.getId());
      expect(output.name).toBe('John Doe');
      expect(output.email).toBe('john.doe@example.com');
      expect(output.role).toBe(UserRole.USER);
    });

    it('should call the repository findById with the given id', async () => {
      const spy = jest.spyOn(repository, 'findById');
      const input = validInput();

      await useCase.execute(input);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(input.id);
    });

    it('should return the correct user when multiple users are persisted', async () => {
      const other = User.create({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'anotherPassword123',
      });
      await repository.insert(other);

      const output = await useCase.execute({ id: other.getId() });

      expect(output.id).toBe(other.getId());
      expect(output.name).toBe(other.getName());
      expect(output.email).toBe(other.getEmail());
      expect(output.role).toBe(other.getRole());
    });
  });

  describe('execute - error cases', () => {
    it('should throw NotFoundException when the user does not exist', async () => {
      await expect(useCase.execute({ id: 'unknown-id' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException with the expected message', async () => {
      await expect(useCase.execute({ id: 'unknown-id' })).rejects.toEqual(
        expect.objectContaining({
          name: 'NotFoundException',
          message: 'User not found',
        }),
      );
    });

    it('should throw NotFoundException when the repository returns null', async () => {
      const emptyRepository = new InMemoryUserRepository();
      const emptyUseCase = new GetUserUseCase(emptyRepository);

      await expect(emptyUseCase.execute({ id: 'any-id' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for a valid but unknown uuid', async () => {
      const unknownId = '00000000-0000-4000-8000-000000000000';

      await expect(useCase.execute({ id: unknownId })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not call findById more than once when the user is not found', async () => {
      const spy = jest.spyOn(repository, 'findById');

      await expect(useCase.execute({ id: 'unknown-id' })).rejects.toThrow(
        NotFoundException,
      );

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
