import { UserRepository } from './user.repository';

export interface SearchableUserRepository<
  User,
  SearchParams,
  SearchResult,
> extends UserRepository<User> {
  search(props: SearchParams): Promise<SearchResult>;
}
