import { UserRepository } from './user.repository';

export interface SearchableUserRepository<
  SearchParams,
  SearchResult,
> extends UserRepository {
  search(props: SearchParams): Promise<SearchResult>;
}
