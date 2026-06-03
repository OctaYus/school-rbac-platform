/** Application error hierarchy. `status` maps to an HTTP-ish code for handlers. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Invalid input.",
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message, 400);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please slow down.") {
    super(message, 429);
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
