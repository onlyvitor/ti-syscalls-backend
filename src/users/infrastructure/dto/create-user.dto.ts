import { UserRole } from '../../domain/entities/user.entity';

export class CreateUserDto {
  name!: string;
  email!: string;
  password!: string;
  role?: UserRole;
}
