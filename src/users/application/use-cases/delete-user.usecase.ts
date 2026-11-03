import { ForbiddenError } from 'src/shared/application/errors/forbidden.error';
import { NotFoundException } from '../errors/not-found.error';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { User, UserRole } from 'src/users/domain/entities/user.entity';
import { Actor } from '../types/actor';

export type DeleteUserUseCaseInput = {
  id: string;
  actor: Actor;
};

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: DeleteUserUseCaseInput): Promise<void> {
    if (input.actor.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can delete users');
    }

    const user: User | null = await this.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundException(input.id);
    }

    await this.userRepository.delete(input.id);
  }
}
