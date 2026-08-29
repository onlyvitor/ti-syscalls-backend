import { beforeEach, describe, it, expect } from '@jest/globals';
import {
  SearchParams,
  SearchResult,
  SearchProps,
  SearchResultProps,
  SortDirection,
} from '../../searchable-user.repository';
import { User, UserRole } from '../../../entities/user.entity';

describe('SearchParams', () => {
  describe('constructor', () => {
    it('should create with all default values when no props are provided', () => {
      const params = new SearchParams({});

      expect(params.getPage()).toBe(1);
      expect(params.getPerPage()).toBe(15);
      expect(params.getSort()).toBeNull();
      expect(params.getSortDirection()).toBe('asc');
      expect(params.getFilter()).toBeNull();
    });

    it('should create with provided values overriding defaults', () => {
      const params = new SearchParams({
        page: 3,
        perPage: 10,
        sort: 'name',
        sortDirection: 'desc',
        filter: 'joh',
      });

      expect(params.getPage()).toBe(3);
      expect(params.getPerPage()).toBe(10);
      expect(params.getSort()).toBe('name');
      expect(params.getSortDirection()).toBe('desc');
      expect(params.getFilter()).toBe('joh');
    });

    it('should apply default page when page is not provided', () => {
      const params = new SearchParams({ perPage: 5 });

      expect(params.getPage()).toBe(1);
      expect(params.getPerPage()).toBe(5);
    });

    it('should apply default perPage when perPage is not provided', () => {
      const params = new SearchParams({ page: 2 });

      expect(params.getPage()).toBe(2);
      expect(params.getPerPage()).toBe(15);
    });

    it('should apply default sort and sortDirection when not provided', () => {
      const params = new SearchParams({ filter: 'joh' });

      expect(params.getSort()).toBeNull();
      expect(params.getSortDirection()).toBe('asc');
      expect(params.getFilter()).toBe('joh');
    });

    it('should apply default filter when filter is not provided', () => {
      const params = new SearchParams({ sort: 'name', sortDirection: 'desc' });

      expect(params.getFilter()).toBeNull();
      expect(params.getSort()).toBe('name');
      expect(params.getSortDirection()).toBe('desc');
    });

    it('should treat explicit null values as defaults', () => {
      const props: SearchProps = {
        page: null as unknown as number,
        perPage: null as unknown as number,
        sort: null,
        sortDirection: null as unknown as SortDirection,
        filter: null,
      };
      const params = new SearchParams(props);

      expect(params.getPage()).toBe(1);
      expect(params.getPerPage()).toBe(15);
      expect(params.getSort()).toBeNull();
      expect(params.getSortDirection()).toBe('asc');
      expect(params.getFilter()).toBeNull();
    });
  });

  describe('getPage', () => {
    it('should return the current page', () => {
      const params = new SearchParams({ page: 4 });

      expect(params.getPage()).toBe(4);
    });
  });

  describe('getPerPage', () => {
    it('should return the current perPage', () => {
      const params = new SearchParams({ perPage: 25 });

      expect(params.getPerPage()).toBe(25);
    });
  });

  describe('getSort', () => {
    it('should return null when no sort is set', () => {
      const params = new SearchParams({});

      expect(params.getSort()).toBeNull();
    });

    it('should return the sort column when set', () => {
      const params = new SearchParams({ sort: 'created_at' });

      expect(params.getSort()).toBe('created_at');
    });
  });

  describe('getSortDirection', () => {
    it('should return asc by default', () => {
      const params = new SearchParams({});

      expect(params.getSortDirection()).toBe('asc');
    });

    it('should return the provided sort direction', () => {
      const params = new SearchParams({ sortDirection: 'desc' });

      expect(params.getSortDirection()).toBe('desc');
    });
  });

  describe('getFilter', () => {
    it('should return null when no filter is set', () => {
      const params = new SearchParams({});

      expect(params.getFilter()).toBeNull();
    });

    it('should return the filter when set', () => {
      const params = new SearchParams({ filter: 'joh' });

      expect(params.getFilter()).toBe('joh');
    });
  });

  describe('setPage', () => {
    it('should update the page', () => {
      const params = new SearchParams({ page: 1 });

      params.setPage(7);

      expect(params.getPage()).toBe(7);
    });
  });

  describe('setPerPage', () => {
    it('should update the perPage', () => {
      const params = new SearchParams({ perPage: 15 });

      params.setPerPage(50);

      expect(params.getPerPage()).toBe(50);
    });
  });

  describe('setSort', () => {
    it('should set a valid sort column', () => {
      const params = new SearchParams({});

      params.setSort('name');

      expect(params.getSort()).toBe('name');
    });

    it('should set null when sort is null', () => {
      const params = new SearchParams({ sort: 'name' });

      params.setSort(null);

      expect(params.getSort()).toBeNull();
    });

    it('should set null when sort is undefined', () => {
      const params = new SearchParams({ sort: 'name' });

      params.setSort(null);

      expect(params.getSort()).toBeNull();
    });

    it('should set null when sort is an empty string', () => {
      const params = new SearchParams({ sort: 'name' });

      params.setSort('');

      expect(params.getSort()).toBeNull();
    });

    it('should set null when sort contains only whitespace', () => {
      const params = new SearchParams({ sort: 'name' });

      params.setSort('   ');

      expect(params.getSort()).toBeNull();
    });

    it('should keep a sort column that has non-whitespace content', () => {
      const params = new SearchParams({});

      params.setSort(' name ');

      expect(params.getSort()).toBe(' name ');
    });
  });

  describe('setSortDirection', () => {
    it('should set the sort direction to asc', () => {
      const params = new SearchParams({ sortDirection: 'desc' });

      params.setSortDirection('asc');

      expect(params.getSortDirection()).toBe('asc');
    });

    it('should set the sort direction to desc', () => {
      const params = new SearchParams({});

      params.setSortDirection('desc');

      expect(params.getSortDirection()).toBe('desc');
    });
  });

  describe('setFilter', () => {
    it('should set a valid filter', () => {
      const params = new SearchParams({});

      params.setFilter('joh');

      expect(params.getFilter()).toBe('joh');
    });

    it('should set null when filter is null', () => {
      const params = new SearchParams({ filter: 'joh' });

      params.setFilter(null);

      expect(params.getFilter()).toBeNull();
    });

    it('should set null when filter is undefined', () => {
      const params = new SearchParams({ filter: 'joh' });

      params.setFilter(null);

      expect(params.getFilter()).toBeNull();
    });

    it('should set null when filter is an empty string', () => {
      const params = new SearchParams({ filter: 'joh' });

      params.setFilter('');

      expect(params.getFilter()).toBeNull();
    });

    it('should set null when filter contains only whitespace', () => {
      const params = new SearchParams({ filter: 'joh' });

      params.setFilter(' \t ');

      expect(params.getFilter()).toBeNull();
    });

    it('should keep a filter that has non-whitespace content', () => {
      const params = new SearchParams({});

      params.setFilter(' joh ');

      expect(params.getFilter()).toBe(' joh ');
    });
  });
});

