import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  DeleteUserUseCase,
  DeleteUserUseCaseInput,
} from '../../delete-user.usecase';
import { InMemorySearchableUserRepository } from '../../../../infrastructure/repositories/in-memory-searchable-user.repository';
import { User } from '../../../../domain/entities/user.entity';

describe('DeleteUserUseCase Unit Tests', () => {
  let useCase: DeleteUserUseCase;
  let repository: InMemorySearchableUserRepository;
  let user: User;

  beforeEach(async () => {
    repository = new InMemorySearchableUserRepository();
    useCase = new DeleteUserUseCase(repository);
    user = User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
    });
    await repository.insert(user);
  });

  const validInput = (): DeleteUserUseCaseInput => ({
    id: user.getId(),
  });

  describe('execute - error cases', () => {
    it('should throw NotFoundException when the user does not exist', async () => {
      await expect(useCase.execute({ id: 'unknown-id' })).rejects.toEqual(
        expect.objectContaining({
          name: 'NotFoundException',
          message: 'User not found',
        }),
      );
    });

    it('should include the requested id in the error details', async () => {
      await expect(useCase.execute({ id: 'unknown-id' })).rejects.toEqual(
        expect.objectContaining({ details: 'unknown-id' }),
      );
    });
  });

  describe('execute - success cases', () => {
    it('should remove the persisted user', async () => {
      await useCase.execute(validInput());

      const removed = await repository.findById(user.getId());
      expect(removed).toBeNull();
    });

    it('should not remove users other than the targeted one', async () => {
      const jane = User.create({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
      });
      await repository.insert(jane);

      await useCase.execute(validInput());

      expect(await repository.findById(jane.getId())).not.toBeNull();
    });

    it('should resolve without content', async () => {
      const output = await useCase.execute(validInput());

      expect(output).toBeUndefined();
    });

    it('should call the repository delete once with the id', async () => {
      const spy = jest.spyOn(repository, 'delete');

      await useCase.execute(validInput());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(user.getId());
    });
  });
});
