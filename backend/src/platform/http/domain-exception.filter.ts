import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../errors/domain-error';

/**
 * Translates typed domain errors into the standard error body without leaking
 * internals. Any error that is not a DomainError is left for Nest's default
 * handler (which returns a 500 and hides the detail).
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(error.httpStatus).json(this.toBody(error));
  }

  private toBody(error: DomainError): Record<string, unknown> {
    const body: Record<string, unknown> = {
      statusCode: error.httpStatus,
      error: error.code,
      message: error.message,
    };
    if (error.details && error.details.length > 0) {
      body.details = error.details;
    }
    return body;
  }
}
