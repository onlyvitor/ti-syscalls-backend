import {
  SearchableUserRepository,
  SearchParams,
  SearchResult,
  SortDirection,
} from 'src/users/domain/repositories/searchable-user.repository';
import { User } from '../../domain/entities/user.entity';
import { InMemoryUserRepository } from './in-memory-user.repository';

export class InMemorySearchableUserRepository
  extends InMemoryUserRepository
  implements
    SearchableUserRepository<
      User,
      string | null,
      SearchParams,
      SearchResult<User, string | null>
    >
{
  sortableFields: string[] = ['name', 'email', 'role'];

  search(props: SearchParams): Promise<SearchResult<User, string | null>> {
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
      new SearchResult<User, string | null>({
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

  private applyFilter(items: User[], filter: string | null): User[] {
    //if filter is empty return the items as is
    const term = filter?.trim().toLowerCase() ?? '';
    if (term === '') {
      return items;
    }
    //filter the items based on the term in the name or email
    return items.filter(
      (user) =>
        user.getName().toLowerCase().includes(term) ||
        user.getEmail().toLowerCase().includes(term),
    );
  }

  private applySort(
    items: User[],
    sort: string | null,
    sortDirection: SortDirection,
  ): User[] {
    //if sort is empty return the items as is
    const field = sort?.trim() ?? '';
    if (field === '' || !this.sortableFields.includes(field)) {
      return items;
    }
    //sort the items in ascending or descending order based on the sortDirection
    //the [...] operator is used to create a new array so that the original array is not mutated
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

  private getSortValue(user: User, field: string): string {
    // return the value of the field to be sorted
    switch (field) {
      case 'name':
        return user.getName();
      case 'email':
        return user.getEmail();
      case 'role':
        return user.getRole();
      default:
        return '';
    }
  }
}
