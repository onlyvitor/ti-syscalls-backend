import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';

export interface UserRepository {
  insert(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findByEmail(email: Email): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
