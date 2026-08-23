import { describe, it, expect } from '@jest/globals';
import { Email } from '../../../value-objects/email.vo';

describe('Email Object Value', () => {
  it('should create a valid email value object', () => {
    const email = Email.create('john.doe@example.com');
    expect(email).toBeInstanceOf(Email);
  });

  it('should throw an error for invalid email format', () => {
    expect(() => Email.create('invalid-email')).toThrow(
      'Invalid email format: invalid-email',
    );
  });
});
