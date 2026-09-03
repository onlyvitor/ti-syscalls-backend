import {
  SearchableRepository,
  SearchParams as SharedSearchParams,
  SearchProps as SharedSearchProps,
  SearchResult as SharedSearchResult,
  SearchResultProps as SharedSearchResultProps,
  SortDirection,
} from '../../../shared/domain/repositories/searchable-repository';
import { User, UserRole } from '../entities/user.entity';
import { UserRepository } from './user.repository';

export type UserFilter = {
  query?: string;
  name?: string;
  email?: string;
  role?: UserRole;
};

export type UserSortField = 'name' | 'email' | 'role';

export type SearchProps = SharedSearchProps<UserFilter, UserSortField>;

export type SearchResultProps = SharedSearchResultProps<
  User,
  UserFilter,
  UserSortField
>;

export class SearchParams extends SharedSearchParams<
  UserFilter,
  UserSortField
> {
  setSort(sort: UserSortField | null): void {
    super.setSort(
      sort === null || sort === undefined || sort.trim() === '' ? null : sort,
    );
  }
}

export class SearchResult extends SharedSearchResult<
  User,
  UserFilter,
  UserSortField
> {}

export interface SearchableUserRepository
  extends
    UserRepository,
    SearchableRepository<User, UserFilter, UserSortField> {
  search(props: SearchParams): Promise<SearchResult>;
}

export type { SortDirection };
