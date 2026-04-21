import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/rbac.middleware";
import { UserRole } from "@prisma/client";
import { adminController } from "../controllers/admin.controller";

export const adminRouter = Router();

// All admin routes require authentication and ADMIN role
adminRouter.use(requireAuth);
adminRouter.use(requireRoles(UserRole.ADMIN));

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

export default adminRouter;
