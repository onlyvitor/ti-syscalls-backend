import { beforeEach, describe, expect, it } from '@jest/globals';
import { InMemorySearchableUserRepository } from '../../in-memory-searchable-user.repository';
import {
  SearchParams,
  SearchResult,
} from '../../../../domain/repositories/searchable-user.repository';
import { User, UserRole } from '../../../../domain/entities/user.entity';

describe('InMemorySearchableUserRepository Unit Tests', () => {
  let repository: InMemorySearchableUserRepository;
  let alice: User;
  let bob: User;
  let charlie: User;

  beforeEach(async () => {
    repository = new InMemorySearchableUserRepository();

    alice = User.create({
      name: 'Alice',
      email: 'c@example.com',
      password: 'password123',
      role: UserRole.USER,
    });
    bob = User.create({
      name: 'Bob',
      email: 'a@example.com',
      password: 'password123',
      role: UserRole.ADMIN,
    });
    charlie = User.create({
      name: 'Charlie',
      email: 'b@example.com',
      password: 'password123',
      role: UserRole.TECHNICIAN,
    });

    await repository.insert(charlie);
    await repository.insert(alice);
    await repository.insert(bob);
  });

  describe('search', () => {
    it('should return an empty result when the repository has no users', async () => {
      const emptyRepository = new InMemorySearchableUserRepository();

      const result = await emptyRepository.search(new SearchParams({}));

      expect(result).toBeInstanceOf(SearchResult);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.lastPage).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.perPage).toBe(15);
      expect(result.sort).toBeNull();
      expect(result.sortDirection).toBe('asc');
      expect(result.filter).toBeNull();
    });

    it('should return all users in insertion order when no params are provided', async () => {
      const result = await repository.search(new SearchParams({}));

      expect(result.items).toEqual([charlie, alice, bob]);
      expect(result.total).toBe(3);
      expect(result.lastPage).toBe(1);
    });

    it('should reflect the search params in the result metadata', async () => {
      const result = await repository.search(
        new SearchParams({
          page: 1,
          perPage: 2,
          sort: 'name',
          sortDirection: 'desc',
          filter: 'example',
        }),
      );

      expect(result.currentPage).toBe(1);
      expect(result.perPage).toBe(2);
      expect(result.sort).toBe('name');
      expect(result.sortDirection).toBe('desc');
      expect(result.filter).toBe('example');
    });

    it('should not mutate the internal users array when sorting', async () => {
      await repository.search(new SearchParams({ sort: 'name' }));

      const result = await repository.search(new SearchParams({}));
      expect(result.items).toEqual([charlie, alice, bob]);
    });
  });

  describe('filter', () => {
    it('should filter users by name case-insensitively', async () => {
      const result = await repository.search(
        new SearchParams({ filter: 'AL' }),
      );

      expect(result.items).toEqual([alice]);
      expect(result.total).toBe(1);
    });

    it('should filter users by email case-insensitively', async () => {
      const result = await repository.search(
        new SearchParams({ filter: 'B@EXAMPLE.COM' }),
      );

      expect(result.items).toEqual([charlie]);
      expect(result.total).toBe(1);
    });

    it('should match the filter in either name or email', async () => {
      const result = await repository.search(new SearchParams({ filter: 'b' }));

      // 'b' matches bob by name and charlie by email (b@example.com)
      expect(result.items).toEqual([charlie, bob]);
      expect(result.items).not.toContain(alice);
      expect(result.total).toBe(2);
    });

    it('should trim whitespace from the filter term', async () => {
      const result = await repository.search(
        new SearchParams({ filter: '   bob   ' }),
      );

      expect(result.items).toEqual([bob]);
    });

    it('should return empty items when no user matches the filter', async () => {
      const result = await repository.search(
        new SearchParams({ filter: 'does-not-exist' }),
      );

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.lastPage).toBe(0);
    });
  });

  describe('sort', () => {
    it('should sort by name ascending by default', async () => {
      const result = await repository.search(
        new SearchParams({ sort: 'name' }),
      );

      expect(result.items).toEqual([alice, bob, charlie]);
      expect(result.sortDirection).toBe('asc');
    });

    it('should sort by name descending', async () => {
      const result = await repository.search(
        new SearchParams({ sort: 'name', sortDirection: 'desc' }),
      );

      expect(result.items).toEqual([charlie, bob, alice]);
    });

    it('should sort by email ascending', async () => {
      const result = await repository.search(
        new SearchParams({ sort: 'email' }),
      );

      expect(result.items).toEqual([bob, charlie, alice]);
    });

    it('should sort by role', async () => {
      const result = await repository.search(
        new SearchParams({ sort: 'role' }),
      );

      expect(result.items.map((user) => user.getRole())).toEqual([
        UserRole.ADMIN,
        UserRole.TECHNICIAN,
        UserRole.USER,
      ]);
    });

    it('should keep original order when sorting by a non-sortable field', async () => {
      const result = await repository.search(
        new SearchParams({ sort: 'password' }),
      );

      expect(result.items).toEqual([charlie, alice, bob]);
    });

    it('should trim the sort field before applying it', async () => {
      const result = await repository.search(
        new SearchParams({ sort: '  name  ' }),
      );

      expect(result.items).toEqual([alice, bob, charlie]);
    });
  });

  describe('paginate', () => {
    it('should return the first page of results', async () => {
      const result = await repository.search(new SearchParams({ perPage: 2 }));

      expect(result.items).toEqual([charlie, alice]);
      expect(result.total).toBe(3);
      expect(result.lastPage).toBe(2);
      expect(result.perPage).toBe(2);
    });

    it('should return the second page of results', async () => {
      const result = await repository.search(
        new SearchParams({ page: 2, perPage: 2 }),
      );

      expect(result.items).toEqual([bob]);
      expect(result.total).toBe(3);
      expect(result.lastPage).toBe(2);
      expect(result.currentPage).toBe(2);
    });

    it('should return empty items when the page exceeds the available results', async () => {
      const result = await repository.search(
        new SearchParams({ page: 10, perPage: 2 }),
      );

      expect(result.items).toEqual([]);
      expect(result.total).toBe(3);
      expect(result.lastPage).toBe(2);
    });

    it('should normalize an invalid page to 1', async () => {
      const result = await repository.search(new SearchParams({ page: 0 }));

      expect(result.currentPage).toBe(1);
      expect(result.items).toEqual([charlie, alice, bob]);
    });

    it('should normalize an invalid perPage to the default of 15', async () => {
      const result = await repository.search(new SearchParams({ perPage: 0 }));

      expect(result.perPage).toBe(15);
      expect(result.items).toEqual([charlie, alice, bob]);
    });
  });

  describe('combined operations', () => {
    it('should apply filter, sort and pagination together', async () => {
      const result = await repository.search(
        new SearchParams({
          filter: 'b',
          sort: 'name',
          sortDirection: 'desc',
          perPage: 1,
        }),
      );

      expect(result.items).toEqual([charlie]);
      expect(result.total).toBe(2);
      expect(result.lastPage).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.filter).toBe('b');
      expect(result.sort).toBe('name');
      expect(result.sortDirection).toBe('desc');
    });
  });
});
