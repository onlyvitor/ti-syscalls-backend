import { Email } from 'src/users/domain/value-objects/email.vo';
import { BadRequestException } from '../errors/bad-request.error';
import { SearchableUserRepository } from 'src/users/domain/repositories/searchable-user.repository';
import { User } from 'src/users/domain/entities/user.entity';
import { UsersAlreadyExistError } from 'src/users/domain/errors/users-already-exist.error';
import { HashProvider } from 'src/shared/application/providers/hash.provider';
import { OutputUserDto } from 'src/users/presentation/outputuser.dto';
import { toOutputUserDto } from 'src/users/presentation/user-presenter';

export type SignupUseCaseInput = {
  name: string;
  email: string;
  password: string;
};

export class SignupUseCase {
  constructor(
    private readonly userRepository: SearchableUserRepository,
    private readonly hashProvider: HashProvider,
  ) {}

  async execute(input: SignupUseCaseInput): Promise<OutputUserDto> {
    if (!input.name || !input.email || !input.password) {
      throw new BadRequestException('Missing required fields', input);
    }

    const email = Email.create(input.email);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UsersAlreadyExistError(
        `User with email ${email.valueOf()} already exists`,
        input,
      );
    }

    const hashedPassword = await this.hashProvider.generateHash(input.password);
    const user = User.create({
      name: input.name,
      email: email.valueOf(),
      password: hashedPassword,
    });
    await this.userRepository.insert(user);

    return toOutputUserDto(user);
  }
}
