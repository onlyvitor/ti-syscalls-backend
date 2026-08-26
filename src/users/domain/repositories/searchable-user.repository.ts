import { UserRepository } from './user.repository';

export type SortDirection = 'asc' | 'desc';
export type SearchProps<Filter = string> = {
  page?: number;
  perPage?: number;
  sort?: string | null;
  sortDirection?: SortDirection;
  filter?: Filter;
};

export interface SearchableUserRepository<
  SearchParams,
  SearchResult,
> extends UserRepository {
  search(props: SearchParams): Promise<SearchResult>;
}
