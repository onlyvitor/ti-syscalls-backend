import { DomainError } from 'src/shared/domain/global-contract.error';

export class ForbiddenError extends DomainError {
  constructor(message = 'Insufficient permissions', details?: unknown) {
    super(message, details, 403);
    this.name = 'ForbiddenError';
  }
}
