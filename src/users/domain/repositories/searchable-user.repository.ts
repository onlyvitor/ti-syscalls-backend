import { UserRepository } from './user.repository';

export type SortDirection = 'asc' | 'desc';
export type SearchProps<Filter = string> = {
  page?: number;
  perPage?: number;
  sort?: string | null;
  sortDirection?: SortDirection;
  filter?: Filter;
};

export class SearchParams {
  protected page: number;
  protected perPage: number;
  protected sort: string | null;
  protected sortDirection: SortDirection;
  protected filter: string | null;

  constructor(props: SearchProps) {
    this.page = props.page ?? 1;
    this.perPage = props.perPage ?? 15;
    this.sort = props.sort ?? null;
    this.sortDirection = props.sortDirection ?? 'asc';
    this.filter = props.filter ?? null;
  }
}

export interface SearchableUserRepository<
  SearchParams,
  SearchResult,
> extends UserRepository {
  search(props: SearchParams): Promise<SearchResult>;
}
