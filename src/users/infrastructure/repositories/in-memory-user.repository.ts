import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.vo';

export class InMemoryUserRepository implements UserRepository<User> {
  private users: User[] = [];

  async insert(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((user) => user.getId() === id);
    return Promise.resolve(user || null);
  }

  async findAll(): Promise<User[]> {
    return Promise.resolve(this.users);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const user = this.users.find((user) => user.getEmail() === email.valueOf());
    return Promise.resolve(user || null);
  }

  async update(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.getId() === user.getId());
    if (index !== -1) {
      this.users[index] = user;
    }
    return Promise.resolve();
  }

  async delete(id: string): Promise<void> {
    const index = this.users.findIndex((u) => u.getId() === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
    return Promise.resolve();
  }
}
