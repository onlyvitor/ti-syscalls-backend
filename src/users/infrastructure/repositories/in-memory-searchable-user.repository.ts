import { SearchableUserRepository } from 'src/users/domain/repositories/searchable-user.repository';
import { User } from '../../domain/entities/user.entity';
import { InMemoryUserRepository } from './in-memory-user.repository';

export class InMemorySearchableUserRepository
  extends InMemoryUserRepository
  implements SearchableUserRepository<User, any, any>
{
  search(_props: any): Promise<User[]> {
    throw new Error('Method not implemented.');
  }
}
