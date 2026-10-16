import {
  SearchParams,
  SearchProps,
  SearchResult,
  SearchableUserRepository,
} from 'src/users/domain/repositories/searchable-user.repository';

export type SearchUsersUseCaseInput = SearchProps;

export class SearchUsersUseCase {
  constructor(private readonly userRepository: SearchableUserRepository) {}

  async execute(input: SearchUsersUseCaseInput): Promise<SearchResult> {
    const params = new SearchParams(input);

    return this.userRepository.search(params);
  }
}
