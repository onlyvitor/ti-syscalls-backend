import { SearchableUserRepository } from 'src/users/domain/repositories/searchable-user.repository';
import { User } from '../../domain/entities/user.entity';
import { InMemoryUserRepository } from './in-memory-user.repository';

export class InMemorySearchableUserRepository
  extends InMemoryUserRepository
  implements SearchableUserRepository<any, User[]>
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  search(_props: any): Promise<User[]> {
    throw new Error('Method not implemented.');
  }
}
