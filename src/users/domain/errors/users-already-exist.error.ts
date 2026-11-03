import { DomainError } from 'src/shared/domain/global-contract.error';

export class UsersAlreadyExistError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, details, 409);
    this.name = 'UsersAlreadyExistError';
  }
}
