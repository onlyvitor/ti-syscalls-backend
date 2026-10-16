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
import { UsersAlreadyExistError } from 'src/users/domain/errors/users-already-exist.error';
import { BadRequestException as DomainBadRequestException } from 'src/users/application/errors/bad-request.error';
import { NotFoundException as DomainNotFoundException } from 'src/users/application/errors/not-found.error';
import { InvalidEmailError } from 'src/users/domain/errors/invalid-email.error';
import { InvalidNameError } from 'src/users/domain/errors/invalid-name.error';

type ErrorResponseBody = {
  statusCode: number;
  message: string;
  details?: unknown;
};

/**
 * Translates domain errors and unexpected failures into HTTP responses.
 * Domain rules stay on the domain layer; this filter only decides which
 * HTTP status fits each error.
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
    if (exception instanceof UsersAlreadyExistError) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          statusCode: HttpStatus.CONFLICT,
          message: exception.message,
          details: exception.details,
        },
      };
    }

    if (exception instanceof DomainNotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: {
          statusCode: HttpStatus.NOT_FOUND,
          message: exception.message,
          details: exception.details,
        },
      };
    }

    if (
      exception instanceof InvalidEmailError ||
      exception instanceof InvalidNameError
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: exception.message,
          details: exception.details,
        },
      };
    }

    if (
      exception instanceof DomainBadRequestException ||
      exception instanceof DomainError
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          statusCode: HttpStatus.BAD_REQUEST,
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
