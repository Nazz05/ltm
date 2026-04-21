export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR";

// HttpError là lỗi có chủ đích trong nghiệp vụ, dùng để test theo status/code/message.
export class HttpError extends Error {
  statusCode: number;
  code: ErrorCode;
  details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode = "BAD_REQUEST",
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
