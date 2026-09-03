import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { Repository } from '../../../shared/domain/repositories/repository';

export interface UserRepository extends Repository<User, string> {
  findAll(): Promise<User[]>;
  findByEmail(email: Email): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
