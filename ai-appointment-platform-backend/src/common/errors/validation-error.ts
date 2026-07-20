interface ValidationIssue {
  field: string;
  message: string;
}

export class StructuredValidationError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';
  public readonly errors: ValidationIssue[];

  constructor(errors: ValidationIssue[]) {
    super('Validation failed');
    this.name = 'StructuredValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, StructuredValidationError.prototype);
  }
}
