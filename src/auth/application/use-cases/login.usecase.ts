import { HashProvider } from 'src/shared/application/providers/hash.provider';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { Email } from 'src/users/domain/value-objects/email.vo';
import { OutputUserDto } from 'src/users/presentation/outputuser.dto';
import { toOutputUserDto } from 'src/users/presentation/user-presenter';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error';
import { TokenProvider } from '../providers/token.provider';

export type LoginUseCaseInput = {
  email: string;
  password: string;
};

export type LoginUseCaseOutput = {
  accessToken: string;
  user: OutputUserDto;
};

/**
 * A valid bcrypt hash used when the e-mail does not exist. Comparing against
 * it keeps the failure path roughly as expensive as the success path.
 */
const DUMMY_PASSWORD_HASH =
  '$2b$12$R1kWJEWY8oDfBY1i46aYGOtkFMC3DgpLrYGVX5jN9PD4GoKb1Q9oS';

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email);
    const passwordHash = user?.getPassword() ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await this.hashProvider.compareHash(
      input.password,
      passwordHash,
    );

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokenProvider.generate({
      sub: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
    });

    return {
      accessToken,
      user: toOutputUserDto(user),
    };
  }
}
