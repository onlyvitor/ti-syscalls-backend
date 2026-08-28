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

  it('should trim the name and normalize the email when creating a user', () => {
    const createdUser = service.create({
      name: '   Trimmed Name   ',
      email: 'MIXED.Case@Example.COM  ',
      password: 'securePassword123',
    });

    expect(createdUser.name).toBe('Trimmed Name');
    expect(createdUser.email).toBe('mixed.case@example.com');
    expect(createdUser.id).toBeDefined();
    expect(typeof createdUser.id).toBe('string');
  });

  it('should honor provided role values when creating a user', () => {
    const adminUser = service.create({
      name: 'Admin User',
      email: 'admin.user@example.com',
      password: 'securePassword123',
      role: UserRole.ADMIN,
    });

    expect(adminUser.role).toBe(UserRole.ADMIN);
  });
});
