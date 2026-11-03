import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthTokenPayload } from 'src/auth/application/providers/token.provider';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthTokenPayload => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthTokenPayload }>();

    return request.user;
  },
);
