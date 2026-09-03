export type Pagination = {
  page: number;
  perPage: number;
};

export type SortDirection = 'asc' | 'desc';

export type SearchProps<
  TFilter,
  TSortField extends string = string,
> = Partial<Pagination> & {
  sort?: TSortField | null;
  sortDirection?: SortDirection;
  filter?: TFilter | null;
};

export type PaginatedResult<TEntity> = {
  items: TEntity[];
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
};

export type SearchResultProps<
  TEntity,
  TFilter,
  TSortField extends string = string,
> = Omit<PaginatedResult<TEntity>, 'lastPage'> & {
  sort: TSortField | null;
  sortDirection: SortDirection;
  filter: TFilter | null;
};

export class SearchParams<TFilter, TSortField extends string = string> {
  protected page: number;
  protected perPage: number;
  protected sort: TSortField | null;
  protected sortDirection: SortDirection;
  protected filter: TFilter | null;

  constructor(props: SearchProps<TFilter, TSortField>) {
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

  getSort(): TSortField | null {
    return this.sort;
  }

  getSortDirection(): SortDirection {
    return this.sortDirection;
  }

  getFilter(): TFilter | null {
    return this.filter;
  }

  setPage(page: number): void {
    this.page = SearchParams.normalizePositiveInteger(page, 1);
  }

  setPerPage(perPage: number): void {
    this.perPage = SearchParams.normalizePositiveInteger(perPage, 15);
  }

  setSort(sort: TSortField | null): void {
    this.sort = sort ?? null;
  }

  setSortDirection(sortDirection: SortDirection): void {
    this.sortDirection = sortDirection;
  }

  setFilter(filter: TFilter | null): void {
    this.filter = filter ?? null;
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

export class SearchResult<
  TEntity,
  TFilter,
  TSortField extends string = string,
> implements PaginatedResult<TEntity> {
  readonly items: TEntity[];
  readonly total: number;
  readonly currentPage: number;
  readonly perPage: number;
  readonly lastPage: number;
  readonly sort: TSortField | null;
  readonly sortDirection: SortDirection;
  readonly filter: TFilter | null;

  constructor(props: SearchResultProps<TEntity, TFilter, TSortField>) {
    if (!Number.isInteger(props.perPage) || props.perPage < 1) {
      throw new RangeError('perPage must be a positive integer');
    }
    if (!Number.isInteger(props.total) || props.total < 0) {
      throw new RangeError('total must be a non-negative integer');
    }

    this.items = props.items;
    this.total = props.total;
    this.currentPage =
      Number.isInteger(props.currentPage) && props.currentPage > 0
        ? props.currentPage
        : 1;
    this.perPage = props.perPage;
    this.lastPage = Math.ceil(props.total / props.perPage);
    this.sort = props.sort ?? null;
    this.sortDirection = props.sortDirection ?? 'asc';
    this.filter = props.filter ?? null;
  }
}

export interface SearchableRepository<
  TEntity,
  TFilter,
  TSortField extends string = string,
> {
  readonly sortableFields: readonly TSortField[];
  search(
    params: SearchParams<TFilter, TSortField>,
  ): Promise<SearchResult<TEntity, TFilter, TSortField>>;
}
