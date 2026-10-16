import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { NotFoundException } from '../errors/not-found.error';
import { OutputUserDto } from 'src/users/presentation/outputuser.dto';

export type GetUserUseCaseInput = {
  id: string;
};

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserUseCaseInput): Promise<OutputUserDto> {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundException(input.id);
    }
    return {
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
      role: user.getRole(),
    };
  }
}
