import { Response } from 'express';

export interface ApiResponseData<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: Array<{ field: string; message: string }>;
}

export class ApiResponse {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: ApiResponseData['meta']
  ): Response {
    const response: ApiResponseData<T> = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response (201)
   */
  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Success'
  ): Response {
    const totalPages = Math.ceil(total / limit);

    return this.success(res, data, message, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: Array<{ field: string; message: string }>
  ): Response {
    const response: ApiResponseData = {
      success: false,
      message,
    };

    if (errors && errors.length > 0) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send bad request response (400)
   */
  static badRequest(
    res: Response,
    message = 'Bad request',
    errors?: Array<{ field: string; message: string }>
  ): Response {
    return this.error(res, message, 400, errors);
  }

  /**
   * Send unauthorized response (401)
   */
  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden response (403)
   */
  static forbidden(res: Response, message = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  /**
   * Send not found response (404)
   */
  static notFound(res: Response, message = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  /**
   * Send conflict response (409)
   */
  static conflict(res: Response, message = 'Resource already exists'): Response {
    return this.error(res, message, 409);
  }

  /**
   * Send too many requests response (429)
   */
  static tooManyRequests(res: Response, message = 'Too many requests'): Response {
    return this.error(res, message, 429);
  }

  /**
   * Send internal error response (500)
   */
  static internalError(res: Response, message = 'Internal server error'): Response {
    return this.error(res, message, 500);
  }
}

export default ApiResponse;