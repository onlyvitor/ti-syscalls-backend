import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../presentation/create-user.dto';
import { UpdateUserDto } from '../presentation/update-user.dto';
import { SearchUsersQueryDto } from '../presentation/search-users.query.dto';
import { SignupUseCase } from 'src/users/application/use-cases/signup.usecase';
import { GetUserUseCase } from 'src/users/application/use-cases/getuser.usecase';
import { UpdateUserUseCase } from 'src/users/application/use-cases/update-user.usecase';
import { DeleteUserUseCase } from 'src/users/application/use-cases/delete-user.usecase';
import { SearchUsersUseCase } from 'src/users/application/use-cases/search-users.usecase';
import {
  UserSortField,
  UserFilter,
} from 'src/users/domain/repositories/searchable-user.repository';
import { toOutputUserDto } from '../presentation/user-presenter';
import { OutputUserDto } from '../presentation/outputuser.dto';

export type SearchUsersOutput = {
  items: OutputUserDto[];
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
  sort: UserSortField | null;
  sortDirection: 'asc' | 'desc';
  filter: UserFilter | null;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly signupUseCase: SignupUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
  ) {}

  create(createUserDto: CreateUserDto) {
    return this.signupUseCase.execute({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
    });
  }

  async search(query: SearchUsersQueryDto): Promise<SearchUsersOutput> {
    const result = await this.searchUsersUseCase.execute({
      filter: {
        query: query.query,
        name: query.name,
        email: query.email,
        role: query.role,
      },
      sort: query.sort ?? null,
      sortDirection: query.sortDirection,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      items: result.items.map(toOutputUserDto),
      total: result.total,
      currentPage: result.currentPage,
      perPage: result.perPage,
      lastPage: result.lastPage,
      sort: result.sort,
      sortDirection: result.sortDirection,
      filter: result.filter,
    };
  }

  findOne(id: string) {
    return this.getUserUseCase.execute({ id });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.updateUserUseCase.execute({
      id,
      name: updateUserDto.name,
      email: updateUserDto.email,
      role: updateUserDto.role,
    });
  }

  async remove(id: string): Promise<void> {
    await this.deleteUserUseCase.execute({ id });
  }
}
