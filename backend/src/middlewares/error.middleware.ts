import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";

type ErrorResponse = {
  message: string;
  code: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  details?: unknown;
};

// Chuẩn hóa response lỗi để test dễ assert theo status/code/message/details.
const buildErrorResponse = (req: Request, statusCode: number, code: string, message: string, details?: unknown): ErrorResponse => {
  return {
    message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(details !== undefined ? { details } : {}),
  };
};

// Quy đổi lỗi Prisma phổ biến sang HTTP error có thể test.
const mapPrismaError = (err: unknown) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return new HttpError(409, "Duplicate resource", "CONFLICT", { target: err.meta?.target });
    }

    if (err.code === "P2025") {
      return new HttpError(404, "Resource not found", "NOT_FOUND");
    }

    if (err.code === "P2003") {
      return new HttpError(400, "Foreign key constraint failed", "VALIDATION_ERROR", {
        field: err.meta?.field_name,
      });
    }
  }

  return null;
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res
      .status(err.statusCode)
      .json(buildErrorResponse(_req, err.statusCode, err.code, err.message, err.details));
  }

  const prismaError = mapPrismaError(err);
  if (prismaError) {
    return res
      .status(prismaError.statusCode)
      .json(buildErrorResponse(_req, prismaError.statusCode, prismaError.code, prismaError.message, prismaError.details));
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res
      .status(400)
      .json(buildErrorResponse(_req, 400, "INVALID_JSON", "Invalid JSON body"));
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  return res
    .status(500)
    .json(buildErrorResponse(_req, 500, "INTERNAL_ERROR", message || "Internal server error"));
};

// Middleware cho route không tồn tại để test case 404 rõ ràng hơn.
export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json(
    buildErrorResponse(req, 404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`)
  );
};
