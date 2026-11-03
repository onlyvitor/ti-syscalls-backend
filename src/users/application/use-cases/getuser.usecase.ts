import { ForbiddenError } from 'src/shared/application/errors/forbidden.error';
import { UserRole } from 'src/users/domain/entities/user.entity';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { OutputUserDto } from 'src/users/presentation/outputuser.dto';
import { NotFoundException } from '../errors/not-found.error';
import { Actor } from '../types/actor';

export type GetUserUseCaseInput = {
  id: string;
  actor: Actor;
};

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserUseCaseInput): Promise<OutputUserDto> {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundException(input.id);
    }

    if (input.actor.role === UserRole.USER && input.actor.id !== user.getId()) {
      throw new ForbiddenError('You can only access your own user');
    }

    return {
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
      role: user.getRole(),
    };
  }
}
