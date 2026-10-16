import { DomainError } from 'src/shared/domain/global-contract.error';

export class NotFoundException extends DomainError {
  constructor(details?: unknown) {
    super('User not found', details);
    this.name = 'NotFoundException';
  }
}
