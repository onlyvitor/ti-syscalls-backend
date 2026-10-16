import { randomUUID } from 'crypto';
import { Email } from '../value-objects/email.vo';
import { InvalidNameError } from '../errors/invalid-name.error';

export enum UserRole {
  USER = 'user',
  TECHNICIAN = 'technician',
  ADMIN = 'admin',
}

export type UserProps = {
  id: string;
  name: string;
  email: Email;
  password: string;
  role: UserRole;
};

export class User {
  private readonly id: string;
  private role: UserRole;

  constructor(
    id: string,
    private name: string,
    private email: Email,
    private password: string,
    role?: UserRole,
  ) {
    this.id = id;
    this.role = role ?? UserRole.USER;
  }

  static create(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): User {
    const name = data.name?.trim() ?? '';

    if (!name) {
      throw new InvalidNameError('Name cannot be empty', data.name);
    }

    return new User(
      randomUUID(),
      name,
      Email.create(data.email),
      data.password,
      data.role,
    );
  }

  static reconstitute(props: UserProps): User {
    return new User(
      props.id,
      props.name,
      props.email,
      props.password,
      props.role,
    );
  }

  updateName(newName: string): void {
    if (!newName || !newName.trim()) {
      throw new InvalidNameError('Name cannot be empty', newName);
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

  getPassword(): string {
    return this.password;
  }
}
