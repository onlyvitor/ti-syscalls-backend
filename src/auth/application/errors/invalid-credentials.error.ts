import { DomainError } from 'src/shared/domain/global-contract.error';

export class InvalidCredentialsError extends DomainError {
  constructor(details?: unknown) {
    super('Invalid email or password', details, 401);
    this.name = 'InvalidCredentialsError';
  }
}
