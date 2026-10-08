export interface ValidationErrorDetail {
  field: string;
  rejectedValue?: unknown;
  message: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  errors?: ValidationErrorDetail[];
}

export class AppApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly path: string;
  public readonly validationErrors?: ValidationErrorDetail[];

  constructor(errorResponse: ApiErrorResponse) {
    super(errorResponse.message);
    this.name = 'AppApiError';
    this.status = errorResponse.status;
    this.code = errorResponse.code;
    this.path = errorResponse.path;
    this.validationErrors = errorResponse.errors;
  }
}
