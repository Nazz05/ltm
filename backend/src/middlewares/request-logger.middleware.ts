import { NextFunction, Request, Response } from "express";
import { observabilityService } from "../services/observability.service";

const sanitizePath = (url: string) => {
  const [path] = url.split("?");
  return path ?? "/";
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    const startedNs = req.requestStartedAtNs ?? process.hrtime.bigint();
    const durationMs = Number(process.hrtime.bigint() - startedNs) / 1_000_000;
    const path = sanitizePath(req.originalUrl || req.url);

    observabilityService.recordRequest({
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs,
    });

    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        requestId: req.requestId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        ip: req.ip,
      })
    );
  });

  next();
};
