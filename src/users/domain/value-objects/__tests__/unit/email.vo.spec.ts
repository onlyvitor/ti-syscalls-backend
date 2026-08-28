import { describe, it, expect } from '@jest/globals';
import { Email } from '../../email.vo';

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

  it('should normalize email by trimming and lowercasing', () => {
    const email = Email.create('   Jane.Doe@Example.COM   ');

    expect(email.valueOf()).toBe('jane.doe@example.com');
  });

  it('should throw an error when creating an empty email', () => {
    expect(() => Email.create('   ')).toThrow('Email cannot be empty');
  });

  it('should compare two Email instances by value', () => {
    const emailA = Email.create('match@example.com');
    const emailB = Email.create('MATCH@example.com');
    const emailC = Email.create('other@example.com');

    expect(emailA.equals(emailB)).toBe(true);
    expect(emailA.equals(emailC)).toBe(false);
  });
});
