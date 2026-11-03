import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GlobalExceptionFilter } from '../global-exception.filter';
import { DomainError } from 'src/shared/domain/global-contract.error';

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
};

const createHost = (
  response: ReturnType<typeof createResponse>,
): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  }) as unknown as ArgumentsHost;

describe('GlobalExceptionFilter Unit Tests', () => {
  let filter: GlobalExceptionFilter;
  let response: ReturnType<typeof createResponse>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    response = createResponse();
  });

  it('should map a domain error using its HTTP status', () => {
    const error = new DomainError(
      'Email already exists',
      { email: 'a@b.com' },
      409,
    );

    filter.catch(error, createHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'Email already exists',
      details: { email: 'a@b.com' },
    });
  });

  it('should default domain errors without an explicit status to 400', () => {
    const error = new DomainError('Invalid payload', { field: 'name' });

    filter.catch(error, createHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid payload',
      details: { field: 'name' },
    });
  });

  it('should preserve an HttpException string response', () => {
    const error = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(error, createHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Forbidden',
    });
  });

  it('should preserve an HttpException object response', () => {
    const error = new HttpException(
      { statusCode: 422, message: 'Validation failed' },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(error, createHost(response));

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 422,
      message: 'Validation failed',
    });
  });

  it('should map unknown errors to 500 without leaking details', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter.catch(new Error('database exploded'), createHost(response));

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
    expect(loggerSpy).toHaveBeenCalledTimes(1);

    loggerSpy.mockRestore();
  });
});
