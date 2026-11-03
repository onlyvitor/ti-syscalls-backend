import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AuthTokenPayload } from 'src/auth/application/providers/token.provider';
import { UserRole } from '../../domain/entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  const currentUser: AuthTokenPayload = {
    sub: 'admin-id',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };
  const actor = {
    id: currentUser.sub,
    role: currentUser.role,
  };
  const mockService = {
    create: jest.fn(),
    search: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call UsersService.create with the DTO and return its response', () => {
    const dto = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    };
    mockService.create.mockReturnValue({
      id: '1',
      name: 'Alice',
      email: dto.email,
      role: 'user',
    });

    const result = controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toMatchObject({ name: 'Alice' });
  });

  it('should proxy search queries to UsersService.search', () => {
    const query = { query: 'jane', page: '2' };
    mockService.search.mockReturnValue({ items: [], total: 0 });

    const result = controller.findAll(query);

    expect(mockService.search).toHaveBeenCalledWith(query);
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('should proxy findOne to UsersService with the raw id and actor', () => {
    mockService.findOne.mockReturnValue('user');

    const result = controller.findOne(currentUser, 'user-id');

    expect(mockService.findOne).toHaveBeenCalledWith('user-id', actor);
    expect(result).toBe('user');
  });

  it('should forward update calls with the raw id and actor', () => {
    const dto = { name: 'Updated' };
    mockService.update.mockReturnValue('updated');

    const result = controller.update(currentUser, '7', dto);

    expect(mockService.update).toHaveBeenCalledWith('7', dto, actor);
    expect(result).toBe('updated');
  });

  it('should forward remove calls with the raw id and actor', () => {
    mockService.remove.mockReturnValue(undefined);

    const result = controller.remove(currentUser, 'user-id');

    expect(mockService.remove).toHaveBeenCalledWith('user-id', actor);
    expect(result).toBeUndefined();
  });
});
