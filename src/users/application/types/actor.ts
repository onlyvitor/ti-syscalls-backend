import type { UserRole } from 'src/users/domain/entities/user.entity';

export type Actor = {
  id: string;
  role: UserRole;
};