describe('SearchResult', () => {
  let user: User;
  let baseProps: SearchResultProps<User>;

  beforeEach(() => {
    user = User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
      role: UserRole.USER,
    });
    baseProps = {
      items: [user],
      total: 1,
      currentPage: 1,
      perPage: 15,
      sort: null,
      sortDirection: 'asc',
      filter: null,
    };
  });

  describe('constructor', () => {
    it('should assign all provided props', () => {
      const result = new SearchResult(baseProps);

      expect(result.items).toEqual([user]);
      expect(result.total).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.perPage).toBe(15);
      expect(result.sort).toBeNull();
      expect(result.sortDirection).toBe('asc');
      expect(result.filter).toBeNull();
    });

    it('should keep the exact items array reference', () => {
      const items = [user];
      const result = new SearchResult({ ...baseProps, items });

      expect(result.items).toBe(items);
    });

    it('should assign an empty items array', () => {
      const result = new SearchResult({ ...baseProps, items: [], total: 0 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should assign a non-null filter', () => {
      const result = new SearchResult({ ...baseProps, filter: 'joh' });

      expect(result.filter).toBe('joh');
    });

    it('should assign a non-null sort column', () => {
      const result = new SearchResult({ ...baseProps, sort: 'name' });

      expect(result.sort).toBe('name');
    });

    it('should keep a desc sort direction', () => {
      const result = new SearchResult({
        ...baseProps,
        sortDirection: 'desc',
      });

      expect(result.sortDirection).toBe('desc');
    });
  });

  describe('lastPage (computed)', () => {
    it('should compute lastPage with an exact division', () => {
      const result = new SearchResult({ ...baseProps, total: 30, perPage: 15 });

      expect(result.lastPage).toBe(2);
    });

    it('should round up when total is not a multiple of perPage', () => {
      const result = new SearchResult({ ...baseProps, total: 31, perPage: 15 });

      expect(result.lastPage).toBe(3);
    });

    it('should compute lastPage as 0 when total is 0', () => {
      const result = new SearchResult({ ...baseProps, total: 0 });

      expect(result.lastPage).toBe(0);
    });

    it('should compute lastPage as 1 when total is less than perPage', () => {
      const result = new SearchResult({ ...baseProps, total: 5, perPage: 15 });

      expect(result.lastPage).toBe(1);
    });
  });

  describe('sort (defaulting)', () => {
    it('should default sort to null when null is passed', () => {
      const result = new SearchResult({ ...baseProps, sort: null });

      expect(result.sort).toBeNull();
    });

    it('should default sort to null when undefined is passed', () => {
      const result = new SearchResult({
        ...baseProps,
        sort: undefined as unknown as string,
      });

      expect(result.sort).toBeNull();
    });
  });

  describe('sortDirection (defaulting)', () => {
    it('should default sortDirection to asc when null is passed', () => {
      const result = new SearchResult({
        ...baseProps,
        sortDirection: null as unknown as SortDirection,
      });

      expect(result.sortDirection).toBe('asc');
    });

    it('should default sortDirection to asc when undefined is passed', () => {
      const result = new SearchResult({
        ...baseProps,
        sortDirection: undefined as unknown as SortDirection,
      });

      expect(result.sortDirection).toBe('asc');
    });
  });
});
