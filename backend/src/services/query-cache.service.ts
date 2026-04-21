/**
 * Query Caching Service
 * Handles caching strategy for frequently accessed queries
 * File: src/services/query-cache.service.ts
 */

const CACHE_TTL = {
  SHORT: 60 * 1000,          // 1 minute - for frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - for product catalogs
  LONG: 30 * 60 * 1000,      // 30 minutes - for reports
  VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours - for static data
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private invalidationRules: Map<string, string[]> = new Map();

  constructor() {
    this.setupInvalidationRules();
  }

  /**
   * Setup cache invalidation cascade rules
   * When entity changes, invalidate dependent caches
   */
  private setupInvalidationRules() {
    // User changes → invalidate user order summary, spending report
    this.invalidationRules.set('user', [
      'user_orders_summary',
      'user_spending_report',
      'user_orders',
      'user_dashboard'
    ]);

    // Product changes → invalidate inventory, popularity, category performance
    this.invalidationRules.set('product', [
      'product_inventory_status',
      'product_popularity',
      'category_performance',
      'product_list',
      'product_details'
    ]);

    // Order changes → invalidate fulfillment, user spending
    this.invalidationRules.set('order', [
      'order_fulfillment_status',
      'user_spending_report',
      'user_orders_summary',
      'order_details'
    ]);

    // Payment changes → invalidate fulfillment status
    this.invalidationRules.set('payment', [
      'order_fulfillment_status',
      'order_details'
    ]);

    // Shipment changes → invalidate fulfillment status
    this.invalidationRules.set('shipment', [
      'order_fulfillment_status',
      'order_details'
    ]);
  }

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache by entity type cascade
   * @param entityType e.g., 'user', 'product', 'order'
   * @param entityId Optional - for targeted invalidation
   */
  invalidateByEntity(entityType: string, entityId?: number): void {
    const cacheKeys = this.invalidationRules.get(entityType) || [];
    
    for (const cacheKey of cacheKeys) {
      if (entityId) {
        // Invalidate specific entity cache
        const pattern = new RegExp(`${cacheKey}:${entityId}(?::|$)`);
        for (const key of this.cache.keys()) {
          if (pattern.test(key)) {
            this.cache.delete(key);
          }
        }
      } else {
        // Invalidate all caches of this type
        const pattern = new RegExp(`^${cacheKey}:`);
        for (const key of this.cache.keys()) {
          if (pattern.test(key)) {
            this.cache.delete(key);
          }
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      entries: this.cache.size,
      memory: this.estimateMemoryUsage()
    };
  }

  /**
   * Rough estimate of memory usage
   */
  private estimateMemoryUsage(): string {
    let bytes = 0;
    for (const [key, entry] of this.cache.entries()) {
      bytes += key.length * 2; // UTF-16 encoding
      try {
        // Custom replacer to handle BigInt
        bytes += JSON.stringify(entry.data, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ).length;
      } catch (e) {
        // Fallback: estimate based on object properties
        bytes += 100; // Conservative estimate for unknown data
      }
    }
    
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }
}

export const queryCacheService = new QueryCacheService();
export { CACHE_TTL };
export type { CacheEntry };
