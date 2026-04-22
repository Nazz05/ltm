import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/rbac.middleware";
import { UserRole } from "@prisma/client";
import { adminController } from "../controllers/admin.controller";
import { productController } from "../controllers/product.controller";

export const adminRouter = Router();

// All admin routes require authentication and ADMIN role
adminRouter.use(requireAuth);
adminRouter.use(requireRoles(UserRole.ADMIN));

// ========== DASHBOARD ==========
// Get dashboard statistics
adminRouter.get("/dashboard", adminController.getDashboardStats);

// Get order status statistics
adminRouter.get("/orders/status/stats", adminController.getOrderStatusStats);

// ========== ORDERS ==========
// Get all orders
adminRouter.get("/orders", adminController.getAllOrders);

// Update order status
adminRouter.put("/orders/:id", adminController.updateOrderStatus);

// Delete order
adminRouter.delete("/orders/:id", adminController.deleteOrder);

// ========== REVENUE ==========
// Get revenue statistics
adminRouter.get("/revenue", adminController.getRevenueStats);

// ========== USERS ==========
// Get all users
adminRouter.get("/users", adminController.getAllUsers);

// Create user
adminRouter.post("/users", adminController.createUser);

// Update user
adminRouter.put("/users/:id", adminController.updateUser);

// Delete user
adminRouter.delete("/users/:id", adminController.deleteUser);

// ========== ADDRESSES ==========
// Get all addresses
adminRouter.get("/addresses", adminController.getAllAddresses);

// Update address
adminRouter.put("/addresses/:id", adminController.updateAddress);

// Delete address
adminRouter.delete("/addresses/:id", adminController.deleteAddress);

// ========== AUDIT LOGS ==========
// Get audit logs
adminRouter.get("/audit-logs", adminController.getAuditLogs);

// ========== PRODUCTS ==========
// Get product categories (must be before /:productId route)
adminRouter.get("/products/categories", productController.listCategories);

// Get all products
adminRouter.get("/products", productController.listProducts);

// Create product
adminRouter.post("/products", productController.createProduct);

// Update product
adminRouter.put("/products/:productId", productController.updateProduct);

// Delete product
adminRouter.delete("/products/:productId", productController.deleteProduct);
