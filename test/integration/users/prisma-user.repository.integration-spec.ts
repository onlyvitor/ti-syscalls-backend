import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { User, UserRole } from 'src/users/domain/entities/user.entity';
import { SearchParams } from 'src/users/domain/repositories/searchable-user.repository';
import { PrismaSearchableUserRepository } from 'src/users/infrastructure/repositories/prisma-searchable-user.repository';
import { Email } from 'src/users/domain/value-objects/email.vo';
import {
  MysqlTestDatabase,
  startMysqlTestDatabase,
} from '../support/mysql-test-database';

jest.setTimeout(300000);

type UserOverrides = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
};

describe('PrismaSearchableUserRepository (integration)', () => {
  let database: MysqlTestDatabase;
  let prisma: PrismaClient;
  let repository: PrismaSearchableUserRepository;

  const buildUser = (overrides: UserOverrides = {}): User =>
    User.create({
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      password: 'password-hash',
      ...overrides,
    });

  const insertUser = async (overrides: UserOverrides = {}): Promise<User> => {
    const user = buildUser(overrides);
    await repository.insert(user);
    return user;
  };

  beforeAll(async () => {
    database = await startMysqlTestDatabase();
    prisma = new PrismaClient({ datasourceUrl: database.url });
    repository = new PrismaSearchableUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await database?.stop();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('insert and lookups', () => {
    it('should persist every field', async () => {
      const user = await insertUser({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'hash-value',
        role: UserRole.TECHNICIAN,
      });

      const found = await repository.findById(user.getId());

      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(user.getId());
      expect(found?.getName()).toBe('Jane Doe');
      expect(found?.getEmail()).toBe('jane.doe@example.com');
      expect(found?.getPassword()).toBe('hash-value');
      expect(found?.getRole()).toBe(UserRole.TECHNICIAN);
    });

    it('should default the role to user', async () => {
      const user = await insertUser();

      const found = await repository.findById(user.getId());

      expect(found?.getRole()).toBe(UserRole.USER);
    });

    it('should return null for an unknown id', async () => {
      await expect(
        repository.findById('00000000-0000-4000-8000-000000009999'),
      ).resolves.toBeNull();
    });

    it('should find a user by the normalized e-mail value object', async () => {
      await insertUser({ email: 'john.doe@example.com' });

      const found = await repository.findByEmail(
        Email.create('  JOHN.DOE@EXAMPLE.COM '),
      );

      expect(found?.getEmail()).toBe('john.doe@example.com');
    });

    it('should return null for an unknown e-mail', async () => {
      await expect(
        repository.findByEmail(Email.create('unknown@example.com')),
      ).resolves.toBeNull();
    });

    it('should list every persisted user', async () => {
      await insertUser({ email: 'one@example.com' });
      await insertUser({ email: 'two@example.com' });

      const users = await repository.findAll();

      expect(users).toHaveLength(2);
      expect(users.map((user) => user.getEmail()).sort()).toEqual([
        'one@example.com',
        'two@example.com',
      ]);
    });

    it('should reject a duplicated e-mail at the database level', async () => {
      await insertUser({ email: 'duplicated@example.com' });

      await expect(
        insertUser({ email: 'duplicated@example.com' }),
      ).rejects.toMatchObject({ code: 'P2002' });
    });
  });

  describe('update', () => {
    it('should persist name, e-mail and role changes', async () => {
      const user = await insertUser();

      user.updateName('Updated Name');
      user.updateEmail('updated@example.com');
      user.assignRole(UserRole.ADMIN);
      await repository.update(user);

      const found = await repository.findById(user.getId());

      expect(found?.getName()).toBe('Updated Name');
      expect(found?.getEmail()).toBe('updated@example.com');
      expect(found?.getRole()).toBe(UserRole.ADMIN);
    });

    it('should be a no-op for an unknown user', async () => {
      const user = buildUser({ email: 'ghost@example.com' });

      await expect(repository.update(user)).resolves.toBeUndefined();
    });

    it('should reject moving to an e-mail owned by another user', async () => {
      await insertUser({ email: 'owner@example.com' });
      const user = await insertUser({ email: 'other@example.com' });
      user.updateEmail('owner@example.com');

      await expect(repository.update(user)).rejects.toMatchObject({
        code: 'P2002',
      });
    });
  });

  describe('delete', () => {
    it('should remove the persisted user', async () => {
      const user = await insertUser();

      await repository.delete(user.getId());

      await expect(repository.findById(user.getId())).resolves.toBeNull();
    });

    it('should be a no-op for an unknown id', async () => {
      await expect(
        repository.delete('00000000-0000-4000-8000-000000009999'),
      ).resolves.toBeUndefined();
    });

    it('should not remove other users', async () => {
      const user = await insertUser({ email: 'keep@example.com' });
      const other = await insertUser({ email: 'remove@example.com' });

      await repository.delete(other.getId());

      await expect(repository.findById(user.getId())).resolves.not.toBeNull();
    });
  });

  describe('search', () => {
    it('should return every user with default pagination metadata', async () => {
      await insertUser({ email: 'one@example.com' });
      await insertUser({ email: 'two@example.com' });

      const result = await repository.search(new SearchParams({}));

      expect(result.total).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.perPage).toBe(15);
      expect(result.lastPage).toBe(1);
      expect(result.items).toHaveLength(2);
      expect(result.sort).toBeNull();
      expect(result.filter).toBeNull();
    });

    it('should match the query term in name or e-mail, ignoring case', async () => {
      await insertUser({ name: 'Jane Doe', email: 'jane.doe@example.com' });
      await insertUser({ name: 'Other User', email: 'other@example.com' });

      const byName = await repository.search(
        new SearchParams({ filter: { query: 'JANE' } }),
      );
      const byEmail = await repository.search(
        new SearchParams({ filter: { query: 'other@' } }),
      );

      expect(byName.total).toBe(1);
      expect(byName.items[0].getEmail()).toBe('jane.doe@example.com');
      expect(byEmail.total).toBe(1);
      expect(byEmail.items[0].getEmail()).toBe('other@example.com');
    });

    it('should filter by name and e-mail independently', async () => {
      await insertUser({ name: 'Jane Doe', email: 'jane.doe@example.com' });
      await insertUser({ name: 'Jane Smith', email: 'jane.smith@other.com' });

      const result = await repository.search(
        new SearchParams({
          filter: { name: 'Smith', email: 'other.com' },
        }),
      );

      expect(result.total).toBe(1);
      expect(result.items[0].getName()).toBe('Jane Smith');
    });

    it.each([
      [UserRole.USER, 2],
      [UserRole.TECHNICIAN, 1],
      [UserRole.ADMIN, 1],
    ])('should filter by the %s role', async (role, expectedTotal) => {
      await insertUser({ email: 'one@example.com', role: UserRole.USER });
      await insertUser({ email: 'two@example.com', role: UserRole.USER });
      await insertUser({
        email: 'three@example.com',
        role: UserRole.TECHNICIAN,
      });
      await insertUser({ email: 'four@example.com', role: UserRole.ADMIN });

      const result = await repository.search(
        new SearchParams({ filter: { role } }),
      );

      expect(result.total).toBe(expectedTotal);
    });

    it('should ignore blank filter values', async () => {
      await insertUser({ email: 'one@example.com' });
      await insertUser({ email: 'two@example.com' });

      const result = await repository.search(
        new SearchParams({ filter: { query: ' ', name: '', email: '  ' } }),
      );

      expect(result.total).toBe(2);
    });

    it('should sort by e-mail ascending', async () => {
      await insertUser({ email: 'c@example.com' });
      await insertUser({ email: 'a@example.com' });
      await insertUser({ email: 'b@example.com' });

      const result = await repository.search(
        new SearchParams({ sort: 'email', sortDirection: 'asc' }),
      );

      expect(result.items.map((user) => user.getEmail())).toEqual([
        'a@example.com',
        'b@example.com',
        'c@example.com',
      ]);
    });

    it('should sort by e-mail descending', async () => {
      await insertUser({ email: 'a@example.com' });
      await insertUser({ email: 'c@example.com' });
      await insertUser({ email: 'b@example.com' });

      const result = await repository.search(
        new SearchParams({ sort: 'email', sortDirection: 'desc' }),
      );

      expect(result.items.map((user) => user.getEmail())).toEqual([
        'c@example.com',
        'b@example.com',
        'a@example.com',
      ]);
    });

    it('should sort by name', async () => {
      await insertUser({ name: 'Charlie', email: 'c@example.com' });
      await insertUser({ name: 'Alice', email: 'a@example.com' });
      await insertUser({ name: 'Bob', email: 'b@example.com' });

      const result = await repository.search(
        new SearchParams({ sort: 'name', sortDirection: 'asc' }),
      );

      expect(result.items.map((user) => user.getName())).toEqual([
        'Alice',
        'Bob',
        'Charlie',
      ]);
    });

    it('should paginate while keeping the filtered total', async () => {
      for (const email of ['a@example.com', 'b@example.com', 'c@example.com']) {
        await insertUser({ email });
      }

      const result = await repository.search(
        new SearchParams({ page: 2, perPage: 2, sort: 'email' }),
      );

      expect(result.total).toBe(3);
      expect(result.currentPage).toBe(2);
      expect(result.perPage).toBe(2);
      expect(result.lastPage).toBe(2);
      expect(result.items.map((user) => user.getEmail())).toEqual([
        'c@example.com',
      ]);
    });

    it('should return an empty page beyond the last one', async () => {
      await insertUser({ email: 'one@example.com' });

      const result = await repository.search(
        new SearchParams({ page: 3, perPage: 15 }),
      );

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(0);
    });

    it('should echo the applied sort and filter in the result', async () => {
      await insertUser({ email: 'one@example.com' });

      const filter = { email: 'one' };
      const result = await repository.search(
        new SearchParams({ filter, sort: 'email', sortDirection: 'desc' }),
      );

      expect(result.sort).toBe('email');
      expect(result.sortDirection).toBe('desc');
      expect(result.filter).toEqual(filter);
    });
  });
});
