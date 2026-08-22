export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Email {
    const trimmed = raw.trim().toLowerCase();

    if (!trimmed) {
      throw new Error('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error(`Invalid email format: ${raw}`);
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
