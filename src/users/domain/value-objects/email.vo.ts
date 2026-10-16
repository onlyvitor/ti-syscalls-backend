import { InvalidEmailError } from '../errors/invalid-email.error';

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Email {
    const trimmed = raw.trim().toLowerCase();

    if (!trimmed) {
      throw new InvalidEmailError('Email cannot be empty', raw);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new InvalidEmailError(`Invalid email format: ${raw}`, raw);
    }

    return new Email(trimmed);
  }

  valueOf(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
