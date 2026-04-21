/**
 * Slow Query Monitoring Service
 * Tracks and logs queries that exceed performance thresholds
 * File: src/services/slow-query-monitor.service.ts
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

interface SlowQueryLog {
  id?: number;
  queryType: string;
  entityType: string;
  executionTimeMs: number;
  queryHash: string;
  userId?: number;
  details?: string;
}

interface SlowQueryStats {
  totalQueries: number;
  avgExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
}

// Thresholds in milliseconds
const SLOW_QUERY_THRESHOLDS = {
  critical: 1000,    // > 1 second = CRITICAL
  warning: 500,      // > 500ms = WARNING
  info: 100          // > 100ms = INFO
};

class SlowQueryMonitorService {
  private logs: SlowQueryLog[] = [];
  private enableLogging = true;
  private batchSize = 10;

  /**
   * Record query execution time
   * Automatically logs if exceeds threshold
   */
  recordQuery(
    queryType: string,
    entityType: string,
    executionTimeMs: number,
    userId?: number,
    details?: string
  ): void {
    if (!this.enableLogging) return;

    // Determine severity
    let severity = 'info';
    if (executionTimeMs > SLOW_QUERY_THRESHOLDS.critical) {
      severity = 'critical';
    } else if (executionTimeMs > SLOW_QUERY_THRESHOLDS.warning) {
      severity = 'warning';
    }

    // Only log if it meets threshold
    if (executionTimeMs > SLOW_QUERY_THRESHOLDS.info) {
      const log: SlowQueryLog = {
        queryType,
        entityType,
        executionTimeMs,
        queryHash: this.generateQueryHash(queryType, entityType),
        ...(userId !== undefined && { userId }),
        details: `[${severity.toUpperCase()}] ${details || ''}`
      };

      this.logs.push(log);

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  SLOW QUERY (${severity}):`, {
          type: queryType,
          entity: entityType,
          time: `${executionTimeMs}ms`,
          user: userId
        });
      }

      // Batch insert to DB
      if (this.logs.length >= this.batchSize) {
        this.flushLogs();
      }
    }
  }

  /**
   * Flush pending logs to database
   */
  async flushLogs(): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      // Insert logs in batches
      const batch = this.logs.slice(0, this.batchSize);
      
      for (const log of batch) {
        await prisma.$executeRaw`
          INSERT INTO slow_query_log 
          (query_type, entity_type, execution_time_ms, query_hash, user_id, created_at)
          VALUES 
          (${log.queryType}, ${log.entityType}, ${log.executionTimeMs}, ${log.queryHash}, ${log.userId ?? null}, NOW())
        `;
      }

      this.logs = this.logs.slice(this.batchSize);
    } catch (error) {
      console.error('Error flushing slow query logs:', error);
    }
  }

  /**
   * Get slow query statistics
   */
  async getSlowQueryStats(
    timeWindowMinutes: number = 60,
    entityType?: string
  ): Promise<SlowQueryStats> {
    const query = entityType
      ? await prisma.$queryRaw<any[]>`
          SELECT 
            COUNT(*) as total_count,
            AVG(execution_time_ms) as avg_time,
            MAX(execution_time_ms) as max_time,
            MIN(execution_time_ms) as min_time
          FROM slow_query_log
          WHERE entity_type = ${entityType}
            AND created_at > NOW() - INTERVAL '${timeWindowMinutes} minutes'
        `
      : await prisma.$queryRaw<any[]>`
          SELECT 
            COUNT(*) as total_count,
            AVG(execution_time_ms) as avg_time,
            MAX(execution_time_ms) as max_time,
            MIN(execution_time_ms) as min_time
          FROM slow_query_log
          WHERE created_at > NOW() - INTERVAL '${timeWindowMinutes} minutes'
        `;

    const stats = query[0];
    return {
      totalQueries: Number(stats.total_count),
      avgExecutionTime: Number(stats.avg_time) || 0,
      maxExecutionTime: Number(stats.max_time) || 0,
      minExecutionTime: Number(stats.min_time) || 0
    };
  }

  /**
   * Get slowest queries
   */
  async getSlowestQueries(limit: number = 10): Promise<any[]> {
    return prisma.$queryRaw`
      SELECT 
        query_type as "queryType",
        entity_type as "entityType",
        execution_time_ms as "executionTimeMs",
        COUNT(*) as occurrences,
        AVG(execution_time_ms) as "avgTime",
        MAX(execution_time_ms) as "maxTime"
      FROM slow_query_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY query_type, entity_type, execution_time_ms
      ORDER BY execution_time_ms DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get per-entity slow query analysis
   */
  async getEntityWiseAnalysis(): Promise<any[]> {
    return prisma.$queryRaw`
      SELECT 
        entity_type as "entityType",
        COUNT(*) as "totalSlowQueries",
        AVG(execution_time_ms) as "avgExecutionTime",
        MAX(execution_time_ms) as "maxExecutionTime",
        MIN(execution_time_ms) as "minExecutionTime"
      FROM slow_query_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY entity_type
      ORDER BY "totalSlowQueries" DESC
    `;
  }

  /**
   * Get daily trend
   */
  async getDailyTrend(days: number = 7): Promise<any[]> {
    return prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as "queryCount",
        AVG(execution_time_ms) as "avgTime",
        MAX(execution_time_ms) as "maxTime"
      FROM slow_query_log
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
  }

  /**
   * Find duplicate slow queries (potential bottlenecks)
   */
  async findDuplicateSlowQueries(threshold: number = 5): Promise<any[]> {
    return prisma.$queryRaw`
      SELECT 
        query_hash as "queryHash",
        query_type as "queryType",
        entity_type as "entityType",
        COUNT(*) as "occurrences",
        AVG(execution_time_ms) as "avgTime",
        MAX(execution_time_ms) as "maxTime"
      FROM slow_query_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY query_hash, query_type, entity_type
      HAVING COUNT(*) >= ${threshold}
      ORDER BY "occurrences" DESC
    `;
  }

  /**
   * Get queries by severity level
   */
  async getQueriesBySeverity(
    level: 'critical' | 'warning' | 'info' = 'warning'
  ): Promise<any[]> {
    const threshold =
      level === 'critical'
        ? SLOW_QUERY_THRESHOLDS.critical
        : level === 'warning'
        ? SLOW_QUERY_THRESHOLDS.warning
        : SLOW_QUERY_THRESHOLDS.info;

    return prisma.$queryRaw`
      SELECT 
        query_type as "queryType",
        entity_type as "entityType",
        execution_time_ms as "executionTimeMs",
        created_at as "createdAt",
        COUNT(*) OVER (PARTITION BY query_type) as "similarCount"
      FROM slow_query_log
      WHERE execution_time_ms > ${threshold}
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY execution_time_ms DESC
      LIMIT 20
    `;
  }

  /**
   * Generate report
   */
  async generateReport(timeWindowHours: number = 24): Promise<string> {
    const stats = await this.getSlowQueryStats(timeWindowHours * 60);
    const slowest = await this.getSlowestQueries(5);
    const duplicates = await this.findDuplicateSlowQueries(3);
    const entityAnalysis = await this.getEntityWiseAnalysis();

    let report = `
${'='.repeat(60)}
SLOW QUERY ANALYSIS REPORT
Generated: ${new Date().toISOString()}
Time Window: Last ${timeWindowHours} hours
${'='.repeat(60)}

📊 STATISTICS
─────────────────────────────────────────────────────────
Total Slow Queries: ${stats.totalQueries}
Average Execution:  ${stats.avgExecutionTime.toFixed(2)}ms
Maximum Execution:  ${stats.maxExecutionTime.toFixed(2)}ms
Minimum Execution:  ${stats.minExecutionTime.toFixed(2)}ms

⚠️  TOP 5 SLOWEST QUERIES
─────────────────────────────────────────────────────────
${slowest
  .map(
    (q, i) => `
${i + 1}. ${q.queryType} (${q.entityType})
   Execution: ${q.executionTimeMs}ms
   Occurrences: ${q.occurrences}
   Average: ${q.avgTime.toFixed(2)}ms
`
  )
  .join('')}

🔄 REPEATED SLOW QUERIES (Potential Bottlenecks)
─────────────────────────────────────────────────────────
${duplicates
  .map(
    (q, i) => `
${i + 1}. ${q.queryType} (${q.entityType})
   Occurrences: ${q.occurrences}x
   Average Time: ${q.avgExecutionTime.toFixed(2)}ms
   Max Time: ${q.maxExecutionTime.toFixed(2)}ms
`
  )
  .join('')}

📈 BY ENTITY TYPE
─────────────────────────────────────────────────────────
${entityAnalysis
  .map(
    e => `
${e.entityType}:
  Count: ${e.totalSlowQueries}
  Avg: ${e.avgExecutionTime.toFixed(2)}ms
  Max: ${e.maxExecutionTime.toFixed(2)}ms
`
  )
  .join('')}

🎯 RECOMMENDATIONS
─────────────────────────────────────────────────────────
1. Review repeated slow queries for optimization
2. Add indexes for frequently filtered columns
3. Consider denormalization for read-heavy queries
4. Implement caching for expensive queries
5. Use database views for complex JOINs

${'='.repeat(60)}
`;
    return report;
  }

  /**
   * Enable/disable logging
   */
  setLoggingEnabled(enabled: boolean): void {
    this.enableLogging = enabled;
  }

  /**
   * Set batch size for database writes
   */
  setBatchSize(size: number): void {
    this.batchSize = size;
  }

  /**
   * Generate query hash for deduplication
   */
  private generateQueryHash(queryType: string, entityType: string): string {
    return crypto
      .createHash('sha256')
      .update(`${queryType}:${entityType}`)
      .digest('hex')
      .substring(0, 16);
  }
}

export const slowQueryMonitor = new SlowQueryMonitorService();
