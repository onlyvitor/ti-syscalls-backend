import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('UsersController', () => {
  let controller: UsersController;
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

  it('should proxy findOne to UsersService with the raw id', () => {
    mockService.findOne.mockReturnValue('user');

    const result = controller.findOne('user-id');

    expect(mockService.findOne).toHaveBeenCalledWith('user-id');
    expect(result).toBe('user');
  });

  it('should forward update calls with the raw id', () => {
    const dto = { name: 'Updated' };
    mockService.update.mockReturnValue('updated');

    const result = controller.update('7', dto);

    expect(mockService.update).toHaveBeenCalledWith('7', dto);
    expect(result).toBe('updated');
  });

  it('should forward remove calls with the raw id', () => {
    mockService.remove.mockReturnValue(undefined);

    const result = controller.remove('user-id');

    expect(mockService.remove).toHaveBeenCalledWith('user-id');
    expect(result).toBeUndefined();
  });
});
