export class DomainError extends Error {
  public readonly details?: unknown;
  public readonly httpStatus: number;

  constructor(message: string, details?: unknown, httpStatus = 400) {
    super(message);
    this.name = 'DomainError';
    this.details = details;
    this.httpStatus = httpStatus;
  }
}
