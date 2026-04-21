import { Request, Response } from "express";
import { env } from "../config/env";
import { observabilityService } from "../services/observability.service";

export const gatewayController = {
  health: (_req: Request, res: Response) => {
    return res.status(200).json({
      service: "LTWNC API Gateway",
      status: "ok",
      env: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  },

  metrics: (_req: Request, res: Response) => {
    return res.status(200).json({
      gateway: observabilityService.getMetricsSnapshot(),
    });
  },
};
