import { HashProvider } from 'src/shared/application/providers/hash.provider';
import {
  HASH_PROVIDER,
  USER_REPOSITORY,
} from 'src/users/infrastructure/users.providers';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { LoginUseCase } from '../application/use-cases/login.usecase';
import { TokenProvider } from '../application/providers/token.provider';
import { JwtTokenProvider } from './providers/jwt-token.provider';

export const TOKEN_PROVIDER = 'TOKEN_PROVIDER';

export const tokenProvider = {
  provide: TOKEN_PROVIDER,
  useClass: JwtTokenProvider,
};

export const loginUseCaseProvider = {
  provide: LoginUseCase,
  useFactory: (
    userRepository: UserRepository,
    hashProvider: HashProvider,
    tokenProvider: TokenProvider,
  ): LoginUseCase =>
    new LoginUseCase(userRepository, hashProvider, tokenProvider),
  inject: [USER_REPOSITORY, HASH_PROVIDER, TOKEN_PROVIDER],
};
