import { NotFoundException } from '../errors/not-found.error';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { User } from 'src/users/domain/entities/user.entity';

export type DeleteUserUseCaseInput = {
  id: string;
};

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: DeleteUserUseCaseInput): Promise<void> {
    const user: User | null = await this.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundException(input.id);
    }

    await this.userRepository.delete(input.id);
  }
}
