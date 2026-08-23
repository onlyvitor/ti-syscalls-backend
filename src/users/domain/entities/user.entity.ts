import { randomUUID } from 'crypto';
import { Email } from '../value-objects/email.vo';

export enum UserRole {
  USER = 'user',
  TECHNICIAN = 'technician',
  ADMIN = 'admin',
}

export class User {
  private readonly id: string;
  private role: UserRole;

  private constructor(
    private name: string,
    private email: Email,
    private password: string,
    role?: UserRole,
  ) {
    this.id = randomUUID();
    this.role = role || UserRole.USER;
  }

  static create(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): User {
    return new User(
      data.name.trim(),
      Email.create(data.email),
      data.password,
      data.role,
    );
  }

  updateName(newName: string): void {
    if (!newName || !newName.trim()) {
      throw new Error('Name cannot be empty');
    }
    this.name = newName.trim();
  }

  updateEmail(raw: string): void {
    this.email = Email.create(raw);
  }

  assignRole(newRole: UserRole): void {
    this.role = newRole;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email.valueOf();
  }

  getRole(): UserRole {
    return this.role;
  }

  hasPassword(candidate: string): boolean {
    return this.password === candidate;
  }
}
