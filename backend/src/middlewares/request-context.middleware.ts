import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export const assignRequestContext = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = randomUUID();
  req.requestStartedAtNs = process.hrtime.bigint();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
