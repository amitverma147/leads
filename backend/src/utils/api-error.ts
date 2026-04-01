export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: Array<{ field: string; message: string }>,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(
    message = 'Bad request',
    errors?: Array<{ field: string; message: string }>
  ): ApiError {
    return new ApiError(400, message, true, errors);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message, true);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message, true);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message, true);
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message, true);
  }

  static unprocessable(
    message = 'Unprocessable entity',
    errors?: Array<{ field: string; message: string }>
  ): ApiError {
    return new ApiError(422, message, true, errors);
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, message, true);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, false);
  }
}

export default ApiError;