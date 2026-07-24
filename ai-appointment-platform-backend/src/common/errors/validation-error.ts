import { AppError } from '../../domain/errors';

interface ValidationIssue {
  field: string;
  message: string;
}

export class StructuredValidationError extends AppError {
  public readonly errors: ValidationIssue[];

  constructor(errors: ValidationIssue[]) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.name = 'StructuredValidationError';
    this.errors = errors;
  }
}
