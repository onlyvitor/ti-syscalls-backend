import { User } from 'src/users/domain/entities/user.entity';
import { OutputUserDto } from './outputuser.dto';

/**
 * Projects a domain User to the HTTP output shape, never leaking the hash.
 */
export function toOutputUserDto(user: User): OutputUserDto {
  return {
    id: user.getId(),
    name: user.getName(),
    email: user.getEmail(),
    role: user.getRole(),
  };
}
