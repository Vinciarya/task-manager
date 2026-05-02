/**
 * Custom application error class for handled and unhandled exceptions.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Fix for inheritance in TypeScript when extending built-in classes
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture stack trace if available (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** 400 - Bad Request */
  static badRequest(message = "The request could not be understood or was missing required parameters."): AppError {
    return new AppError(message, 400);
  }

  /** 401 - Unauthorized */
  static unauthorized(message = "Authentication is required to access this resource."): AppError {
    return new AppError(message, 401);
  }

  /** 403 - Forbidden */
  static forbidden(message = "You do not have permission to perform this action."): AppError {
    return new AppError(message, 403);
  }

  /** 404 - Not Found */
  static notFound(message = "The requested resource could not be found."): AppError {
    return new AppError(message, 404);
  }

  /** 409 - Conflict */
  static conflict(message = "The request could not be completed due to a conflict with the current state of the resource."): AppError {
    return new AppError(message, 409);
  }

  /** 500 - Internal Server Error */
  static internal(message = "An unexpected error occurred on the server.", isOperational = false): AppError {
    return new AppError(message, 500, isOperational);
  }
}
