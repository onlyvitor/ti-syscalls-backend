import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { UserRole } from '../domain/entities/user.entity';
import type {
  UserSortField,
  SortDirection,
} from '../domain/repositories/searchable-user.repository';

export class SearchUsersQueryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsIn(Object.values(UserRole), {
    message: 'role must be one of user, technician, admin',
  })
  role?: UserRole;

  @IsOptional()
  @IsIn(['name', 'email', 'role'])
  sort?: UserSortField;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: SortDirection;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be greater than or equal to 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'perPage must be an integer' })
  @Min(1, { message: 'perPage must be greater than or equal to 1' })
  perPage?: number;
}
