import { UserRepository } from './user.repository';

export type SortDirection = 'asc' | 'desc';
export type SearchProps<Filter = string | null> = {
  page?: number;
  perPage?: number;
  sort?: string | null;
  sortDirection?: SortDirection;
  filter?: Filter;
};

export type SearchResultProps<User, Filter = string | null> = {
  items: User[];
  total: number;
  currentPage: number;
  perPage: number;
  sort: string | null;
  sortDirection: SortDirection;
  filter: Filter;
};

export class SearchParams {
  protected page: number;
  protected perPage: number;
  protected sort: string | null;
  protected sortDirection: SortDirection;
  protected filter: string | null;

  constructor(props: SearchProps) {
    this.page = SearchParams.normalizePositiveInteger(props.page, 1);
    this.perPage = SearchParams.normalizePositiveInteger(props.perPage, 15);
    this.sort = props.sort ?? null;
    this.sortDirection = props.sortDirection ?? 'asc';
    this.filter = props.filter ?? null;
  }

  getPage(): number {
    return this.page;
  }

  getPerPage(): number {
    return this.perPage;
  }

  getSort(): string | null {
    return this.sort;
  }

  getSortDirection(): SortDirection {
    return this.sortDirection;
  }

  getFilter(): string | null {
    return this.filter;
  }

  setPage(page: number): void {
    this.page = SearchParams.normalizePositiveInteger(page, 1);
  }

  setPerPage(perPage: number): void {
    this.perPage = SearchParams.normalizePositiveInteger(perPage, 15);
  }

  setSort(sort: string | null): void {
    this.sort =
      sort === null || sort === undefined || sort.trim() === '' ? null : sort;
  }

  setSortDirection(sortDirection: SortDirection): void {
    this.sortDirection = sortDirection;
  }

  setFilter(filter: string | null): void {
    this.filter =
      filter === null || filter === undefined || filter.trim() === ''
        ? null
        : filter;
  }

  private static normalizePositiveInteger(
    value: number | null | undefined,
    fallback: number,
  ): number {
    if (
      value === null ||
      value === undefined ||
      !Number.isInteger(value) ||
      value < 1
    ) {
      return fallback;
    }
    return value;
  }
}

export class SearchResult<User, Filter = string | null> {
  readonly items: User[];
  readonly total: number;
  readonly currentPage: number;
  readonly perPage: number;
  readonly lastPage: number;
  readonly sort: string | null;
  readonly sortDirection: SortDirection;
  readonly filter: Filter;

  constructor(props: SearchResultProps<User, Filter>) {
    if (!Number.isInteger(props.perPage) || props.perPage < 1) {
      throw new RangeError('perPage must be a positive integer');
    }
    if (!Number.isInteger(props.total) || props.total < 0) {
      throw new RangeError('total must be a non-negative integer');
    }

    this.items = props.items;
    this.total = props.total;
    this.currentPage = Math.max(1, props.currentPage);
    this.perPage = props.perPage;
    this.lastPage = Math.ceil(props.total / props.perPage);
    this.sort = props.sort ?? null;
    this.sortDirection = props.sortDirection ?? 'asc';
    this.filter = props.filter;
  }
}

export interface SearchableUserRepository<
  User,
  Filter = string | null,
  SearchInput = SearchProps<Filter>,
  SearchOutput = SearchResult<User, Filter>,
> extends UserRepository {
  sortableFields: string[];
  search(props: SearchInput): Promise<SearchOutput>;
}
