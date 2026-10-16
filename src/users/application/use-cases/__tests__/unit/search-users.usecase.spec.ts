import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SearchUsersUseCase } from '../../search-users.usecase';
import { InMemorySearchableUserRepository } from '../../../../infrastructure/repositories/in-memory-searchable-user.repository';
import {
  SearchParams,
  SearchResult,
} from '../../../../domain/repositories/searchable-user.repository';
import { User, UserRole } from '../../../../domain/entities/user.entity';

describe('SearchUsersUseCase Unit Tests', () => {
  let useCase: SearchUsersUseCase;
  let repository: InMemorySearchableUserRepository;

  beforeEach(async () => {
    repository = new InMemorySearchableUserRepository();
    useCase = new SearchUsersUseCase(repository);

    await repository.insert(
      User.create({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      }),
    );
    await repository.insert(
      User.create({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
        role: UserRole.TECHNICIAN,
      }),
    );
  });

  it('should return the repository search result', async () => {
    const result = await useCase.execute({});

    expect(result).toBeInstanceOf(SearchResult);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('should normalize default pagination (page 1, per page 15)', async () => {
    const result = await useCase.execute({});

    expect(result.currentPage).toBe(1);
    expect(result.perPage).toBe(15);
  });

  it('should filter by query', async () => {
    const result = await useCase.execute({
      filter: { query: 'jane' },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.getName()).toBe('Jane Doe');
  });

  it('should filter by role', async () => {
    const result = await useCase.execute({
      filter: { role: UserRole.TECHNICIAN },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.getRole()).toBe(UserRole.TECHNICIAN);
  });

  it('should sort by name descending', async () => {
    const result = await useCase.execute({
      sort: 'name',
      sortDirection: 'desc',
    });

    expect(result.items.map((user) => user.getName())).toEqual([
      'John Doe',
      'Jane Doe',
    ]);
  });

  it('should paginate the results', async () => {
    const result = await useCase.execute({ page: 2, perPage: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.getName()).toBe('Jane Doe');
    expect(result.total).toBe(2);
    expect(result.lastPage).toBe(2);
  });

  it('should keep invalid sort field untouched by the use case', async () => {
    const repositorySpy = jest.spyOn(repository, 'search');

    await useCase.execute({ sort: 'hacker' as never });

    expect(repositorySpy).toHaveBeenCalledWith(expect.any(SearchParams));
  });
});
