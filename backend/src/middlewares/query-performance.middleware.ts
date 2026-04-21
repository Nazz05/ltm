/**
 * Query Performance Middleware
 * Automatically tracks execution time of controllers
 * File: src/middlewares/query-performance.middleware.ts
 */

import { Request, Response, NextFunction } from 'express';
import { slowQueryMonitor } from '../services/slow-query-monitor.service';
import { queryCacheService } from '../services/query-cache.service';

interface RequestWithQuery extends Request {
  queryMetadata?: {
    startTime: number;
    entityType?: string;
    operation?: string;
  };
}

/**
 * Middleware to track query performance
 * Usage in app.ts: app.use(queryPerformanceMiddleware);
 */
export const queryPerformanceMiddleware = (
  req: RequestWithQuery,
  res: Response,
  next: NextFunction
) => {
  req.queryMetadata = {
    startTime: Date.now(),
    entityType: extractEntityType(req),
    operation: extractOperation(req)
  };

  // Override res.json to capture response time
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    const executionTime = Date.now() - req.queryMetadata!.startTime;
    const entityType = req.queryMetadata!.entityType || 'unknown';
    const operation = req.queryMetadata!.operation || 'request';

    // Log slow queries
    slowQueryMonitor.recordQuery(operation, entityType, executionTime, req.user?.id);

    // Add timing header
    res.set('X-Response-Time', `${executionTime}ms`);

    console.log(`[${operation}] ${entityType} - ${executionTime}ms`);

    return originalJson(data);
  };

  next();
};

/**
 * Extract entity type from request path
 * /api/products/:id → products
 */
function extractEntityType(req: Request): string {
  const path = req.path.split('/').filter(p => p);
  const lastSegment = path[path.length - 1];
  return lastSegment ?? 'unknown';
}

/**
 * Extract operation from request
 * GET /api/products → list_products
 * POST /api/products → create_product
 */
function extractOperation(req: Request): string {
  const method = req.method.toLowerCase();
  const entity = extractEntityType(req);
  
  const operations: { [key: string]: string } = {
    'get': `get_${entity}`,
    'post': `create_${entity}`,
    'put': `update_${entity}`,
    'patch': `update_${entity}`,
    'delete': `delete_${entity}`
  };

  return operations[method] || `${method}_${entity}`;
}

/**
 * Cache invalidation middleware
 * Automatically invalidates cache after mutations
 * Usage in POST/PUT/DELETE routes
 */
export const cacheInvalidationMiddleware = (entityType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Wrap res.json to invalidate after sending response
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        queryCacheService.invalidateByEntity(entityType);
        console.log(`✨ Invalidated cache for: ${entityType}`);
        return originalJson(data);
      };
    }

    next();
  };
};
