import { UsersService } from '../users.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SignupUseCase } from '../../application/use-cases/signup.usecase';
import { GetUserUseCase } from '../../application/use-cases/getuser.usecase';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.usecase';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.usecase';
import { SearchUsersUseCase } from '../../application/use-cases/search-users.usecase';
import { CreateUserDto } from '../../presentation/create-user.dto';
import { UpdateUserDto } from '../../presentation/update-user.dto';
import { SearchUsersQueryDto } from '../../presentation/search-users.query.dto';
import { UserRole } from '../../domain/entities/user.entity';

type Executable = { execute: ReturnType<typeof jest.fn> };

const executable = (): Executable => ({ execute: jest.fn() });

describe('UsersService', () => {
  let service: UsersService;
  let signupUseCase: Executable;
  let getUserUseCase: Executable;
  let updateUserUseCase: Executable;
  let deleteUserUseCase: Executable;
  let searchUsersUseCase: Executable;

  beforeEach(() => {
    signupUseCase = executable();
    getUserUseCase = executable();
    updateUserUseCase = executable();
    deleteUserUseCase = executable();
    searchUsersUseCase = executable();

    service = new UsersService(
      signupUseCase as unknown as SignupUseCase,
      getUserUseCase as unknown as GetUserUseCase,
      updateUserUseCase as unknown as UpdateUserUseCase,
      deleteUserUseCase as unknown as DeleteUserUseCase,
      searchUsersUseCase as unknown as SearchUsersUseCase,
    );
  });

  const outputUser = {
    id: 'user-id',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: UserRole.USER,
  };

  describe('create', () => {
    it('should delegate to SignupUseCase', async () => {
      const dto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
      };
      signupUseCase.execute.mockResolvedValueOnce(outputUser);

      const result = await service.create(dto);

      expect(signupUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: dto.password,
      });
      expect(result).toEqual(outputUser);
    });
  });

  describe('search', () => {
    it('should delegate filters and pagination to SearchUsersUseCase', async () => {
      const query = new SearchUsersQueryDto();
      query.query = 'jane';
      query.role = UserRole.TECHNICIAN;
      query.sort = 'name';
      query.sortDirection = 'desc';
      query.page = 2;
      query.perPage = 5;

      const user = {
        id: outputUser.id,
        name: outputUser.name,
        email: outputUser.email,
        role: outputUser.role,
        getId: () => outputUser.id,
        getName: () => outputUser.name,
        getEmail: () => outputUser.email,
        getRole: () => outputUser.role,
      };
      searchUsersUseCase.execute.mockResolvedValueOnce({
        items: [user],
        total: 1,
        currentPage: 2,
        perPage: 5,
        lastPage: 1,
      });

      const result = await service.search(query);

      expect(searchUsersUseCase.execute).toHaveBeenCalledWith({
        filter: {
          query: 'jane',
          name: undefined,
          email: undefined,
          role: 'technician',
        },
        sort: 'name',
        sortDirection: 'desc',
        page: 2,
        perPage: 5,
      });
      expect(result).toEqual({
        items: [outputUser],
        total: 1,
        currentPage: 2,
        perPage: 5,
        lastPage: 1,
      });
    });

    it('should sanitize nullish sort before searching', async () => {
      const query = new SearchUsersQueryDto();

      searchUsersUseCase.execute.mockResolvedValueOnce({
        items: [],
        total: 0,
        currentPage: 1,
        perPage: 15,
        lastPage: 0,
      });

      await service.search(query);

      expect(searchUsersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ sort: null }),
      );
    });

    it('should never expose the password hash in search results', async () => {
      const query = new SearchUsersQueryDto();

      const userWithPassword = {
        getId: () => outputUser.id,
        getName: () => outputUser.name,
        getEmail: () => outputUser.email,
        getRole: () => outputUser.role,
        getPassword: () => '$2a$12$hashed',
      };
      searchUsersUseCase.execute.mockResolvedValueOnce({
        items: [userWithPassword],
        total: 1,
        currentPage: 1,
        perPage: 15,
        lastPage: 1,
      });

      const result = await service.search(query);

      expect(result.items[0]).toEqual(outputUser);
      expect(result.items[0]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should delegate to GetUserUseCase', async () => {
      getUserUseCase.execute.mockResolvedValueOnce(outputUser);

      const result = await service.findOne('user-id');

      expect(getUserUseCase.execute).toHaveBeenCalledWith({ id: 'user-id' });
      expect(result).toEqual(outputUser);
    });
  });

  describe('update', () => {
    it('should delegate to UpdateUserUseCase', async () => {
      const dto = {
        name: 'New Name',
        email: 'new.name@example.com',
        role: UserRole.ADMIN,
      } as UpdateUserDto;
      updateUserUseCase.execute.mockResolvedValueOnce({
        ...outputUser,
        name: 'New Name',
      });

      const result = await service.update('user-id', dto);

      expect(updateUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id',
        name: 'New Name',
        email: 'new.name@example.com',
        role: UserRole.ADMIN,
      });
      expect(result).toEqual({ ...outputUser, name: 'New Name' });
    });
  });

  describe('remove', () => {
    it('should delegate to DeleteUserUseCase and resolve without content', async () => {
      deleteUserUseCase.execute.mockResolvedValueOnce(undefined);

      const result = await service.remove('user-id');

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({ id: 'user-id' });
      expect(result).toBeUndefined();
    });
  });
});
