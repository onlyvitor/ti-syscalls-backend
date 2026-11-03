import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { JwtTokenProvider } from '../../jwt-token.provider';
import { AuthTokenPayload } from 'src/auth/application/providers/token.provider';
import { UserRole } from 'src/users/domain/entities/user.entity';

const payload: AuthTokenPayload = {
  sub: 'user-id',
  email: 'john.doe@example.com',
  role: UserRole.TECHNICIAN,
};

describe('JwtTokenProvider Unit Tests', () => {
  let jwtService: JwtService;
  let provider: JwtTokenProvider;

  beforeEach(() => {
    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    provider = new JwtTokenProvider(jwtService);
  });

  it('should generate a token that verifies back to the payload', async () => {
    const token = await provider.generate(payload);

    await expect(provider.verify(token)).resolves.toEqual(
      expect.objectContaining(payload),
    );
  });

  it('should reject a malformed token', async () => {
    await expect(provider.verify('not-a-token')).rejects.toThrow();
  });

  it('should reject an expired token', async () => {
    const token = await jwtService.signAsync(payload, { expiresIn: '-1s' });

    await expect(provider.verify(token)).rejects.toThrow();
  });

  it('should reject a token signed with another secret', async () => {
    const otherService = new JwtService({ secret: 'another-secret' });
    const token = await otherService.signAsync(payload);

    await expect(provider.verify(token)).rejects.toThrow();
  });

  it('should reject a token with an unexpected payload shape', async () => {
    const token = await jwtService.signAsync({ sub: 'user-id' });

    await expect(provider.verify(token)).rejects.toThrow(
      'Malformed token payload',
    );
  });
});
