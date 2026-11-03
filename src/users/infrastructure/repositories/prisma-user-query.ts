import type { Prisma } from '@prisma/client';
import type {
  SortDirection,
  UserFilter,
  UserSortField,
} from '../../domain/repositories/searchable-user.repository';
import { toPrismaRole } from './prisma-user.mapper';

export const SORTABLE_USER_FIELDS: readonly UserSortField[] = [
  'name',
  'email',
  'role',
];

/**
 * Mirrors the in-memory filtering semantics: blank values are ignored and
 * textual filters match anywhere in the field. MySQL's default collation is
 * case-insensitive, so no explicit `mode: 'insensitive'` is needed.
 */
export function buildUserWhere(
  filter: UserFilter | null,
): Prisma.UserWhereInput {
  if (filter === null) {
    return {};
  }

  const query = normalizeFilterValue(filter.query);
  const name = normalizeFilterValue(filter.name);
  const email = normalizeFilterValue(filter.email);

  const conditions: Prisma.UserWhereInput[] = [];

  if (query !== '') {
    conditions.push({
      OR: [{ name: { contains: query } }, { email: { contains: query } }],
    });
  }

  if (name !== '') {
    conditions.push({ name: { contains: name } });
  }

  if (email !== '') {
    conditions.push({ email: { contains: email } });
  }

  if (filter.role !== undefined) {
    conditions.push({ role: toPrismaRole(filter.role) });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Falls back to insertion order (creation time, then id) so pagination is
 * deterministic even when the caller does not ask for a specific sort.
 */
export function buildUserOrderBy(
  sort: UserSortField | null,
  sortDirection: SortDirection,
): Prisma.UserOrderByWithRelationInput[] {
  const field = sort?.trim() as UserSortField | undefined;

  if (field === undefined || !SORTABLE_USER_FIELDS.includes(field)) {
    return [{ createdAt: 'asc' }, { id: 'asc' }];
  }

  return [
    { [field]: sortDirection },
    { id: 'asc' },
  ] as Prisma.UserOrderByWithRelationInput[];
}

function normalizeFilterValue(value: string | undefined): string {
  return value?.trim() ?? '';
}
