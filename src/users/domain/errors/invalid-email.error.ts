import { DomainError } from 'src/shared/domain/global-contract.error';

export class InvalidEmailError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = 'InvalidEmailError';
  }
}
