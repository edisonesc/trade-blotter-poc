import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ValidationException } from '../exceptions/validation.exception';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';

interface FormattedValidationError {
  property: string;
  children: ValidationError[];
  constraints?: Record<string, string>;
}

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const validationErrors: FormattedValidationError[] =
      exception.validationErrors.map((e) => ({
        property: e.property,
        children: e.children ?? [],
        constraints: e.constraints,
      }));

    const messages = this.formatError(exception.validationErrors);

    response.status(400).json({
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: 'ValidationException',
      message: messages,
      errors: validationErrors,
    });
  }
  private formatError(errors: ValidationError[]): string[] {
    return errors
      .map((err) => Object.values(err.constraints ?? {})[0])
      .filter((msg): msg is string => msg !== undefined);
  }
}
