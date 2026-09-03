import {
  SearchableUserRepository,
  SearchParams,
  SearchResult,
  SortDirection,
  UserFilter,
  UserSortField,
} from '../../domain/repositories/searchable-user.repository';
import { User } from '../../domain/entities/user.entity';
import { InMemoryUserRepository } from './in-memory-user.repository';

export class InMemorySearchableUserRepository
  extends InMemoryUserRepository
  implements SearchableUserRepository
{
  readonly sortableFields: readonly UserSortField[] = ['name', 'email', 'role'];

  search(props: SearchParams): Promise<SearchResult> {
    const allUsers: User[] = this.getUsers();
    const itemsFiltered = this.applyFilter(allUsers, props.getFilter());
    const itemsSorted = this.applySort(
      itemsFiltered,
      props.getSort(),
      props.getSortDirection(),
    );
    const itemsPaginated = this.applyPaginate(
      itemsSorted,
      props.getPage(),
      props.getPerPage(),
    );

    return Promise.resolve(
      new SearchResult({
        items: itemsPaginated,
        total: itemsFiltered.length,
        currentPage: props.getPage(),
        perPage: props.getPerPage(),
        sort: props.getSort(),
        sortDirection: props.getSortDirection(),
        filter: props.getFilter(),
      }),
    );
  }

  private applyFilter(items: User[], filter: UserFilter | null): User[] {
    if (filter === null) {
      return items;
    }

    const query = this.normalizeFilterValue(filter.query);
    const name = this.normalizeFilterValue(filter.name);
    const email = this.normalizeFilterValue(filter.email);

    return items.filter((user) => {
      const userName = user.getName().toLowerCase();
      const userEmail = user.getEmail().toLowerCase();

      const matchesQuery =
        query === '' || userName.includes(query) || userEmail.includes(query);
      const matchesName = name === '' || userName.includes(name);
      const matchesEmail = email === '' || userEmail.includes(email);
      const matchesRole =
        filter.role === undefined || user.getRole() === filter.role;

      return matchesQuery && matchesName && matchesEmail && matchesRole;
    });
  }

  private applySort(
    items: User[],
    sort: UserSortField | null,
    sortDirection: SortDirection,
  ): User[] {
    const field = sort?.trim() as UserSortField | undefined;
    if (field === undefined || !this.sortableFields.includes(field)) {
      return items;
    }

    return [...items].sort((a, b) => {
      const result = this.getSortValue(a, field).localeCompare(
        this.getSortValue(b, field),
      );
      return sortDirection === 'desc' ? -result : result;
    });
  }

  private applyPaginate(items: User[], page: number, perPage: number): User[] {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }

  private getSortValue(user: User, field: UserSortField): string {
    switch (field) {
      case 'name':
        return user.getName();
      case 'email':
        return user.getEmail();
      case 'role':
        return user.getRole();
    }
  }

  private normalizeFilterValue(value: string | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }
}
