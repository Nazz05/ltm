type RequestLogInput = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

type StatusGroups = "2xx" | "3xx" | "4xx" | "5xx";

class ObservabilityService {
  private readonly startedAt = Date.now();
  private totalRequests = 0;
  private totalDurationMs = 0;
  private readonly byStatus: Record<StatusGroups, number> = {
    "2xx": 0,
    "3xx": 0,
    "4xx": 0,
    "5xx": 0,
  };
  private readonly byRoute = new Map<string, number>();

  private statusToGroup(statusCode: number): StatusGroups {
    if (statusCode >= 500) return "5xx";
    if (statusCode >= 400) return "4xx";
    if (statusCode >= 300) return "3xx";
    return "2xx";
  }

  recordRequest(input: RequestLogInput) {
    this.totalRequests += 1;
    this.totalDurationMs += input.durationMs;

    const statusGroup = this.statusToGroup(input.statusCode);
    this.byStatus[statusGroup] += 1;

    const routeKey = `${input.method} ${input.path}`;
    this.byRoute.set(routeKey, (this.byRoute.get(routeKey) ?? 0) + 1);
  }

  getMetricsSnapshot() {
    const uptimeMs = Date.now() - this.startedAt;
    const avgResponseMs = this.totalRequests > 0 ? this.totalDurationMs / this.totalRequests : 0;

    return {
      process: {
        pid: process.pid,
        uptimeSeconds: Math.floor(uptimeMs / 1000),
        memoryUsage: process.memoryUsage(),
      },
      traffic: {
        totalRequests: this.totalRequests,
        averageResponseMs: Number(avgResponseMs.toFixed(2)),
        byStatus: this.byStatus,
        topRoutes: Array.from(this.byRoute.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([route, hits]) => ({ route, hits })),
      },
      startedAt: new Date(this.startedAt).toISOString(),
    };
  }
}

export const observabilityService = new ObservabilityService();
