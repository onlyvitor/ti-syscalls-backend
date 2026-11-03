import { Injectable } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import {
  SearchParams,
  SearchResult,
  SearchableUserRepository,
  UserSortField,
} from '../../domain/repositories/searchable-user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { PrismaUserMapper } from './prisma-user.mapper';
import {
  buildUserOrderBy,
  buildUserWhere,
  SORTABLE_USER_FIELDS,
} from './prisma-user-query';

type PrismaUserClient = Pick<PrismaClient, 'user' | '$transaction'>;

const INSERTION_ORDER = [{ createdAt: 'asc' }, { id: 'asc' }] as const;

@Injectable()
export class PrismaSearchableUserRepository implements SearchableUserRepository {
  readonly sortableFields: readonly UserSortField[] = SORTABLE_USER_FIELDS;

  constructor(private readonly prisma: PrismaUserClient) {}

  async insert(user: User): Promise<void> {
    await this.prisma.user.create({
      data: PrismaUserMapper.toPersistence(user),
    });
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? PrismaUserMapper.toDomain(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: [...INSERTION_ORDER],
    });

    return rows.map((row) => PrismaUserMapper.toDomain(row));
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.valueOf() },
    });

    return row ? PrismaUserMapper.toDomain(row) : null;
  }

  /**
   * Uses `updateMany` so a missing id is a no-op, matching the in-memory
   * adapter. Existence is validated by the use case before reaching this port.
   */
  async update(user: User): Promise<void> {
    const data = PrismaUserMapper.toPersistence(user);

    await this.prisma.user.updateMany({
      where: { id: user.getId() },
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.deleteMany({ where: { id } });
  }

  async search(props: SearchParams): Promise<SearchResult> {
    const where = buildUserWhere(props.getFilter());
    const orderBy = buildUserOrderBy(props.getSort(), props.getSortDirection());
    const page = props.getPage();
    const perPage = props.getPerPage();

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return new SearchResult({
      items: rows.map((row) => PrismaUserMapper.toDomain(row)),
      total,
      currentPage: page,
      perPage,
      sort: props.getSort(),
      sortDirection: props.getSortDirection(),
      filter: props.getFilter(),
    });
  }
}
