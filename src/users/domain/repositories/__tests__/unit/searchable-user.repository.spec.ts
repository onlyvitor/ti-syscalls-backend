import { describe, it, expect } from '@jest/globals';
import {
  SearchParams,
  SearchProps,
  SortDirection,
} from '../../searchable-user.repository';

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
