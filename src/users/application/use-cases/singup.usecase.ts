import { Email } from 'src/users/domain/value-objects/email.vo';
import { BadRequestException } from '../errors/BadRequestExeption.error';
import { SearchableUserRepository } from 'src/users/domain/repositories/searchable-user.repository';
import { User } from 'src/users/domain/entities/user.entity';
import { BcryptHashProvider } from 'src/users/infrastructure/providers/hash-provider/bcrypt.hash.provider';

export type SingUpUseCaseInput = {
  name: string;
  email: string;
  password: string;
};

export type SingUpUseCaseOutput = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export class SingUpUseCase {
  constructor(
    private readonly userRepository: SearchableUserRepository,
    private readonly hashProvider: BcryptHashProvider,
  ) {}
  async execute(input: SingUpUseCaseInput): Promise<SingUpUseCaseOutput> {
    if (!input.name || !input.email || !input.password) {
      throw new BadRequestException('Missing required fields', input);
    }
    //create vo email here
    const email = Email.create(input.email);

    if (await this.userRepository.findByEmail(email)) {
      throw new BadRequestException('Invalid email', input);
    }

    //hash password here
    const hashedPassword = await this.hashProvider.generateHash(input.password);
    const user = new User(input.name, email, hashedPassword);
    await this.userRepository.insert(user);

    return {
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
      role: user.getRole(),
    };
  }
}
