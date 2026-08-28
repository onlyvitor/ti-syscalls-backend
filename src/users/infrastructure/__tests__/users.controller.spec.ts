import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../../application/users.service';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('UsersController', () => {
  let controller: UsersController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
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
    const dto = { name: 'Alice', email: 'alice@example.com', password: 'pass' };
    mockService.create.mockReturnValue({ id: '1', ...dto, role: 'user' });

    const result = controller.create(dto as any);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1', ...dto, role: 'user' });
  });

  it('should proxy findAll to UsersService', () => {
    mockService.findAll.mockReturnValue([{ id: '1' }]);

    const result = controller.findAll();

    expect(mockService.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: '1' }]);
  });

  it('should convert id parameter to number for findOne', () => {
    mockService.findOne.mockReturnValue('user');

    const result = controller.findOne('42');

    expect(mockService.findOne).toHaveBeenCalledWith(42);
    expect(result).toBe('user');
  });

  it('should forward update calls with parsed id', () => {
    const dto = { name: 'Updated' };
    mockService.update.mockReturnValue('updated');

    const result = controller.update('7', dto as any);

    expect(mockService.update).toHaveBeenCalledWith(7, dto);
    expect(result).toBe('updated');
  });

  it('should forward remove calls with parsed id', () => {
    mockService.remove.mockReturnValue('deleted');

    const result = controller.remove('99');

    expect(mockService.remove).toHaveBeenCalledWith(99);
    expect(result).toBe('deleted');
  });
});
