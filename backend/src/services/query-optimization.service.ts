/**
 * Query Optimization Service
 * Provides optimized database queries using views and proper JOINs
 * File: src/services/query-optimization.service.ts
 */

import { PrismaClient } from '@prisma/client';
import { queryCacheService, CACHE_TTL } from './query-cache.service';

const prisma = new PrismaClient();

interface OrderWithFulfillment {
  orderId: number;
  userEmail: string;
  fullName: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus: string;
  totalPrice: number;
  itemCount: number;
  createdAt: Date;
}

interface ProductWithInventory {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  categoryName: string;
  imageCount: number;
  inventoryStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';
  wishlistCount: number;
}

interface UserSpending {
  userId: number;
  email: string;
  fullName: string;
  registrationDate: Date;
  orderCount: number;
  itemCount: number;
  totalSpent: number;
  avgOrderValue: number;
  lastPurchaseDate?: Date;
  customerSegment: 'NEW_NO_PURCHASE' | 'INACTIVE' | 'LOYAL' | 'ACTIVE';
}

class QueryOptimizationService {
  /**
   * Get order with fulfillment status (Payment + Shipment)
   * Uses: order_fulfillment_status VIEW
   * Performance: Single query vs 3 separate queries
   */
  async getOrderWithFulfillment(orderId: number): Promise<OrderWithFulfillment | null> {
    const cacheKey = `order_fulfillment:${orderId}`;
    
    // Try cache first
    let result = queryCacheService.get<OrderWithFulfillment>(cacheKey);
    if (result) return result;

    // Query from view
    const orders = await prisma.$queryRaw<OrderWithFulfillment[]>`
      SELECT 
        order_id as "orderId",
        user_email as "userEmail",
        full_name as "fullName",
        order_status as "orderStatus",
        payment_status as "paymentStatus",
        shipment_status as "shipmentStatus",
        total_price as "totalPrice",
        item_count as "itemCount",
        created_at as "createdAt"
      FROM order_fulfillment_status
      WHERE order_id = ${orderId}
    `;

    result = orders[0] || null;
    if (result) {
      queryCacheService.set(cacheKey, result, CACHE_TTL.SHORT);
    }
    return result;
  }

  /**
   * Get product inventory status
   * Uses: product_inventory_status VIEW
   * Includes: images count, stock level, category
   */
  async getProductInventoryStatus(
    productId: number
  ): Promise<ProductWithInventory | null> {
    const cacheKey = `product_inventory:${productId}`;
    
    let result = queryCacheService.get<ProductWithInventory>(cacheKey);
    if (result) return result;

    const products = await prisma.$queryRaw<ProductWithInventory[]>`
      SELECT 
        id,
        name,
        slug,
        price,
        stock,
        category_name as "categoryName",
        image_count as "imageCount",
        inventory_status as "inventoryStatus",
        wishlist_count as "wishlistCount"
      FROM product_inventory_status
      WHERE id = ${productId}
    `;

    result = products[0] || null;
    if (result) {
      queryCacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
    }
    return result;
  }

  /**
   * Get products by category with inventory
   * Uses: product_inventory_status VIEW + category filter
   * Optimized: Single query, ordered, paginated
   */
  async getProductsByCategory(
    categoryId: number,
    skip: number = 0,
    take: number = 20,
    orderBy: 'price' | 'name' | 'stock' = 'name'
  ): Promise<ProductWithInventory[]> {
    const cacheKey = `category_products:${categoryId}:${skip}:${take}:${orderBy}`;
    
    let result = queryCacheService.get<ProductWithInventory[]>(cacheKey);
    if (result) return result;

    const orderByClause = {
      price: 'price ASC',
      name: 'name ASC',
      stock: 'stock DESC'
    }[orderBy];

    result = await prisma.$queryRaw<ProductWithInventory[]>`
      SELECT 
        id,
        name,
        slug,
        price,
        stock,
        category_name as "categoryName",
        image_count as "imageCount",
        inventory_status as "inventoryStatus",
        wishlist_count as "wishlistCount"
      FROM product_inventory_status
      WHERE category_name IS NOT NULL
      ORDER BY ${orderBy}
      LIMIT ${take} OFFSET ${skip}
    `;

    queryCacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  }

