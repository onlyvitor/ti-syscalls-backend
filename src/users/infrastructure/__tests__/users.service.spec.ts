import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { UsersService } from '../../application/users.service';
import { UserRole } from '../../domain/entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create users with USER as the default role', () => {
    const createdUser = service.create({
      name: 'Default Role User',
      email: 'default.role@example.com',
      password: 'securePassword123',
    });

    expect(createdUser.role).toBe(UserRole.USER);
  });
});
