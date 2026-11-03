import { DomainError } from 'src/shared/domain/global-contract.error';

export class InvalidNameError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, details, 400);
    this.name = 'InvalidNameError';
  }
}
