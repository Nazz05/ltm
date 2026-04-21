import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/rbac.middleware";

const orderRouter = Router();

// Route người dùng: checkout, xem đơn của bản thân, hủy đơn đúng điều kiện.
orderRouter.post("/checkout", requireAuth, orderController.checkout);
orderRouter.get("/my", requireAuth, orderController.listMyOrders);
orderRouter.get("/:orderId", requireAuth, orderController.getOrderDetail);
orderRouter.patch("/:orderId/cancel", requireAuth, orderController.cancelOrder);

// Route quản trị: quản lý danh sách đơn và cập nhật trạng thái.
orderRouter.get("/", requireAuth, requireRoles("ADMIN"), orderController.listOrders);
orderRouter.patch(
  "/:orderId/status",
  requireAuth,
  requireRoles("ADMIN"),
  orderController.updateOrderStatus
);

export default orderRouter;
