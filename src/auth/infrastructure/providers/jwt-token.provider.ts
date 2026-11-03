import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthTokenPayload,
  TokenProvider,
} from 'src/auth/application/providers/token.provider';
import { UserRole } from 'src/users/domain/entities/user.entity';

@Injectable()
export class JwtTokenProvider implements TokenProvider {
  constructor(private readonly jwtService: JwtService) {}

  async generate(payload: AuthTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async verify(token: string): Promise<AuthTokenPayload> {
    const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token);

    if (
      typeof payload?.sub !== 'string' ||
      typeof payload?.email !== 'string' ||
      !Object.values(UserRole).includes(payload.role)
    ) {
      throw new Error('Malformed token payload');
    }

    return payload;
  }
}
