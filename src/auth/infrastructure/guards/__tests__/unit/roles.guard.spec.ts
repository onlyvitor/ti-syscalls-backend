import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RolesGuard } from '../../roles.guard';
import type { AuthTokenPayload } from 'src/auth/application/providers/token.provider';
import { UserRole } from 'src/users/domain/entities/user.entity';

const createContext = (user?: AuthTokenPayload) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard Unit Tests', () => {
  let reflector: { getAllAndOverride: ReturnType<typeof jest.fn> };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('should allow routes without role metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('should reject when role metadata exists but no user is authenticated', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('should reject a user with an insufficient role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() =>
      guard.canActivate(
        createContext({
          sub: 'user-id',
          email: 'john.doe@example.com',
          role: UserRole.USER,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('should allow a user with one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
      UserRole.TECHNICIAN,
    ]);

    expect(
      guard.canActivate(
        createContext({
          sub: 'user-id',
          email: 'john.doe@example.com',
          role: UserRole.TECHNICIAN,
        }),
      ),
    ).toBe(true);
  });
});
