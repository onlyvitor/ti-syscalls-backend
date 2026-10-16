import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  HASH_PROVIDER,
  SEARCHABLE_USER_REPOSITORY,
  USER_REPOSITORY,
  userRepositories,
  userUseCases,
} from './users.providers';
import { SignupUseCase } from 'src/users/application/use-cases/signup.usecase';

@Module({
  controllers: [UsersController],
  providers: [...userRepositories, ...userUseCases, UsersService],
  exports: [
    SEARCHABLE_USER_REPOSITORY,
    USER_REPOSITORY,
    HASH_PROVIDER,
    SignupUseCase,
  ],
})
export class UsersModule {}
