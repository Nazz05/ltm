-- Step 5 Extended: Database Views & Query Optimization
-- Created: 2026-04-16
-- Purpose: Create views for complex queries, optimize JOIN operations

-- ============================================
-- PREREQUISITE: Create Missing Tables (if needed)
-- ============================================

-- Add deleted_at column to orders if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Check if stock_history table exists, create if not
CREATE TABLE IF NOT EXISTS stock_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    previous_quantity INTEGER,
    new_quantity INTEGER,
    change_type VARCHAR(50),
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Check if product_images table exists, create if not
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Check if payments table exists, create if not
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Check if shipments table exists, create if not
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    address VARCHAR(500),
    shipped_date TIMESTAMP,
    delivery_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================
-- 1. USER_ORDERS_SUMMARY VIEW
-- ============================================
-- Get user order summary with order details and item count
CREATE OR REPLACE VIEW user_orders_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    COUNT(o.id) as total_orders,
    COUNT(CASE WHEN o.status IN ('PENDING', 'CONFIRMED') THEN 1 END) as active_orders,
    COALESCE(SUM(o.total_price), 0) as total_spent,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.full_name;

-- ============================================
-- 2. PRODUCT_INVENTORY_STATUS VIEW
-- ============================================
-- Get product with latest stock information
CREATE OR REPLACE VIEW product_inventory_status AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.stock,
    c.name as category_name,
    COUNT(pi.id) as image_count,
    CASE 
        WHEN p.stock = 0 THEN 'OUT_OF_STOCK'
        WHEN p.stock < 10 THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END as inventory_status,
    (SELECT COUNT(*) FROM cart_items ci 
     JOIN carts c ON ci.cart_id = c.id 
     WHERE ci.product_id = p.id) as wishlist_count,
    COALESCE(sh.change_type, 'INITIAL') as last_stock_change
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
LEFT JOIN stock_history sh ON p.id = sh.product_id 
    AND sh.created_at = (SELECT MAX(created_at) FROM stock_history WHERE product_id = p.id)
WHERE p.deleted_at IS NULL AND p.is_active = true
GROUP BY p.id, p.name, p.slug, p.price, p.stock, c.name, sh.change_type;

-- ============================================
-- 3. ORDER_FULFILLMENT_STATUS VIEW
-- ============================================
-- Get order with payment and shipment status
CREATE OR REPLACE VIEW order_fulfillment_status AS
SELECT 
    o.id as order_id,
    o.user_id,
    u.email as user_email,
    u.full_name,
    o.status as order_status,
    COALESCE(p.payment_status, 'PENDING') as payment_status,
    COALESCE(s.status, 'PENDING') as shipment_status,
    o.total_price,
    COUNT(oi.id) as item_count,
    o.created_at,
    o.updated_at
FROM orders o
INNER JOIN users u ON o.user_id = u.id
LEFT JOIN payments p ON o.id = p.order_id
LEFT JOIN shipments s ON o.id = s.order_id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.user_id, u.email, u.full_name, o.status, p.payment_status, 
         s.status, o.total_price, o.created_at, o.updated_at;

-- ============================================
-- 4. PRODUCT_POPULARITY VIEW
-- ============================================
-- Get product sales analytics
CREATE OR REPLACE VIEW product_popularity AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.category_id,
    c.name as category_name,
    COUNT(DISTINCT oi.order_id) as total_sales,
    SUM(oi.quantity) as units_sold,
    ROUND(CAST(AVG(oi.price) AS NUMERIC), 2) as avg_price_sold,
    SUM(oi.price * oi.quantity) as revenue,
    MAX(o.created_at) as last_sold_date
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.deleted_at IS NULL
WHERE p.deleted_at IS NULL AND p.is_active = true
GROUP BY p.id, p.name, p.slug, p.category_id, c.name;

-- ============================================
-- 5. CATEGORY_PERFORMANCE VIEW
-- ============================================
-- Category sales performance
CREATE OR REPLACE VIEW category_performance AS
SELECT 
    c.id,
    c.name,
    c.slug,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT oi.order_id) as total_sales,
    SUM(oi.quantity) as units_sold,
    SUM(oi.price * oi.quantity) as revenue,
    ROUND(CAST(AVG(p.price) AS NUMERIC), 2) as avg_product_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL AND p.is_active = true
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name, c.slug;

-- ============================================
-- 6. USER_SPENDING_REPORT VIEW
-- ============================================
-- User spending analysis
CREATE OR REPLACE VIEW user_spending_report AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.created_at as registration_date,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(DISTINCT oi.id) as item_count,
    SUM(o.total_price) as total_spent,
    ROUND(CAST(AVG(o.total_price) AS NUMERIC), 2) as avg_order_value,
    MAX(o.created_at) as last_purchase_date,
    CASE 
        WHEN COUNT(o.id) = 0 THEN 'NEW_NO_PURCHASE'
        WHEN MAX(o.created_at) < (CURRENT_DATE - INTERVAL '30 days') THEN 'INACTIVE'
        WHEN COUNT(o.id) >= 5 THEN 'LOYAL'
        ELSE 'ACTIVE'
    END as customer_segment
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.deleted_at IS NULL
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.full_name, u.created_at;

-- ============================================
-- 7. SLOW_QUERY_LOG TABLE
-- ============================================
-- Log slow queries for monitoring
CREATE TABLE IF NOT EXISTS slow_query_log (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(100),
    entity_type VARCHAR(50),
    execution_time_ms BIGINT,
    query_hash VARCHAR(64),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_slow_query_type ON slow_query_log(query_type);
CREATE INDEX idx_slow_query_created ON slow_query_log(created_at DESC);
CREATE INDEX idx_slow_query_entity ON slow_query_log(entity_type);

-- ============================================
-- 8. QUERY_CACHE METADATA TABLE
-- ============================================
-- Track cache entries and TTL
CREATE TABLE IF NOT EXISTS query_cache_metadata (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    entity_type VARCHAR(50),
    ttl_seconds INT DEFAULT 300,
    last_invalidated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_entity_type ON query_cache_metadata(entity_type);
CREATE INDEX idx_cache_ttl ON query_cache_metadata(ttl_seconds);

-- ============================================
-- Add Indexes for Better VIEW Performance
-- ============================================
-- For user_orders_summary view
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status) WHERE deleted_at IS NULL;

-- For product_inventory_status view
CREATE INDEX IF NOT EXISTS idx_product_category_active ON products(category_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);

-- For order_fulfillment_status view
CREATE INDEX IF NOT EXISTS idx_order_user_dates ON orders(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_fulfillment ON orders(id, status) WHERE deleted_at IS NULL;

-- For product_popularity view
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- For user_spending_report
CREATE INDEX IF NOT EXISTS idx_user_registration_active ON users(created_at DESC) WHERE deleted_at IS NULL;

-- For payments and shipments
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

COMMIT;

SELECT 'Query Optimization Views & Tables Created Successfully!' as status;
