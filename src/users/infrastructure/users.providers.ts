import { HashProvider } from 'src/shared/application/providers/hash.provider';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { SearchableUserRepository } from 'src/users/domain/repositories/searchable-user.repository';
import { SignupUseCase } from 'src/users/application/use-cases/signup.usecase';
import { GetUserUseCase } from 'src/users/application/use-cases/getuser.usecase';
import { UpdateUserUseCase } from 'src/users/application/use-cases/update-user.usecase';
import { DeleteUserUseCase } from 'src/users/application/use-cases/delete-user.usecase';
import { SearchUsersUseCase } from 'src/users/application/use-cases/search-users.usecase';
import { BcryptHashProvider } from './providers/hash-provider/bcrypt.hash.provider';
import { InMemorySearchableUserRepository } from './repositories/in-memory-searchable-user.repository';

/**
 * Injection tokens. Repositories and providers are bound by string tokens so
 * the application layer (use cases) stays free of Nest decorators.
 */
export const SEARCHABLE_USER_REPOSITORY = 'SEARCHABLE_USER_REPOSITORY';
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const HASH_PROVIDER = 'HASH_PROVIDER';

const searchableUserRepositoryProvider = {
  provide: SEARCHABLE_USER_REPOSITORY,
  useFactory: (): SearchableUserRepository =>
    new InMemorySearchableUserRepository(),
};

const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useFactory: (searchable: SearchableUserRepository): UserRepository =>
    searchable,
  inject: [SEARCHABLE_USER_REPOSITORY],
};

const hashProviderFactory = {
  provide: HASH_PROVIDER,
  useFactory: (): HashProvider => new BcryptHashProvider(),
};

export const userRepositories = [
  searchableUserRepositoryProvider,
  userRepositoryProvider,
  hashProviderFactory,
];

export const userUseCases = [
  {
    provide: SignupUseCase,
    useFactory: (
      repository: SearchableUserRepository,
      hashProvider: HashProvider,
    ): SignupUseCase => new SignupUseCase(repository, hashProvider),
    inject: [SEARCHABLE_USER_REPOSITORY, HASH_PROVIDER],
  },
  {
    provide: GetUserUseCase,
    useFactory: (repository: UserRepository): GetUserUseCase =>
      new GetUserUseCase(repository),
    inject: [USER_REPOSITORY],
  },
  {
    provide: UpdateUserUseCase,
    useFactory: (repository: UserRepository): UpdateUserUseCase =>
      new UpdateUserUseCase(repository),
    inject: [USER_REPOSITORY],
  },
  {
    provide: DeleteUserUseCase,
    useFactory: (repository: UserRepository): DeleteUserUseCase =>
      new DeleteUserUseCase(repository),
    inject: [USER_REPOSITORY],
  },
  {
    provide: SearchUsersUseCase,
    useFactory: (repository: SearchableUserRepository): SearchUsersUseCase =>
      new SearchUsersUseCase(repository),
    inject: [SEARCHABLE_USER_REPOSITORY],
  },
];
