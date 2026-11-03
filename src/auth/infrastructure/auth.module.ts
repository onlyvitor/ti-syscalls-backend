import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { UsersModule } from 'src/users/infrastructure/users.module';
import { LoginUseCase } from '../application/use-cases/login.usecase';
import { AuthController } from './auth.controller';
import {
  loginUseCaseProvider,
  tokenProvider,
  TOKEN_PROVIDER,
} from './auth.providers';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_EXPIRES_IN',
            '1h',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [tokenProvider, loginUseCaseProvider],
  exports: [TOKEN_PROVIDER, LoginUseCase],
})
export class AuthModule {}
