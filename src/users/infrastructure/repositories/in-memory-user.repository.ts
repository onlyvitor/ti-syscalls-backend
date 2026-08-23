import { User } from 'src/users/domain/entities/user.entity';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { Email } from 'src/users/domain/value-objects/email.vo';

export class InMemoryUserRepository implements UserRepository<User> {
  private users: User[] = [];

  insert(user: User): void {
    this.users.push(user);
  }

  findById(id: string): Promise<User | null> {
    const user = this.users.find((user) => user.getId() === id);
    return Promise.resolve(user || null);
  }

  findAll(): Promise<User[]> {
    return Promise.resolve(this.users);
  }

  findByEmail(email: Email): Promise<User | null> {
    const user = this.users.find((user) => user.getEmail() === email.valueOf());
    return Promise.resolve(user || null);
  }

  update(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.getId() === user.getId());
    if (index !== -1) {
      this.users[index] = user;
    }
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    const index = this.users.findIndex((u) => u.getId() === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
    return Promise.resolve();
  }
}
