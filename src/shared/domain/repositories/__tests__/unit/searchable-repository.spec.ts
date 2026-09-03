import { describe, expect, it } from '@jest/globals';
import { SearchParams, SearchResult } from '../../searchable-repository';

type ExampleFilter = {
  name?: string;
};

type ExampleSort = 'name' | 'createdAt';

describe('SearchParams', () => {
  it('should use pagination and ordering defaults', () => {
    const params = new SearchParams<ExampleFilter, ExampleSort>({});

    expect(params.getPage()).toBe(1);
    expect(params.getPerPage()).toBe(15);
    expect(params.getSort()).toBeNull();
    expect(params.getSortDirection()).toBe('asc');
    expect(params.getFilter()).toBeNull();
  });

  it('should keep typed filter and ordering values', () => {
    const filter = { name: 'John' };
    const params = new SearchParams<ExampleFilter, ExampleSort>({
      page: 2,
      perPage: 10,
      sort: 'createdAt',
      sortDirection: 'desc',
      filter,
    });

    expect(params.getPage()).toBe(2);
    expect(params.getPerPage()).toBe(10);
    expect(params.getSort()).toBe('createdAt');
    expect(params.getSortDirection()).toBe('desc');
    expect(params.getFilter()).toBe(filter);
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['fractional', 1.5],
    ['NaN', Number.NaN],
  ])('should normalize a %s page and perPage', (_, invalidValue) => {
    const params = new SearchParams<ExampleFilter>({
      page: invalidValue,
      perPage: invalidValue,
    });

    expect(params.getPage()).toBe(1);
    expect(params.getPerPage()).toBe(15);
  });

  it('should update pagination, ordering and filter values', () => {
    const params = new SearchParams<ExampleFilter, ExampleSort>({});
    const filter = { name: 'Jane' };

    params.setPage(3);
    params.setPerPage(5);
    params.setSort('name');
    params.setSortDirection('desc');
    params.setFilter(filter);

    expect(params.getPage()).toBe(3);
    expect(params.getPerPage()).toBe(5);
    expect(params.getSort()).toBe('name');
    expect(params.getSortDirection()).toBe('desc');
    expect(params.getFilter()).toBe(filter);
  });

  it('should normalize nullish ordering and filter values', () => {
    const params = new SearchParams<ExampleFilter, ExampleSort>({
      sort: 'name',
      filter: { name: 'John' },
    });

    params.setSort(undefined as unknown as null);
    params.setFilter(undefined as unknown as null);

    expect(params.getSort()).toBeNull();
    expect(params.getFilter()).toBeNull();
  });
});

describe('SearchResult', () => {
  it('should expose pagination, ordering and filter metadata', () => {
    const filter = { name: 'John' };
    const result = new SearchResult<string, ExampleFilter, ExampleSort>({
      items: ['John'],
      total: 21,
      currentPage: 2,
      perPage: 10,
      sort: 'name',
      sortDirection: 'desc',
      filter,
    });

    expect(result.items).toEqual(['John']);
    expect(result.total).toBe(21);
    expect(result.currentPage).toBe(2);
    expect(result.perPage).toBe(10);
    expect(result.lastPage).toBe(3);
    expect(result.sort).toBe('name');
    expect(result.sortDirection).toBe('desc');
    expect(result.filter).toBe(filter);
  });

  it('should report zero pages when there are no results', () => {
    const result = new SearchResult<string, ExampleFilter>({
      items: [],
      total: 0,
      currentPage: 1,
      perPage: 15,
      sort: null,
      sortDirection: 'asc',
      filter: null,
    });

    expect(result.lastPage).toBe(0);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'should normalize invalid currentPage %p',
    (currentPage) => {
      const result = new SearchResult<string, ExampleFilter>({
        items: [],
        total: 0,
        currentPage,
        perPage: 15,
        sort: null,
        sortDirection: 'asc',
        filter: null,
      });

      expect(result.currentPage).toBe(1);
    },
  );

  it.each([0, -1, 1.5, Number.NaN])(
    'should reject invalid perPage %p',
    (perPage) => {
      expect(
        () =>
          new SearchResult<string, ExampleFilter>({
            items: [],
            total: 0,
            currentPage: 1,
            perPage,
            sort: null,
            sortDirection: 'asc',
            filter: null,
          }),
      ).toThrow(new RangeError('perPage must be a positive integer'));
    },
  );

  it.each([-1, 1.5, Number.NaN])('should reject invalid total %p', (total) => {
    expect(
      () =>
        new SearchResult<string, ExampleFilter>({
          items: [],
          total,
          currentPage: 1,
          perPage: 15,
          sort: null,
          sortDirection: 'asc',
          filter: null,
        }),
    ).toThrow(new RangeError('total must be a non-negative integer'));
  });
});
