import { UserRole as PrismaUserRole } from '@prisma/client';
import { User, UserRole } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';

export type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: PrismaUserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type UserPersistence = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: PrismaUserRole;
};

const ROLE_TO_DOMAIN: Record<PrismaUserRole, UserRole> = {
  [PrismaUserRole.user]: UserRole.USER,
  [PrismaUserRole.technician]: UserRole.TECHNICIAN,
  [PrismaUserRole.admin]: UserRole.ADMIN,
};

const ROLE_TO_PERSISTENCE: Record<UserRole, PrismaUserRole> = {
  [UserRole.USER]: PrismaUserRole.user,
  [UserRole.TECHNICIAN]: PrismaUserRole.technician,
  [UserRole.ADMIN]: PrismaUserRole.admin,
};

export function toDomainRole(role: PrismaUserRole): UserRole {
  return ROLE_TO_DOMAIN[role];
}

export function toPrismaRole(role: UserRole): PrismaUserRole {
  return ROLE_TO_PERSISTENCE[role];
}

/**
 * Translates between the MySQL row shape and the domain entity.
 *
 * Keeping this translation in infrastructure is what allows `User` to stay
 * free of Prisma types and persistence concerns.
 */
export class PrismaUserMapper {
  static toDomain(row: UserRow): User {
    return User.reconstitute({
      id: row.id,
      name: row.name,
      email: Email.create(row.email),
      password: row.passwordHash,
      role: toDomainRole(row.role),
    });
  }

  static toPersistence(user: User): UserPersistence {
    return {
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
      passwordHash: user.getPassword(),
      role: toPrismaRole(user.getRole()),
    };
  }
}
