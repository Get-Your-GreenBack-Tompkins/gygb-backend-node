import * as Status from "http-status-codes";

export class ApiError extends Error {
  name: string;
  status: number;
  error?: Error;

  constructor(message: string, status: number, error?: Error) {
    super(message);

    this.name = this.constructor.name;
    this.status = status;
    this.error = error;
  }

  // 404 Not Found
  static notFound(message: string) {
    return new ApiError(message, Status.NOT_FOUND);
  }

  // 500 Internal Server Error
  static internalError(message: string, error?: Error) {
    return new ApiError(message, Status.INTERNAL_SERVER_ERROR, error);
  }

  // 400 Invalid Request
  static invalidRequest(message: string) {
    return new ApiError(message, Status.BAD_REQUEST);
  }
}
