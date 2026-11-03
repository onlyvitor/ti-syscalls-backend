import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from 'src/shared/domain/global-contract.error';

type ErrorResponseBody = {
  statusCode: number;
  message: string;
  details?: unknown;
};

/**
 * Translates domain errors and unexpected failures into HTTP responses.
 * Domain rules stay on the domain layer; this filter only decides which
 * HTTP status fits each error, based on the status carried by `DomainError`.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const { status, body } = this.buildResponse(exception);
    if (status >= 500) {
      this.logger.error(exception);
    }

    response.status(status).json(body);
  }

  private buildResponse(exception: unknown): {
    status: number;
    body: ErrorResponseBody;
  } {
    if (exception instanceof DomainError) {
      return {
        status: exception.httpStatus,
        body: {
          statusCode: exception.httpStatus,
          message: exception.message,
          details: exception.details,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const httpBody = exception.getResponse();
      const body: ErrorResponseBody =
        typeof httpBody === 'string'
          ? { statusCode: status, message: httpBody }
          : {
              statusCode:
                (httpBody as { statusCode?: number }).statusCode ?? status,
              message:
                (httpBody as { message?: string }).message ?? exception.message,
            };
      return { status, body };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    };
  }
}
