import { UserRole } from 'src/users/domain/entities/user.entity';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export interface TokenProvider {
  generate(payload: AuthTokenPayload): Promise<string>;
  verify(token: string): Promise<AuthTokenPayload>;
}
