import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { JwtAuthGuard } from '../../jwt-auth.guard';
import type {
  AuthTokenPayload,
  TokenProvider,
} from 'src/auth/application/providers/token.provider';
import { UserRole } from 'src/users/domain/entities/user.entity';

const payload: AuthTokenPayload = {
  sub: 'user-id',
  email: 'john.doe@example.com',
  role: UserRole.USER,
};

const createContext = (authorization?: string) => {
  const request: { headers: { authorization?: string }; user?: unknown } = {
    headers: { authorization },
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
};

describe('JwtAuthGuard Unit Tests', () => {
  let reflector: { getAllAndOverride: ReturnType<typeof jest.fn> };
  let tokenProvider: {
    generate: ReturnType<typeof jest.fn>;
    verify: ReturnType<typeof jest.fn>;
  };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    tokenProvider = { generate: jest.fn(), verify: jest.fn() };
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      tokenProvider as unknown as TokenProvider,
    );
  });

  it('should allow a route marked as public without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { context } = createContext();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenProvider.verify).not.toHaveBeenCalled();
  });

  it('should reject a protected route without an Authorization header', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject a non-Bearer authorization scheme', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { context } = createContext('Basic abc123');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject a token that fails verification', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    tokenProvider.verify.mockRejectedValue(new Error('expired'));
    const { context } = createContext('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should attach the verified payload to the request', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    tokenProvider.verify.mockResolvedValue(payload);
    const { context, request } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokenProvider.verify).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual(payload);
  });
});