  /**
   * Get user spending report & customer segment
   * Uses: user_spending_report VIEW
   * Segment: NEW_NO_PURCHASE, INACTIVE, LOYAL, ACTIVE
   */
  async getUserSpendingReport(userId: number): Promise<UserSpending | null> {
    const cacheKey = `user_spending:${userId}`;
    
    let result = queryCacheService.get<UserSpending>(cacheKey);
    if (result) return result;

    const users = await prisma.$queryRaw<UserSpending[]>`
      SELECT 
        user_id as "userId",
        email,
        full_name as "fullName",
        registration_date as "registrationDate",
        order_count as "orderCount",
        item_count as "itemCount",
        total_spent as "totalSpent",
        avg_order_value as "avgOrderValue",
        last_purchase_date as "lastPurchaseDate",
        customer_segment as "customerSegment"
      FROM user_spending_report
      WHERE user_id = ${userId}
    `;

    result = users[0] || null;
    if (result) {
      queryCacheService.set(cacheKey, result, CACHE_TTL.LONG);
    }
    return result;
  }

  /**
   * Get popular products (sales ranking)
   * Uses: product_popularity VIEW
   * Performance: Efficient GROUP BY with CTE
   */
  async getPopularProducts(
    limit: number = 10
  ): Promise<any[]> {
    const cacheKey = `popular_products:${limit}`;
    
    const cached = queryCacheService.get(cacheKey);
    if (cached) return cached as any[];

    const result: any[] = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        slug,
        total_sales as "totalSales",
        units_sold as "unitsSold",
        revenue,
        avg_price_sold as "avgPriceSold"
      FROM product_popularity
      ORDER BY total_sales DESC
      LIMIT ${limit}
    ` as any[];

    queryCacheService.set(cacheKey, result, CACHE_TTL.LONG);
    return result;
  }

  /**
   * Get category performance metrics
   * Uses: category_performance VIEW
   */
  async getCategoryPerformance(): Promise<any[]> {
    const cacheKey = 'category_performance';
    
    const cached = queryCacheService.get(cacheKey);
    if (cached) return cached as any[];

    const result: any[] = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        slug,
        product_count as "productCount",
        total_sales as "totalSales",
        units_sold as "unitsSold",
        revenue,
        avg_product_price as "avgProductPrice"
      FROM category_performance
      ORDER BY revenue DESC
    ` as any[];

    queryCacheService.set(cacheKey, result, CACHE_TTL.LONG);
    return result;
  }

  /**
   * Get user orders summary (efficient user view)
   * Uses: user_orders_summary VIEW
   * Shows: order count, active orders, total spent
   */
  async getUserOrdersSummary(userId: number): Promise<any | null> {
    const cacheKey = `user_orders_summary:${userId}`;
    
    let result = queryCacheService.get(cacheKey);
    if (result) return result;

    const summaries = await prisma.$queryRaw`
      SELECT 
        user_id as "userId",
        email,
        full_name as "fullName",
        total_orders as "totalOrders",
        active_orders as "activeOrders",
        total_spent as "totalSpent",
        last_order_date as "lastOrderDate"
      FROM user_orders_summary
      WHERE user_id = ${userId}
    ` as any[];

    result = (summaries && summaries[0]) || null;
    if (result) {
      queryCacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
    }
    return result;
  }

  /**
   * Optimized: Get order with all details (JOIN optimization)
   * Instead of: 4 separate queries (order, items, payment, shipment)
   * Now: 1 efficient query
   */
  async getOrderDetailsOptimized(orderId: number): Promise<any> {
    const cacheKey = `order_details:${orderId}`;
    
    let result = queryCacheService.get(cacheKey);
    if (result) return result;

    // Single query with all JOINs
    const queryResult = await prisma.$queryRaw`
      SELECT 
        o.id,
        o.user_id as "userId",
        u.email,
        u.full_name as "fullName",
        o.status,
        o.total_price as "totalPrice",
        o.shipping_addr as "shippingAddress",
        o.phone_number as "phoneNumber",
        o.note,
        o.created_at as "createdAt",
        COUNT(DISTINCT oi.id) as "itemCount",
        COALESCE(p.payment_status, 'PENDING') as "paymentStatus",
        COALESCE(s.status, 'PENDING') as "shipmentStatus",
        s.tracking_number as "trackingNumber",
        s.carrier,
        json_agg(
          json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN shipments s ON o.id = s.order_id
      WHERE o.id = ${orderId}
      GROUP BY o.id, u.id, p.id, s.id
    ` as any[];

    if (queryResult && queryResult.length > 0) {
      const orderData = queryResult[0];
      queryCacheService.set(cacheKey, orderData, CACHE_TTL.SHORT);
      return orderData;
    }
    return null;
  }

  /**
   * Invalidate cache when data changes
   * Called from controllers after mutations
   */
  invalidateCache(entityType: string, entityId?: number): void {
    queryCacheService.invalidateByEntity(entityType, entityId);
  }

  /**
   * Clear all caches (use sparingly)
   */
  clearAllCache(): void {
    queryCacheService.clearAll();
  }
}

export const queryOptimizationService = new QueryOptimizationService();
