import { describe, expect, it } from '@jest/globals';
import { UserRole } from '../../../../domain/entities/user.entity';
import { buildUserOrderBy, buildUserWhere } from '../../prisma-user-query';

describe('Prisma user query building', () => {
  describe('buildUserWhere', () => {
    it('should return an empty filter when no filter is provided', () => {
      expect(buildUserWhere(null)).toEqual({});
    });

    it('should ignore blank filter values', () => {
      expect(buildUserWhere({ query: '  ', name: ' ', email: '' })).toEqual({});
    });

    it('should search the query term in name or e-mail', () => {
      expect(buildUserWhere({ query: 'jane' })).toEqual({
        AND: [
          {
            OR: [
              { name: { contains: 'jane' } },
              { email: { contains: 'jane' } },
            ],
          },
        ],
      });
    });

    it('should trim the query term but keep its case for the collation', () => {
      expect(buildUserWhere({ query: '  Jane  ' })).toEqual({
        AND: [
          {
            OR: [
              { name: { contains: 'Jane' } },
              { email: { contains: 'Jane' } },
            ],
          },
        ],
      });
    });

    it('should filter by name and e-mail independently', () => {
      expect(buildUserWhere({ name: 'Jane', email: 'example.com' })).toEqual({
        AND: [
          { name: { contains: 'Jane' } },
          { email: { contains: 'example.com' } },
        ],
      });
    });

    it('should combine query, name, e-mail and role', () => {
      expect(
        buildUserWhere({
          query: 'jane',
          name: 'Jane',
          email: 'example.com',
          role: UserRole.TECHNICIAN,
        }),
      ).toEqual({
        AND: [
          {
            OR: [
              { name: { contains: 'jane' } },
              { email: { contains: 'jane' } },
            ],
          },
          { name: { contains: 'Jane' } },
          { email: { contains: 'example.com' } },
          { role: 'technician' },
        ],
      });
    });

    it.each([
      [UserRole.USER, 'user'],
      [UserRole.TECHNICIAN, 'technician'],
      [UserRole.ADMIN, 'admin'],
    ])('should map the %s role to %s', (role, expected) => {
      expect(buildUserWhere({ role })).toEqual({
        AND: [{ role: expected }],
      });
    });
  });

  describe('buildUserOrderBy', () => {
    it('should fall back to insertion order without a sort field', () => {
      expect(buildUserOrderBy(null, 'asc')).toEqual([
        { createdAt: 'asc' },
        { id: 'asc' },
      ]);
    });

    it('should fall back to insertion order for a blank sort field', () => {
      expect(buildUserOrderBy('  ' as never, 'asc')).toEqual([
        { createdAt: 'asc' },
        { id: 'asc' },
      ]);
    });

    it('should fall back to insertion order for an unknown sort field', () => {
      expect(buildUserOrderBy('password' as never, 'asc')).toEqual([
        { createdAt: 'asc' },
        { id: 'asc' },
      ]);
    });

    it.each(['name', 'email', 'role'] as const)(
      'should sort by %s ascending',
      (field) => {
        expect(buildUserOrderBy(field, 'asc')).toEqual([
          { [field]: 'asc' },
          { id: 'asc' },
        ]);
      },
    );

    it.each(['name', 'email', 'role'] as const)(
      'should sort by %s descending',
      (field) => {
        expect(buildUserOrderBy(field, 'desc')).toEqual([
          { [field]: 'desc' },
          { id: 'asc' },
        ]);
      },
    );

    it('should always append id as a deterministic tie-breaker', () => {
      expect(buildUserOrderBy('name', 'asc')).toContainEqual({ id: 'asc' });
    });
  });
});
